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


class HourlyCount(BaseModel):
    hour: str
    count: int


class HourOfDayCount(BaseModel):
    hour: int
    count: int


class DailyActivity(BaseModel):
    date: str
    page_views: int
    questions: int
    pdf_downloads: int
    total_events: int


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
    questions_today: int
    page_views_today: int
    pdf_downloads_today: int
    questions_by_language: dict[str, int]
    pdf_downloads_by_source: dict[str, int]
    events_by_day: list[DailyCount]
    questions_by_day: list[DailyCount]
    page_views_by_day: list[DailyCount]
    pdf_downloads_by_day: list[DailyCount]
    questions_by_hour: list[HourlyCount]
    page_views_by_hour: list[HourlyCount]
    pdf_downloads_by_hour: list[HourlyCount]
    questions_by_hour_of_day: list[HourOfDayCount]
    page_views_by_hour_of_day: list[HourOfDayCount]
    daily_activity: list[DailyActivity]


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
