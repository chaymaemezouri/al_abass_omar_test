"""Public analytics beacons — page views, PDF downloads."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.security import get_client_hash, limiter
from app.db.session import get_db
from app.schemas.analytics import AnalyticsEventIn
from app.services.analytics import record_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["events"])

_ALLOWED = frozenset({"page_view", "pdf_download"})


@router.post("")
@limiter.limit(get_settings().rate_limit_events)
async def track_event(
    request: Request,
    body: AnalyticsEventIn,
    db: AsyncSession = Depends(get_db),
):
    if body.event not in _ALLOWED:
        return {"ok": False, "detail": "event not allowed"}

    await record_event(
        db,
        event_type=body.event,
        client_hash=get_client_hash(request),
        path=body.path,
        source=body.source,
        language=body.language,
    )
    await db.commit()
    return {"ok": True}
