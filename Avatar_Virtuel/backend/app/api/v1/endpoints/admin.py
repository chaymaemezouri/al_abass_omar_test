"""Admin knowledge ingestion — protected by X-Admin-Key."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_admin_key
from app.db.session import get_db
from app.schemas.analytics import AnalyticsStatsOut, EventsListOut, MessagesListOut
from app.schemas.knowledge import KnowledgeBatchIn, KnowledgeIngestResult
from app.services.analytics import get_stats, list_events, list_messages
from app.services.rag import PgVectorRAGService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


@router.post(
    "/knowledge",
    response_model=KnowledgeIngestResult,
    dependencies=[Depends(require_admin_key)],
)
async def upsert_knowledge(
    body: KnowledgeBatchIn,
    db: AsyncSession = Depends(get_db),
) -> KnowledgeIngestResult:
    rag = PgVectorRAGService(db)
    upserted = 0
    skipped = 0
    for item in body.items:
        _, created = await rag.upsert_chunk(
            chapitre=item.chapitre,
            question=item.question,
            reponse=item.reponse,
            langue=item.langue,
            source_type=item.source_type,
            source_page=item.source_page,
            external_id=item.external_id,
            chapitre_numero=item.chapitre_numero,
        )
        if created:
            upserted += 1
        else:
            skipped += 1
    logger.info("admin_knowledge_upsert upserted=%s skipped=%s", upserted, skipped)
    return KnowledgeIngestResult(
        upserted=upserted, skipped=skipped, total=len(body.items)
    )


@router.get(
    "/stats",
    response_model=AnalyticsStatsOut,
    dependencies=[Depends(require_admin_key)],
)
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    days: int = Query(default=7, ge=1, le=90),
) -> AnalyticsStatsOut:
    return await get_stats(db, days=days)


@router.get(
    "/messages",
    response_model=MessagesListOut,
    dependencies=[Depends(require_admin_key)],
)
async def admin_messages(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> MessagesListOut:
    return await list_messages(db, limit=limit, offset=offset)


@router.get(
    "/events",
    response_model=EventsListOut,
    dependencies=[Depends(require_admin_key)],
)
async def admin_events(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_type: str | None = Query(default=None),
) -> EventsListOut:
    return await list_events(db, limit=limit, offset=offset, event_type=event_type)
