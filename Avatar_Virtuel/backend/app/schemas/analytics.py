"""Pydantic schemas for analytics events and admin dashboard."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AnalyticsEventIn(BaseModel):
    event: str = Field(..., max_length=64)
    path: str | None = Field(default=None, max_length=256)
    source: str | None = Field(default=None, max_length=64)
    language: str | None = Field(default=None, max_length=16)


class DailyCount(BaseModel):
    date: str
    count: int


class AnalyticsStatsOut(BaseModel):
    period_days: int
    unique_visitors: int
    avatar_sessions: int
    questions_asked: int
    answers_given: int
    fallback_answers: int
    pdf_downloads: int
    page_views: int
    avatar_page_views: int
    questions_by_language: dict[str, int]
    events_by_day: list[DailyCount]
    questions_by_day: list[DailyCount]


class MessageRowOut(BaseModel):
    id: UUID
    session_id: UUID
    question: str
    answer: str
    language: str | None
    similarity_score: float | None
    used_fallback: bool
    created_at: datetime


class MessagesListOut(BaseModel):
    total: int
    items: list[MessageRowOut]


class EventRowOut(BaseModel):
    id: UUID
    event_type: str
    path: str | None
    source: str | None
    language: str | None
    question: str | None
    created_at: datetime


class EventsListOut(BaseModel):
    total: int
    items: list[EventRowOut]
