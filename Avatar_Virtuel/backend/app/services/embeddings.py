"""Gemini embeddings — gemini-embedding-001 (Matryoshka 768-d)."""
from __future__ import annotations

import asyncio
import hashlib
import logging
import time
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

# Process-local query cache (demo / free-tier friendly).
_EMBED_CACHE: dict[str, tuple[float, list[float]]] = {}
_CACHE_TTL_S = 3600.0
_CACHE_MAX = 256


def _l2_normalize(vec: list[float]) -> list[float]:
    norm = sum(x * x for x in vec) ** 0.5 or 1.0
    return [x / norm for x in vec]


def _cache_key(text: str, task_type: str, model: str, dims: int) -> str:
    raw = f"{model}|{dims}|{task_type}|{text.strip().lower()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


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
        now = time.monotonic()

        async def _one(text: str) -> list[float]:
            key = _cache_key(text, task_type, self.model, self.dimensions)
            cached = _EMBED_CACHE.get(key)
            if cached and now - cached[0] < _CACHE_TTL_S:
                return cached[1]

            def _call() -> list[float]:
                kwargs = {
                    "model": self.model,
                    "content": text,
                    "task_type": task_type,
                }
                try:
                    resp = genai.embed_content(
                        **kwargs, output_dimensionality=self.dimensions
                    )
                except TypeError:
                    resp = genai.embed_content(**kwargs)
                values = list(resp["embedding"])
                if len(values) > self.dimensions:
                    values = values[: self.dimensions]
                return _l2_normalize(values)

            # Hard cap — never block the chat for tens of seconds on free-tier 429.
            vec = await asyncio.wait_for(asyncio.to_thread(_call), timeout=8.0)
            if len(_EMBED_CACHE) >= _CACHE_MAX:
                oldest = min(_EMBED_CACHE.items(), key=lambda kv: kv[1][0])[0]
                _EMBED_CACHE.pop(oldest, None)
            _EMBED_CACHE[key] = (time.monotonic(), vec)
            return vec

        out: list[list[float]] = []
        for i, t in enumerate(texts):
            delay = 0.4
            last_exc: Exception | None = None
            for attempt in range(2):
                try:
                    out.append(await _one(t))
                    last_exc = None
                    break
                except Exception as exc:
                    last_exc = exc
                    name = type(exc).__name__
                    msg = str(exc).lower()
                    if (
                        "resourceexhausted" in name.lower()
                        or "429" in msg
                        or "quota" in msg
                        or isinstance(exc, asyncio.TimeoutError)
                    ):
                        logger.warning(
                            "embedding_retry attempt=%s err=%s",
                            attempt + 1,
                            type(exc).__name__,
                        )
                        await asyncio.sleep(delay)
                        delay = min(delay * 2, 1.5)
                        continue
                    raise
            if last_exc is not None:
                raise last_exc
            if i + 1 < len(texts):
                await asyncio.sleep(0.05)
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
