"""End-to-end chat pipeline orchestration."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import delete, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.core.prompts import FALLBACK_MESSAGES, SENSITIVE_FALLBACK
from app.db.models import ConversationSession, KnowledgeChunk, Message
from app.schemas.chat import ChatResponse
from app.services.avatar import get_avatar_service
from app.services.base import RagHit, RagResult
from app.services.followups import build_followups
from app.services.guardrails import get_guardrail_service
from app.services.intent import (
    classify_intent,
    conversational_reply_looks_unsafe,
    expand_followup_question,
    extract_programme_query,
    generate_clarification_reply,
    generate_conversational_reply,
    is_clarification,
    is_off_topic,
)
from app.services.language import get_language_service
from app.services.latency import finish_latency_profile, start_latency_profile, time_step
from app.services.llm import get_llm_service
from app.services.rag import PgVectorRAGService, keyword_overlap, lexical_similarity
from app.services.rerank import rerank_hits
from app.services.translate import translate_answer_to_language, translate_query_to_arabic
from app.services.tts import get_tts_service
from app.services.rag import hit_is_relevant

logger = logging.getLogger(__name__)

MAX_HISTORY_TURNS = 3  # 3 exchanges = up to 6 messages
_last_purge_mono: float = 0.0
_PURGE_EVERY_S = 120.0


async def purge_expired_sessions(db: AsyncSession) -> int:
    """Ephemeral session retention — best-effort, throttled (never block chat)."""
    global _last_purge_mono
    import time

    now_m = time.monotonic()
    if now_m - _last_purge_mono < _PURGE_EVERY_S:
        return 0
    _last_purge_mono = now_m
    try:
        await db.execute(text("SET LOCAL statement_timeout = '1500ms'"))
        now = datetime.now(timezone.utc)
        result = await db.execute(
            delete(ConversationSession).where(ConversationSession.expires_at < now)
        )
        return result.rowcount or 0
    except Exception:
        logger.warning("purge_expired_sessions_skipped", exc_info=True)
        await db.rollback()
        return 0


async def get_or_create_session(
    db: AsyncSession,
    session_id: Optional[UUID],
    client_hash: Optional[str],
) -> ConversationSession:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=settings.session_retention_hours)

    if session_id:
        session = await db.scalar(
            select(ConversationSession)
            .where(ConversationSession.id == session_id)
            .options(selectinload(ConversationSession.messages))
        )
        if session and session.expires_at > now:
            session.last_activity_at = now
            session.expires_at = expires
            return session

    session = ConversationSession(
        client_hash=client_hash,
        created_at=now,
        last_activity_at=now,
        expires_at=expires,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session, attribute_names=["messages"])
    return session


def _history_text(session: ConversationSession) -> str:
    msgs = sorted(session.messages or [], key=lambda m: m.created_at)
    recent = msgs[-(MAX_HISTORY_TURNS * 2) :]
    if not recent:
        return "(aucun)"
    lines = []
    for m in recent:
        role = "Citoyen" if m.role == "user" else "Candidat"
        lines.append(f"{role}: {m.content}")
    return "\n".join(lines)


async def _enrich_rag_hits(
    db: AsyncSession,
    question: str,
    hits: list[RagHit],
    best: RagHit,
) -> list[RagHit]:
    """Add same-theme chapter chunks so broad questions get enough material to develop."""
    q_lower = question.lower()
    chapter_filters: list = []

    if "شباب" in question or "jeune" in q_lower:
        chapter_filters.append(KnowledgeChunk.chapitre.contains("الشباب"))
    if any(t in question for t in ("نساء", "المرأة")) or "femme" in q_lower:
        chapter_filters.append(KnowledgeChunk.chapitre.contains("النساء"))

    if chapter_filters:
        stmt = select(KnowledgeChunk).where(or_(*chapter_filters)).limit(60)
    else:
        stmt = (
            select(KnowledgeChunk)
            .where(KnowledgeChunk.chapitre == best.chapitre)
            .limit(40)
        )

    rows = (await db.execute(stmt)).scalars().all()
    by_id = {h.chunk_id: h for h in hits}

    for row in rows:
        cid = str(row.id)
        if cid in by_id:
            continue
        kw = max(
            keyword_overlap(question, row.question or ""),
            keyword_overlap(question, (row.reponse or "")[:600]),
            0.85 * lexical_similarity(question, row.question or ""),
        )
        if kw < 0.12:
            continue
        by_id[cid] = RagHit(
            chunk_id=cid,
            chapitre=row.chapitre,
            question=row.question,
            reponse=row.reponse,
            langue=row.langue,
            score=min(0.92, 0.55 + kw),
            source_page=row.source_page,
            source_type=getattr(row, "source_type", None) or "qa",
        )

    return sorted(by_id.values(), key=lambda h: h.score or 0.0, reverse=True)[:3]


def _combine_rag_sources(best: RagHit, hits: list[RagHit], max_chunks: int = 2) -> str:
    """Merge nearby RAG hits so the LLM can produce richer, still faithful answers."""
    parts: list[str] = []
    seen: set[str] = set()
    best_score = best.score or 0.0
    threshold = max(0.55, get_settings().rag_similarity_threshold - 0.05)

    for hit in hits:
        if hit.chunk_id in seen:
            continue
        score = hit.score or 0.0
        if hit.chunk_id != best.chunk_id and (
            score < threshold or score < best_score - 0.15
        ):
            continue
        reponse = (hit.reponse or "").strip()
        if not reponse or reponse in parts:
            continue
        question = (hit.question or "").strip()
        block = f"Question : {question}\nRéponse : {reponse}" if question else reponse
        parts.append(block)
        seen.add(hit.chunk_id)
        if len(parts) >= max_chunks:
            break

    if not parts:
        return (best.reponse or "").strip()
    return "\n\n---\n\n".join(parts)


async def _run_programme_rag(
    db: AsyncSession,
    session: ConversationSession,
    question: str,
    language: str,
    generate_media: bool,
    include_followups: bool = True,
) -> ChatResponse:
    """Strict RAG path — retrieve from KB then reformulate in user language."""
    history = _history_text(session)
    search_question = question

    with time_step("followup_expand"):
        search_question = await expand_followup_question(question, history)

    with time_step("extract_query"):
        extracted = await extract_programme_query(search_question)
    if extracted:
        search_question = extracted

    async def _search_raw(q: str) -> RagResult:
        return await PgVectorRAGService(db).search(q)

    async def _merge_results(*results: RagResult) -> RagResult:
        by_id: dict[str, RagHit] = {}
        for res in results:
            for h in res.hits:
                prev = by_id.get(h.chunk_id)
                if prev is None or (h.score or 0) > (prev.score or 0):
                    by_id[h.chunk_id] = h
            # Also keep below-threshold best for soft fallback
            if not res.hits and res.best_score:
                continue
        if not by_id:
            # pick best among empty-ish results
            best_res = max(results, key=lambda r: r.best_score or 0.0)
            return best_res
        ranked = sorted(by_id.values(), key=lambda h: h.score or 0.0, reverse=True)
        threshold = get_settings().rag_similarity_threshold
        # Soft floor only for near-misses that still pass relevance later
        soft = max(0.48, threshold - 0.05)
        best_score = ranked[0].score if ranked else 0.0
        above = (best_score or 0) >= soft
        hits = ranked[: max(8, get_settings().rag_top_k)]
        return RagResult(hits=hits, best_score=best_score, above_threshold=above)

    with time_step("rag_multi"):
        # Primary search (FR/Darija paraphrases). Skip AR translate when already strong.
        primary = await _search_raw(search_question)
        searches: list[RagResult] = [primary]
        if language != "ar" and (primary.best_score or 0) < 0.78:
            with time_step("translate"):
                ar_q = await translate_query_to_arabic(search_question, language)
            if ar_q.strip() and ar_q.strip() != search_question.strip():
                searches.append(await _search_raw(ar_q))
        if search_question.strip() != question.strip():
            searches.append(await _search_raw(question))
        rag_result = await _merge_results(*searches)

    if rag_result.hits:
        enriched = await _enrich_rag_hits(
            db, search_question or question, rag_result.hits, rag_result.hits[0]
        )
        rag_result = RagResult(
            hits=enriched,
            best_score=enriched[0].score if enriched else rag_result.best_score,
            above_threshold=rag_result.above_threshold,
        )

    async def _maybe_followups(
        best_hit: RagHit | None, hits: list[RagHit], answered: str
    ) -> list[str]:
        if not include_followups:
            return []
        return await build_followups(
            db,
            language=language,
            best=best_hit,
            hits=hits,
            answered_question=answered,
            limit=3,
        )

    if not rag_result.above_threshold or not rag_result.hits:
        logger.info(
            "rag_chunk_retained outcome=fallback score=%s threshold=%.2f lang=%s",
            None if rag_result.best_score is None else round(rag_result.best_score, 4),
            get_settings().rag_similarity_threshold,
            language,
        )
        answer = FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES["fr"])
        followups = await _maybe_followups(None, [], question)
        return await _finalize(
            db,
            session,
            question,
            answer,
            language,
            similarity=rag_result.best_score,
            used_fallback=True,
            blocked=False,
            sources=[],
            generate_media=generate_media,
            source_type=None,
            followups=followups,
        )

    with time_step("rerank"):
        best = await rerank_hits(search_question or question, rag_result.hits)

    if not hit_is_relevant(
        search_question or question, best, get_settings().rag_similarity_threshold
    ):
        logger.info(
            "rag_chunk_retained outcome=fallback_irrelevant score=%s kw_gate lang=%s",
            None if best.score is None else round(best.score, 4),
            language,
        )
        answer = FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES["fr"])
        followups = await _maybe_followups(None, [], question)
        return await _finalize(
            db,
            session,
            question,
            answer,
            language,
            similarity=best.score,
            used_fallback=True,
            blocked=False,
            sources=[],
            generate_media=generate_media,
            source_type=None,
            followups=followups,
        )

    reponse_source = _combine_rag_sources(best, rag_result.hits)
    sources = list(dict.fromkeys([best.chapitre] + [h.chapitre for h in rag_result.hits[:3]]))
    logger.info(
        "rag_chunk_retained outcome=answer score=%.4f chunk_id=%s source_type=%s "
        "chapitre=%s lang=%s ranked_n=%s",
        best.score,
        best.chunk_id,
        best.source_type,
        best.chapitre,
        language,
        len(rag_result.hits),
    )

    llm = get_llm_service()
    with time_step("reformulate"):
        llm_result = await llm.reformulate(
            language, reponse_source, question, historique=history
        )
    guardrails = get_guardrail_service()

    if llm_result.text.strip():
        valid, answer = guardrails.validate_reformulation(
            llm_result.text, reponse_source, language
        )
        if not valid:
            logger.info("llm_reformulation_rejected lang=%s — keep usable answer", language)
            from app.services.guardrails import invented_numbers

            # Prefer LLM wording if it invents no numbers; else translate source
            if language != "ar" and not invented_numbers(
                reponse_source, llm_result.text
            ):
                answer = llm_result.text.strip()
            elif language == "ar":
                answer = reponse_source
            else:
                with time_step("translate_answer"):
                    answer = await translate_answer_to_language(
                        reponse_source, language
                    )
    else:
        # Never claim "no info" when RAG found a chunk
        logger.info("llm_empty_after_rag provider=%s — translate source", llm_result.provider)
        if language == "ar":
            answer = reponse_source
        else:
            with time_step("translate_answer"):
                answer = await translate_answer_to_language(reponse_source, language)

    # Last safety: empty answer must not become FALLBACK if we have source
    if not (answer or "").strip():
        answer = (
            reponse_source
            if language == "ar"
            else await translate_answer_to_language(reponse_source, language)
        )

    # Prefer longer LLM wording if pipeline fell back to a one-line KB snippet
    if llm_result.text.strip() and len((answer or "").split()) < 40:
        from app.services.guardrails import invented_numbers

        if not invented_numbers(reponse_source, llm_result.text):
            answer = llm_result.text.strip()

    with time_step("followups"):
        followups = await _maybe_followups(best, rag_result.hits, best.question)

    return await _finalize(
        db,
        session,
        question,
        answer,
        language,
        similarity=best.score,
        used_fallback=False,
        blocked=False,
        sources=sources,
        generate_media=generate_media,
        source_type=best.source_type,
        followups=followups,
    )


async def run_text_pipeline(
    db: AsyncSession,
    question: str,
    session_id: Optional[UUID],
    client_hash: Optional[str],
    language_hint: Optional[str] = None,
    generate_media: bool = True,
    include_followups: bool = True,
) -> ChatResponse:
    start_latency_profile()
    await purge_expired_sessions(db)

    language_svc = get_language_service()
    guardrails = get_guardrail_service()
    language = language_svc.detect(question, hint=language_hint)

    session = await get_or_create_session(db, session_id, client_hash)
    session.language = language

    user_msg = Message(
        session_id=session.id,
        role="user",
        content=question,
        language=language,
    )
    db.add(user_msg)
    await db.flush()

    blocked, block_msg = guardrails.check_input(question, language)
    if blocked:
        answer = block_msg or FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES["fr"])
        logger.info(
            "rag_chunk_retained outcome=blocked score=null lang=%s",
            language,
        )
        return await _finalize(
            db,
            session,
            question,
            answer,
            language,
            similarity=None,
            used_fallback=True,
            blocked=True,
            sources=[],
            generate_media=generate_media,
            source_type=None,
        )

    with time_step("intent_classify"):
        intent = await classify_intent(question)

    if intent == "sensible":
        answer = SENSITIVE_FALLBACK.get(language, SENSITIVE_FALLBACK["fr"])
        logger.info("rag_chunk_retained outcome=sensible_llm_rules lang=%s", language)
        return await _finalize(
            db,
            session,
            question,
            answer,
            language,
            similarity=None,
            used_fallback=True,
            blocked=True,
            sources=[],
            generate_media=generate_media,
            source_type=None,
        )

    if intent == "conversationnel":
        # Clarify previous answer instead of a random new RAG hit
        if is_clarification(question):
            msgs = sorted(session.messages or [], key=lambda m: m.created_at)
            prev_user = next(
                (m.content for m in reversed(msgs[:-1]) if m.role == "user"),
                "",
            )
            prev_asst = next(
                (m.content for m in reversed(msgs[:-1]) if m.role == "assistant"),
                "",
            )
            if prev_asst:
                with time_step("clarification_llm"):
                    clarified = await generate_clarification_reply(
                        language, prev_user, prev_asst, question
                    )
                if clarified and not conversational_reply_looks_unsafe(
                    clarified, allow_digits=True
                ):
                    # Allow digits in clarifications (they come from previous answer)
                    logger.info("rag_chunk_retained outcome=clarification lang=%s", language)
                    return await _finalize(
                        db,
                        session,
                        question,
                        clarified,
                        language,
                        similarity=None,
                        used_fallback=False,
                        blocked=False,
                        sources=[],
                        generate_media=generate_media,
                        source_type=None,
                    )
                # Soft clarify without LLM
                soft = {
                    "fr": f"Bien sûr — je reformule : {prev_asst}",
                    "ar": f"حسناً، أوضح أكثر: {prev_asst}",
                    "ary": f"واخا، نعاود بصيغة أبسط: {prev_asst}",
                }
                return await _finalize(
                    db,
                    session,
                    question,
                    soft.get(language, soft["fr"]),
                    language,
                    similarity=None,
                    used_fallback=False,
                    blocked=False,
                    sources=[],
                    generate_media=generate_media,
                    source_type=None,
                )

        # Hors-sujet clair → fallback (pas de RAG inventif)
        if is_off_topic(question):
            logger.info("rag_chunk_retained outcome=off_topic lang=%s", language)
            return await _finalize(
                db,
                session,
                question,
                FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES["fr"]),
                language,
                similarity=None,
                used_fallback=True,
                blocked=False,
                sources=[],
                generate_media=generate_media,
                source_type=None,
            )

        with time_step("conversational_llm"):
            conv = await generate_conversational_reply(language, question)
        if conv and not conversational_reply_looks_unsafe(conv):
            logger.info(
                "rag_chunk_retained outcome=conversational score=null lang=%s",
                language,
            )
            return await _finalize(
                db,
                session,
                question,
                conv,
                language,
                similarity=None,
                used_fallback=False,
                blocked=False,
                sources=[],
                generate_media=generate_media,
                source_type=None,
            )
        with time_step("extract_query"):
            extracted = await extract_programme_query(question)
        if extracted:
            logger.info(
                "conversational_reroute_to_rag reason=%s",
                "empty" if not conv else "unsafe_content",
            )
            return await _run_programme_rag(
                db,
                session,
                question,
                language,
                generate_media,
                include_followups=include_followups,
            )
        with time_step("conversational_llm"):
            conv2 = await generate_conversational_reply(language, question)
        if conv2 and not conversational_reply_looks_unsafe(conv2):
            return await _finalize(
                db,
                session,
                question,
                conv2,
                language,
                similarity=None,
                used_fallback=False,
                blocked=False,
                sources=[],
                generate_media=generate_media,
                source_type=None,
            )
        soft_fallback = {
            "fr": FALLBACK_MESSAGES["fr"],
            "ar": FALLBACK_MESSAGES["ar"],
            "ary": FALLBACK_MESSAGES["ary"],
        }
        return await _finalize(
            db,
            session,
            question,
            soft_fallback.get(language, soft_fallback["fr"]),
            language,
            similarity=None,
            used_fallback=True,
            blocked=False,
            sources=[],
            generate_media=generate_media,
            source_type=None,
        )

    return await _run_programme_rag(
        db,
        session,
        question,
        language,
        generate_media,
        include_followups=include_followups,
    )


async def _finalize(
    db: AsyncSession,
    session: ConversationSession,
    question: str,
    answer: str,
    language: str,
    similarity: Optional[float],
    used_fallback: bool,
    blocked: bool,
    sources: list[str],
    generate_media: bool,
    source_type: Optional[str] = None,
    followups: Optional[list[str]] = None,
) -> ChatResponse:
    audio_url = None
    video_url = None

    if generate_media and answer:
        tts = get_tts_service()
        with time_step("tts"):
            tts_result = await tts.synthesize(answer, language)
        if tts_result.success:
            audio_url = tts_result.url
            # Skip lip-sync when mock — saves time, UI already shows portrait
            if get_settings().avatar_provider.lower() != "mock":
                avatar = get_avatar_service()
                with time_step("avatar"):
                    avatar_result = await avatar.generate(
                        audio_url or "", answer, language=language
                    )
                if avatar_result.success:
                    video_url = avatar_result.url
                else:
                    logger.warning("avatar_degraded error=%s", avatar_result.error)
        else:
            logger.warning("tts_degraded error=%s", tts_result.error)

    assistant_msg = Message(
        session_id=session.id,
        role="assistant",
        content=answer,
        language=language,
        similarity_score=similarity,
        used_fallback=1 if used_fallback or blocked else 0,
        audio_url=audio_url,
        video_url=video_url,
    )
    db.add(assistant_msg)
    await db.flush()

    latency = finish_latency_profile()
    latency_out = latency if get_settings().app_debug else None

    return ChatResponse(
        session_id=session.id,
        question=question,
        answer=answer,
        language=language,
        similarity_score=similarity,
        used_fallback=used_fallback or blocked,
        blocked=blocked,
        audio_url=audio_url,
        video_url=video_url,
        sources=sources,
        source_type=source_type,
        followups=followups or [],
        latency=latency_out,
    )


async def simplify_answer(language: str, text: str) -> str:
    llm = get_llm_service()
    if hasattr(llm, "simplify"):
        result = await llm.simplify(language, text)  # type: ignore[attr-defined]
        return (result.text or text).strip()
    return text
