"""Translate user questions to Modern Standard Arabic for RAG retrieval only."""
from __future__ import annotations

import asyncio
import logging
import re

from app.config import get_settings
from app.core.prompts import build_query_translation_prompt

logger = logging.getLogger(__name__)


def _retry_seconds(exc: BaseException, default: float = 20.0) -> float:
    msg = str(exc)
    m = re.search(r"retry in ([0-9]+(?:\.[0-9]+)?)s", msg, re.IGNORECASE)
    if m:
        return min(float(m.group(1)) + 1.0, 90.0)
    return default


async def translate_query_to_arabic(question: str, source_language: str) -> str:
    """
    Faithful translation FR/Darija → Arabic (MSA) for RAG search only.
    Returns the original question if already Arabic or if translation fails.
    """
    if source_language == "ar":
        return question

    settings = get_settings()
    if not settings.gemini_api_key or settings.gemini_api_key.startswith("your-"):
        logger.warning("translate_skip reason=missing_gemini_key")
        return question

    prompt = build_query_translation_prompt(question, source_language)
    model_name = settings.translation_model

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(
            model_name,
            generation_config={
                "temperature": 0.0,
                "max_output_tokens": 128,
            },
        )

        last_exc: Exception | None = None
        response = None
        for attempt in range(2):
            try:
                response = await asyncio.to_thread(model.generate_content, prompt)
                last_exc = None
                break
            except Exception as exc:
                last_exc = exc
                msg = str(exc).lower()
                if "resourceexhausted" in type(exc).__name__.lower() or "429" in msg or "quota" in msg:
                    delay = min(_retry_seconds(exc, default=8.0), 15.0)
                    logger.warning(
                        "translate_rate_limited model=%s attempt=%s sleep=%.1fs",
                        model_name,
                        attempt + 1,
                        delay,
                    )
                    await asyncio.sleep(delay)
                    continue
                raise
        if last_exc is not None or response is None:
            raise last_exc or RuntimeError("translation failed")

        translated = (response.text or "").strip()
        if translated.startswith('"') and translated.endswith('"'):
            translated = translated[1:-1].strip()
        if translated.lower().startswith("traduction:"):
            translated = translated.split(":", 1)[1].strip()
        if not translated:
            logger.warning("translate_empty_result")
            return question
        logger.info(
            "translate_ok model=%s src_lang=%s src_len=%s dst_len=%s",
            model_name,
            source_language,
            len(question),
            len(translated),
        )
        return translated
    except Exception:
        logger.exception("translate_failed falling_back_to_original")
        return question


async def translate_answer_to_language(
    text: str,
    target_language: str,
) -> str:
    """Translate a RAG source answer into the citizen language (FR / AR / Darija)."""
    if not (text or "").strip():
        return text
    if target_language == "ar":
        return text.strip()

    settings = get_settings()
    if not settings.gemini_api_key or settings.gemini_api_key.startswith("your-"):
        return text.strip()

    lang_note = {
        "fr": "français clair et oral (1 à 3 phrases)",
        "ary": "darija marocaine naturelle en alphabet arabe (1 à 3 phrases)",
    }.get(target_language, "français clair")

    prompt = f"""Traduis fidèlement cette réponse du programme en {lang_note}.
Règles : conserve TOUS les chiffres et faits, n'ajoute rien, pas d'intro.
Texte :
{text.strip()}
"""
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(
            settings.translation_model or settings.llm_model,
            generation_config={"temperature": 0.0, "max_output_tokens": 220},
        )
        response = await asyncio.to_thread(model.generate_content, prompt)
        out = (response.text or "").strip()
        return out or text.strip()
    except Exception:
        logger.exception("translate_answer_failed")
        return text.strip()
