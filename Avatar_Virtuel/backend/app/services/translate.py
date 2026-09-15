"""Translate user questions to Modern Standard Arabic for RAG retrieval only."""
from __future__ import annotations

import logging

from app.config import get_settings
from app.core.prompts import build_query_translation_prompt
from app.services.gemini_client import gemini_generate_content, has_gemini_api_key

logger = logging.getLogger(__name__)


async def translate_query_to_arabic(question: str, source_language: str) -> str:
    """
    Faithful translation FR/Darija → Arabic (MSA) for RAG search only.
    Returns the original question if already Arabic or if translation fails.
    """
    if source_language == "ar":
        return question

    settings = get_settings()
    if not has_gemini_api_key():
        logger.warning("translate_skip reason=missing_gemini_key")
        return question

    prompt = build_query_translation_prompt(question, source_language)
    model_name = settings.translation_model

    try:
        translated, key_label = await gemini_generate_content(
            prompt=prompt,
            model_name=model_name,
            generation_config={"temperature": 0.0, "max_output_tokens": 128},
            timeout=15.0,
        )
        logger.info("translate_key=%s", key_label)
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
    if not has_gemini_api_key():
        return text.strip()

    lang_note = {
        "fr": "français clair et oral (4 à 6 phrases)",
        "ary": "darija marocaine naturelle (4–6 جمل)",
    }.get(target_language, "français clair")

    prompt = f"""Traduis fidèlement cette réponse du programme en {lang_note}.
Règles : traduction uniquement — conserve TOUS les chiffres, dates et faits, n'invente RIEN, n'ajoute RIEN.
Texte :
{text.strip()}
"""
    try:
        out, _key_label = await gemini_generate_content(
            prompt=prompt,
            model_name=settings.translation_model or settings.llm_model,
            generation_config={"temperature": 0.0, "max_output_tokens": 400},
            timeout=25.0,
        )
        return out or text.strip()
    except Exception:
        logger.exception("translate_answer_failed")
        return text.strip()
