"""Intent routing: conversationnel vs programme (heuristic first, LLM fallback)."""
from __future__ import annotations

import asyncio
import logging
import re

from app.config import get_settings
from app.core.prompts import (
    build_clarification_prompt,
    build_conversational_prompt,
    build_followup_expand_prompt,
    build_intent_classification_prompt,
    build_programme_query_extract_prompt,
)
from app.services.guardrails import extract_numbers

logger = logging.getLogger(__name__)

Intent = str  # "programme" | "conversationnel" | "sensible"

# Conversational replies should stay short; long = likely programme leakage
_MAX_CONV_CHARS = 320
_MAX_CONV_WORDS = 55

_GREETING_ONLY = re.compile(
    r"^[\s\W]*(salam|salut|bonjour|bonsoir|hello|hi|hey|merci|thanks|thank you|"
    r"au revoir|bye|bslama|beslama|labas|bikhir|cv\b|ça va|ca va|"
    r"السلام|مرحبا|أهلا|شكرا|بسلامة|بخير|لاباس|كيف حالك|واش بخير)"
    r"[\s\W]*$",
    re.IGNORECASE,
)

_MIXED_GREETING = re.compile(
    r"^(salam|salut|bonjour|bonsoir|السلام|مرحبا|أهلا)\b",
    re.IGNORECASE,
)

_PROGRAMME_CUES = re.compile(
    r"(programme|economie|économie|emploi|santé|sante|eau|éducation|education|"
    r"اقتصاد|تشغيل|صحة|ماء|تعليم|كيفاش|شنو|واش|pourquoi|comment|combien|"
    r"quel|quelle|mesure|proposition|فلاحة|طاقة|مقاول|bghit|نعرف)",
    re.IGNORECASE,
)

# Routing-only risk cues — if present, force LLM safety classify (not a blocklist answer)
_RISK_CUES = re.compile(
    r"(kill|tuer|bombe|attentat|suicide|drogue|porn|jailbreak|"
    r"اغتيال|تفجير|قتل|مخدر|إباحي|رقم\s*هاتف|adresse\s*perso|cin\b)",
    re.IGNORECASE,
)


def conversational_reply_looks_unsafe(text: str, *, allow_digits: bool = False) -> bool:
    """True if free reply likely invents programme facts → force RAG re-route."""
    cleaned = (text or "").strip()
    if not cleaned:
        return True
    if not allow_digits:
        if re.search(r"\d|[\u0660-\u0669\u06F0-\u06F9]", cleaned):
            return True
        if extract_numbers(cleaned):
            return True
    if len(cleaned) > _MAX_CONV_CHARS:
        return True
    if len(cleaned.split()) > _MAX_CONV_WORDS:
        return True
    return False


_CLARIFY = re.compile(
    r"(pas\s+compris|j[' ]?ai\s+pas\s+compris|je\s+comprends\s+pas|"
    r"explique|clarifie|plus\s+clair|repete|répète|what\s+do\s+you\s+mean|"
    r"ما\s*فهمتش|ما\s*فهمت|وضح|عاود|اشرح|شنو\s*قصدتي|ما\s*فهمتش)",
    re.IGNORECASE,
)


def is_clarification(question: str) -> bool:
    q = (question or "").strip()
    if not q or len(q) > 80:
        return False
    return bool(_CLARIFY.search(q))


_SHORT_FOLLOWUP = re.compile(
    r"^(et|aussi|donc|mais|و|حتى|حتى\s+ل|بالنسبة|pour|and|also)\b|"
    r"^(et\s+pour|aussi\s+pour|و\s*بالنسبة|حتى\s+ل)",
    re.IGNORECASE,
)


def looks_like_followup(question: str) -> bool:
    q = (question or "").strip()
    if not q:
        return False
    if len(q) <= 90 and _SHORT_FOLLOWUP.search(q):
        return True
    if len(q) <= 40 and ("?" in q or "؟" in q) and len(q.split()) <= 8:
        # very short relative question
        return True
    return False


async def expand_followup_question(question: str, historique: str) -> str:
    """Rewrite short follow-ups into a full standalone question using history."""
    if not looks_like_followup(question) or not historique or historique == "(aucun)":
        return question
    prompt = build_followup_expand_prompt(question, historique)
    try:
        raw = await _gemini_short(prompt, temperature=0.0, max_output_tokens=80)
        cleaned = (raw or "").strip().strip('"').strip()
        if cleaned and len(cleaned) > 5:
            logger.info(
                "followup_expanded src=%r dst=%r",
                question[:60],
                cleaned[:80],
            )
            return cleaned
    except Exception:
        logger.exception("followup_expand_failed")
    return question


