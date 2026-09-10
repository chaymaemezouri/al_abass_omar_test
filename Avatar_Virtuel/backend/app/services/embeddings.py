"""Gemini embeddings — gemini-embedding-001 (Matryoshka 768-d)."""
from __future__ import annotations

import asyncio
import hashlib
import logging
from typing import Literal

from app.config import get_settings
from app.services.base import EmbeddingService

logger = logging.getLogger(__name__)

TaskType = Literal[
    "retrieval_document",
    "retrieval_query",
    "semantic_similarity",
    "classification",
    "clustering",
]


def _l2_normalize(vec: list[float]) -> list[float]:
    norm = sum(x * x for x in vec) ** 0.5 or 1.0
    return [x / norm for x in vec]


class GeminiEmbeddingService(EmbeddingService):
    """
    Google AI `gemini-embedding-001` with output_dimensionality=768 (MRL).
    Use task_type=retrieval_document for ingestion, retrieval_query for user questions.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self.model = settings.embedding_model
        if not self.model.startswith("models/"):
            self.model = f"models/{self.model}"
        self.dimensions = settings.embedding_dimensions

    async def embed(
        self,
        texts: list[str],
        *,
        task_type: str = "retrieval_document",
    ) -> list[list[float]]:
        if not texts:
            return []
        if not self.api_key or self.api_key.startswith("your-"):
            raise RuntimeError("GEMINI_API_KEY manquante pour les embeddings")

        import google.generativeai as genai

        genai.configure(api_key=self.api_key)

        async def _one(text: str) -> list[float]:
            def _call() -> list[float]:
                # output_dimensionality uses Matryoshka Representation Learning
                kwargs = {
                    "model": self.model,
                    "content": text,
                    "task_type": task_type,
                }
                # Newer google-generativeai accepts output_dimensionality
                try:
                    resp = genai.embed_content(
                        **kwargs, output_dimensionality=self.dimensions
                    )
                except TypeError:
                    resp = genai.embed_content(**kwargs)
                values = list(resp["embedding"])
                if len(values) > self.dimensions:
                    values = values[: self.dimensions]
                # Always L2-normalize after truncation (Google recommendation)
                return _l2_normalize(values)

            return await asyncio.to_thread(_call)

        # Sequential with pacing + retry on free-tier 429
        out: list[list[float]] = []
        for i, t in enumerate(texts):
            delay = 1.0
            last_exc: Exception | None = None
            for attempt in range(8):
                try:
                    out.append(await _one(t))
                    last_exc = None
                    break
                except Exception as exc:
                    last_exc = exc
                    name = type(exc).__name__
                    msg = str(exc).lower()
                    if "resourceexhausted" in name.lower() or "429" in msg or "quota" in msg:
                        logger.warning(
                            "embedding_rate_limited attempt=%s sleep=%.1fs",
                            attempt + 1,
                            delay,
                        )
                        await asyncio.sleep(delay)
                        delay = min(delay * 2, 60.0)
                        continue
                    raise
            if last_exc is not None:
                raise last_exc
            # Free-tier: stay under ~60–100 embed RPM
            if i + 1 < len(texts):
                await asyncio.sleep(1.2)
        return out


class LocalHashEmbeddingService(EmbeddingService):
    """Offline fallback only — not for production quality."""

    def __init__(self, dimensions: int = 768) -> None:
        self.dimensions = dimensions

    async def embed(
        self,
        texts: list[str],
        *,
        task_type: str = "retrieval_document",
    ) -> list[list[float]]:
        _ = task_type
        out: list[list[float]] = []
        for t in texts:
            vec = [0.0] * self.dimensions
            tokens = t.lower().split() or [""]
            for tok in tokens:
                h = hashlib.sha256(tok.encode("utf-8")).digest()
                for i in range(0, min(len(h), 32)):
                    idx = (h[i] * 7 + i * 13) % self.dimensions
                    vec[idx] += (h[i] / 255.0) * 2 - 1
            out.append(_l2_normalize(vec))
        return out


def get_embedding_service() -> EmbeddingService:
    settings = get_settings()
    provider = settings.embedding_provider.lower()
    if provider == "local":
        return LocalHashEmbeddingService(settings.embedding_dimensions)
    if not settings.gemini_api_key or settings.gemini_api_key.startswith("your-"):
        logger.warning("embedding_fallback_local reason=missing_gemini_key")
        return LocalHashEmbeddingService(settings.embedding_dimensions)
    return GeminiEmbeddingService()
