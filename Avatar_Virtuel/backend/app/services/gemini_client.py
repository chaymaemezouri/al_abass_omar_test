"""Gemini API helpers — primary key with optional fallback on quota errors."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)


def list_gemini_api_keys() -> list[str]:
    settings = get_settings()
    keys: list[str] = []
    for raw in (settings.gemini_api_key, settings.gemini_api_key_fallback):
        k = (raw or "").strip()
        if not k or k.startswith("your-"):
            continue
        if k not in keys:
            keys.append(k)
    return keys


def has_gemini_api_key() -> bool:
    return bool(list_gemini_api_keys())


def is_gemini_quota_error(exc: BaseException) -> bool:
    name = type(exc).__name__.lower()
    msg = str(exc).lower()
    return (
        "resourceexhausted" in name
        or "429" in msg
        or "quota" in msg
        or "rate limit" in msg
        or "too many requests" in msg
    )


async def gemini_generate_content(
    *,
    prompt: str,
    model_name: str,
    generation_config: dict[str, Any] | None = None,
    timeout: float = 25.0,
) -> tuple[str, str]:
    """
    Call Gemini generate_content with primary key, then fallback on quota errors.
    Returns (text, key_label) where key_label is 'primary' or 'fallback'.
    """
    keys = list_gemini_api_keys()
    if not keys:
        raise RuntimeError("GEMINI_API_KEY manquante")

    last_exc: Exception | None = None
    for i, api_key in enumerate(keys):
        label = "primary" if i == 0 else "fallback"
        try:
            import google.generativeai as genai

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name,
                generation_config=generation_config or {},
            )
            response = await asyncio.wait_for(
                asyncio.to_thread(model.generate_content, prompt),
                timeout=timeout,
            )
            return (response.text or "").strip(), label
        except Exception as exc:
            last_exc = exc
            if is_gemini_quota_error(exc) and i + 1 < len(keys):
                logger.warning(
                    "gemini_key_failover from=%s model=%s err=%s",
                    label,
                    model_name,
                    type(exc).__name__,
                )
                continue
            raise
    raise last_exc or RuntimeError("gemini_generate_failed")


def _l2_normalize(vec: list[float]) -> list[float]:
    norm = sum(x * x for x in vec) ** 0.5 or 1.0
    return [x / norm for x in vec]


def gemini_embed_sync(
    *,
    api_key: str,
    model: str,
    text: str,
    task_type: str,
    dimensions: int,
) -> list[float]:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    kwargs: dict[str, Any] = {
        "model": model,
        "content": text,
        "task_type": task_type,
    }
    try:
        resp = genai.embed_content(**kwargs, output_dimensionality=dimensions)
    except TypeError:
        resp = genai.embed_content(**kwargs)
    values = list(resp["embedding"])
    if len(values) > dimensions:
        values = values[:dimensions]
    return _l2_normalize(values)
