"""Admin knowledge ingestion — protected by X-Admin-Key."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_admin_key
from app.db.session import get_db
from app.schemas.knowledge import KnowledgeBatchIn, KnowledgeIngestResult
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
