"""Analytics — event storage and admin aggregates."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import AnalyticsEvent, ConversationSession, Message
from app.schemas.analytics import (
    AnalyticsStatsOut,
    DailyCount,
    EventRowOut,
    EventsListOut,
    MessageRowOut,
    MessagesListOut,
)

logger = logging.getLogger(__name__)

_TRUNC = 500


def _since(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=max(1, min(days, 90)))


async def record_event(
    db: AsyncSession,
    *,
    event_type: str,
    client_hash: str | None = None,
    path: str | None = None,
    source: str | None = None,
    language: str | None = None,
    question: str | None = None,
    answer_preview: str | None = None,
    session_id=None,
    used_fallback: bool | None = None,
    similarity_score: float | None = None,
) -> None:
    row = AnalyticsEvent(
        event_type=event_type[:64],
        client_hash=client_hash,
        path=(path or source or "")[:256] or None,
        source=(source or "")[:64] or None,
        language=(language or "")[:16] or None,
        question=(question or "")[:_TRUNC] or None,
        answer_preview=(answer_preview or "")[:_TRUNC] or None,
        session_id=session_id,
        used_fallback=used_fallback,
        similarity_score=similarity_score,
    )
    db.add(row)


async def record_chat_exchange(
    db: AsyncSession,
    *,
    client_hash: str | None,
    session_id,
    question: str,
    answer: str,
    language: str | None,
    used_fallback: bool,
    similarity_score: float | None,
) -> None:
    await record_event(
        db,
        event_type="avatar_question",
        client_hash=client_hash,
        path="/avatar",
        language=language,
        question=question,
        answer_preview=answer,
        session_id=session_id,
        used_fallback=used_fallback,
        similarity_score=similarity_score,
    )


async def purge_old_events(db: AsyncSession) -> int:
    settings = get_settings()
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.analytics_retention_days)
    try:
        result = await db.execute(
            delete(AnalyticsEvent).where(AnalyticsEvent.created_at < cutoff)
        )
        return result.rowcount or 0
    except Exception:
        logger.warning("purge_analytics_events_skipped", exc_info=True)
        await db.rollback()
        return 0


async def get_stats(db: AsyncSession, days: int = 7) -> AnalyticsStatsOut:
    since = _since(days)

    unique_visitors = await db.scalar(
        select(func.count(func.distinct(AnalyticsEvent.client_hash))).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.client_hash.isnot(None),
        )
    ) or 0

    avatar_sessions = await db.scalar(
        select(func.count(func.distinct(ConversationSession.id))).where(
            ConversationSession.created_at >= since
        )
    ) or 0

    questions_asked = await db.scalar(
        select(func.count()).where(
            Message.created_at >= since,
            Message.role == "user",
        )
    ) or 0

    answers_given = await db.scalar(
        select(func.count()).where(
            Message.created_at >= since,
            Message.role == "assistant",
        )
    ) or 0

    fallback_answers = await db.scalar(
        select(func.count()).where(
            Message.created_at >= since,
            Message.role == "assistant",
            Message.used_fallback > 0,
        )
    ) or 0

    pdf_downloads = await db.scalar(
        select(func.count()).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.event_type == "pdf_download",
        )
    ) or 0

    page_views = await db.scalar(
        select(func.count()).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.event_type == "page_view",
        )
    ) or 0

    avatar_page_views = await db.scalar(
        select(func.count()).where(
            AnalyticsEvent.created_at >= since,
            AnalyticsEvent.event_type == "page_view",
            AnalyticsEvent.path == "/avatar",
        )
    ) or 0

    lang_rows = (
        await db.execute(
            select(Message.language, func.count())
            .where(Message.created_at >= since, Message.role == "user")
            .group_by(Message.language)
        )
    ).all()
    questions_by_language = {
        (lang or "unknown"): count for lang, count in lang_rows
    }

    events_by_day = await _daily_counts(db, AnalyticsEvent.created_at, since)
    questions_by_day = await _daily_question_counts(db, since)

    return AnalyticsStatsOut(
        period_days=days,
        unique_visitors=unique_visitors,
        avatar_sessions=avatar_sessions,
        questions_asked=questions_asked,
        answers_given=answers_given,
        fallback_answers=fallback_answers,
        pdf_downloads=pdf_downloads,
        page_views=page_views,
        avatar_page_views=avatar_page_views,
        questions_by_language=questions_by_language,
        events_by_day=events_by_day,
        questions_by_day=questions_by_day,
    )


async def _daily_counts(db: AsyncSession, column, since: datetime) -> list[DailyCount]:
    rows = (
        await db.execute(
            select(
                func.date_trunc("day", column).label("day"),
                func.count(),
            )
            .where(column >= since)
            .group_by(text("1"))
            .order_by(text("1"))
        )
    ).all()
    return [
        DailyCount(date=day.date().isoformat(), count=count)
        for day, count in rows
        if day is not None
    ]


async def _daily_question_counts(db: AsyncSession, since: datetime) -> list[DailyCount]:
    rows = (
        await db.execute(
            select(
                func.date_trunc("day", Message.created_at).label("day"),
                func.count(),
            )
            .where(Message.created_at >= since, Message.role == "user")
            .group_by(text("1"))
            .order_by(text("1"))
        )
    ).all()
    return [
        DailyCount(date=day.date().isoformat(), count=count)
        for day, count in rows
        if day is not None
    ]


async def list_messages(
    db: AsyncSession, *, limit: int = 50, offset: int = 0
) -> MessagesListOut:
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    total = (
        await db.scalar(
            select(func.count()).select_from(Message).where(Message.role == "user")
        )
        or 0
    )

    user_msgs = (
        await db.execute(
            select(Message)
            .where(Message.role == "user")
            .order_by(Message.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    ).scalars().all()

    items: list[MessageRowOut] = []
    for user_msg in user_msgs:
        answer = await db.scalar(
            select(Message.content)
            .where(
                Message.session_id == user_msg.session_id,
                Message.role == "assistant",
                Message.created_at > user_msg.created_at,
            )
            .order_by(Message.created_at.asc())
            .limit(1)
        )
        meta = await db.scalar(
            select(Message)
            .where(
                Message.session_id == user_msg.session_id,
                Message.role == "assistant",
                Message.created_at > user_msg.created_at,
            )
            .order_by(Message.created_at.asc())
            .limit(1)
        )
        items.append(
            MessageRowOut(
                id=user_msg.id,
                session_id=user_msg.session_id,
                question=user_msg.content,
                answer=answer or "",
                language=user_msg.language,
                similarity_score=meta.similarity_score if meta else None,
                used_fallback=bool(meta.used_fallback) if meta else False,
                created_at=user_msg.created_at,
            )
        )

    return MessagesListOut(total=total, items=items)


async def list_events(
    db: AsyncSession, *, limit: int = 50, offset: int = 0, event_type: str | None = None
) -> EventsListOut:
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    count_stmt = select(func.count()).select_from(AnalyticsEvent)
    list_stmt = select(AnalyticsEvent)
    if event_type:
        count_stmt = count_stmt.where(AnalyticsEvent.event_type == event_type)
        list_stmt = list_stmt.where(AnalyticsEvent.event_type == event_type)

    total = await db.scalar(count_stmt) or 0

    rows = (
        await db.execute(
            list_stmt.order_by(AnalyticsEvent.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    ).scalars().all()

    return EventsListOut(
        total=total,
        items=[
            EventRowOut(
                id=r.id,
                event_type=r.event_type,
                path=r.path,
                source=r.source,
                language=r.language,
                question=r.question,
                created_at=r.created_at,
            )
            for r in rows
        ],
    )
