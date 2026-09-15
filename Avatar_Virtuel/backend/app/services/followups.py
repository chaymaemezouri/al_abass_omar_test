"""Related follow-up suggestions from the knowledge base (same chapter / RAG neighbors)."""
from __future__ import annotations

import asyncio
import logging
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import KnowledgeChunk
from app.services.base import RagHit

logger = logging.getLogger(__name__)


async def _localize_questions(questions: list[str], language: str) -> list[str]:
    """Keep AR/Darija as Arabic; translate batch to French when needed."""
    if not questions:
        return []
    if language in {"ar", "ary"}:
        return questions[:3]

    settings = get_settings()
    from app.services.gemini_client import gemini_generate_content, has_gemini_api_key

    if not has_gemini_api_key():
        return questions[:3]

    numbered = "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions[:3]))
    prompt = f"""Traduis ces questions du programme électoral en français clair et court.
Une question par ligne, même ordre, sans numéros, sans guillemets, sans commentaire.

{numbered}
"""
    try:
        raw, _label = await gemini_generate_content(
            prompt=prompt,
            model_name=settings.translation_model,
            generation_config={"temperature": 0.0, "max_output_tokens": 220},
            timeout=15.0,
        )
        lines = [
            re.sub(r"^\d+[\).\:\-]\s*", "", ln).strip().strip('"')
            for ln in raw.splitlines()
            if ln.strip()
        ]
        if len(lines) >= 2:
            return lines[:3]
    except Exception:
        logger.exception("followups_translate_failed")
    return questions[:3]


async def build_followups(
    db: AsyncSession,
    *,
    language: str,
    best: RagHit | None,
    hits: list[RagHit],
    answered_question: str,
    limit: int = 3,
) -> list[str]:
    """
    Suggest related questions from RAG neighbors + same chapter QA.
    Grounded in KB — not free invention.
    """
    seen: set[str] = set()
    raw: list[str] = []

    def _add(q: str | None) -> None:
        cleaned = (q or "").strip()
        if not cleaned or len(cleaned) < 8:
            return
        key = cleaned.lower()
        if key in seen:
            return
        if answered_question and cleaned == answered_question.strip():
            return
        if best and cleaned == (best.question or "").strip():
            return
        seen.add(key)
        raw.append(cleaned)

    best_q = (best.question or "").strip() if best else ""

    for h in hits:
        if best and (h.question or "").strip() == best_q:
            continue
        if h.source_type == "qa" or (h.question or "").strip():
            _add(h.question)
        if len(raw) >= limit:
            break

    if best and best.chapitre and len(raw) < limit:
        rows = (
            await db.execute(
                select(KnowledgeChunk.question)
                .where(
                    KnowledgeChunk.source_type == "qa",
                    KnowledgeChunk.chapitre == best.chapitre,
                )
                .order_by(KnowledgeChunk.external_id.asc().nulls_last())
                .limit(16)
            )
        ).scalars().all()
        if len(rows) < 2 and best.chapitre:
            token = best.chapitre.split(" و", 1)[0].strip()
            if len(token) >= 4:
                rows = (
                    await db.execute(
                        select(KnowledgeChunk.question)
                        .where(
                            KnowledgeChunk.source_type == "qa",
                            KnowledgeChunk.chapitre.contains(token),
                        )
                        .order_by(KnowledgeChunk.external_id.asc().nulls_last())
                        .limit(16)
                    )
                ).scalars().all()
        for q in rows:
            _add(q)
            if len(raw) >= limit:
                break

    if len(raw) < limit:
        # Generic safe starters from other chapters
        fallback_ar = [
            "ما هي المحاور الثلاثة الكبرى للأرضية الانتخابية؟",
            "ما هدف تحلية المياه المحدد لسنة 2030؟",
            "ماذا تقترح الأرضية الانتخابية لتشغيل الشباب؟",
        ]
        for q in fallback_ar:
            _add(q)
            if len(raw) >= limit:
                break

    return await _localize_questions(raw[:limit], language)
