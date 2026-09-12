"""Pydantic schemas for chat endpoints."""
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ChatTextRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[UUID] = None
    language_hint: Optional[Literal["fr", "ar", "ary"]] = None
    include_media: bool = True

    @field_validator("question")
    @classmethod
    def strip_question(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("La question ne peut pas être vide")
        return cleaned


class ChatResponse(BaseModel):
    session_id: UUID
    question: str
    answer: str
    language: str
    similarity_score: Optional[float] = None
    used_fallback: bool = False
    blocked: bool = False
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    sources: list[str] = Field(default_factory=list)
    source_type: Optional[str] = None  # "qa" | "document" — useful for local QA
    followups: list[str] = Field(default_factory=list)
    latency: Optional[dict] = None  # debug: per-step seconds when APP_DEBUG=true


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    language: Literal["fr", "ar", "ary"] = "fr"

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Le texte ne peut pas être vide")
        return cleaned


class SpeakResponse(BaseModel):
    audio_url: Optional[str] = None
    success: bool = False


class AvatarMediaRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    language: Literal["fr", "ar", "ary"] = "fr"

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Le texte ne peut pas être vide")
        return cleaned


class AvatarMediaResponse(BaseModel):
    video_url: Optional[str] = None
    success: bool = False
    provider: Optional[str] = None
    error: Optional[str] = None


class SimplifyRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    language: Literal["fr", "ar", "ary"] = "fr"
    session_id: Optional[UUID] = None

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Le texte ne peut pas être vide")
        return cleaned


class SimplifyResponse(BaseModel):
    answer: str
    language: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str = "1.0.0"
    database: str = "unknown"
