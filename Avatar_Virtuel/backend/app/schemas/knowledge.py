"""Pydantic schemas for knowledge admin endpoints."""
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class KnowledgeItemIn(BaseModel):
    chapitre: str = Field(..., min_length=1, max_length=255)
    question: str = Field(..., min_length=1, max_length=4000)
    reponse: str = Field(..., min_length=1, max_length=20000)
    langue: Literal["ar", "fr", "ary"] = "ar"
    source_type: Literal["qa", "document"] = "qa"
    source_page: Optional[str] = Field(default=None, max_length=128)
    external_id: Optional[int] = None
    chapitre_numero: Optional[int] = None

    @field_validator("question", "reponse", "chapitre")
    @classmethod
    def strip_fields(cls, v: str) -> str:
        return v.strip()


class KnowledgeBatchIn(BaseModel):
    items: list[KnowledgeItemIn] = Field(..., min_length=1, max_length=200)


class KnowledgeItemOut(BaseModel):
    id: UUID
    external_id: Optional[int] = None
    chapitre_numero: Optional[int] = None
    chapitre: str
    question: str
    reponse: str
    langue: str
    source_type: str = "qa"
    source_page: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeIngestResult(BaseModel):
    upserted: int
    skipped: int
    total: int