def heuristic_intent(question: str) -> Intent | None:
    """
    Fast path:
    - obvious greetings / clarifications → conversationnel
    - clear programme cue without risk cue → programme
    - otherwise → None (LLM rules)
    """
    q = (question or "").strip()
    if not q:
        return "conversationnel"
    if _GREETING_ONLY.match(q):
        return "conversationnel"
    if is_clarification(q):
        return "conversationnel"
    if _RISK_CUES.search(q):
        return None
    if _PROGRAMME_CUES.search(q) or "?" in q or "؟" in q:
        return "programme"
    return None


def needs_query_extract(question: str) -> bool:
    """Only call extract LLM when greeting likely mixed with substance."""
    q = (question or "").strip()
    if not q or len(q) < 12:
        return False
    return bool(_MIXED_GREETING.search(q)) and bool(_PROGRAMME_CUES.search(q))


def _parse_intent(raw: str) -> Intent:
    token = (raw or "").strip().lower()
    token = re.split(r"[\s,.;:!?]+", token, maxsplit=1)[0]
    if token.startswith("sensib") or "حساس" in (raw or "") or "sensible" in token:
        return "sensible"
    if "conversation" in token or token in {"conv", "chat", "social"}:
        return "conversationnel"
    if "programme" in token or token in {"program", "rag", "policy"}:
        return "programme"
    if "محادثة" in (raw or "") or "تحية" in (raw or ""):
        return "conversationnel"
    return "programme"


async def _gemini_short(
    prompt: str,
    *,
    temperature: float,
    max_output_tokens: int,
) -> str:
    settings = get_settings()
    if not settings.gemini_api_key or settings.gemini_api_key.startswith("your-"):
        return ""
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        settings.translation_model,
        generation_config={
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        },
    )
    response = await asyncio.to_thread(model.generate_content, prompt)
    return (response.text or "").strip()


async def classify_intent(question: str) -> Intent:
    """Heuristic first, then light LLM. Defaults to 'programme' on failure."""
    fast = heuristic_intent(question)
    if fast is not None:
        logger.info("intent_classified intent=%s source=heuristic", fast)
        return fast

    prompt = build_intent_classification_prompt(question)
    try:
        raw = await _gemini_short(prompt, temperature=0.0, max_output_tokens=16)
        intent = _parse_intent(raw)
        logger.info("intent_classified intent=%s raw=%r", intent, (raw or "")[:40])
        return intent
    except Exception:
        logger.exception("intent_classify_failed default=programme")
        return "programme"


async def extract_programme_query(question: str) -> str | None:
    """
    For programme-bound messages that mix chitchat + substance, return the
    substance only (same language). None means no programme substance found.
    """
    if not needs_query_extract(question):
        return question

    prompt = build_programme_query_extract_prompt(question)
    try:
        raw = await _gemini_short(prompt, temperature=0.0, max_output_tokens=120)
        cleaned = (raw or "").strip().strip('"').strip()
        if not cleaned or cleaned.upper() == "NONE":
            logger.info("programme_query_extract empty")
            return None
        logger.info(
            "programme_query_extract ok src_len=%s dst_len=%s",
            len(question),
            len(cleaned),
        )
        return cleaned
    except Exception:
        logger.exception("programme_query_extract_failed")
        return question


async def generate_clarification_reply(
    language: str,
    previous_question: str,
    previous_answer: str,
    user_message: str,
) -> str:
    prompt = build_clarification_prompt(
        language, previous_question, previous_answer, user_message
    )
    try:
        text = await _gemini_short(prompt, temperature=0.2, max_output_tokens=160)
        return (text or "").strip()
    except Exception:
        logger.exception("clarification_reply_failed")
        return ""


async def generate_conversational_reply(language: str, question: str) -> str:
    """Free natural reply about the assistant role — no programme source."""
    prompt = build_conversational_prompt(language, question)
    try:
        text = await _gemini_short(prompt, temperature=0.55, max_output_tokens=120)
        logger.info(
            "conversational_reply_ok lang=%s len=%s",
            language,
            len(text or ""),
        )
        return (text or "").strip()
    except Exception:
        logger.exception("conversational_reply_failed")
        return ""
