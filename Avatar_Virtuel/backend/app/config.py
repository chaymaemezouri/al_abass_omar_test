"""Application configuration via Pydantic Settings (.env)."""
from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    app_debug: bool = False
    app_name: str = "Avatar Virtuel Al Abass Omar"
    secret_key: str = Field(default="insecure-dev-key-change-me")

    admin_api_key: str = Field(default="change-me-admin-key-min-32-chars-xxxxxxxx")

    cors_origins: str = "http://localhost:3000"

    postgres_user: str = "avatar_app"
    postgres_password: str = "change-me"
    postgres_db: str = "avatar_kb"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    database_url: str = (
        "postgresql+asyncpg://avatar_app:change-me@localhost:5432/avatar_kb"
    )

    rate_limit_chat: str = "20/minute"
    rate_limit_audio: str = "10/minute"

    session_retention_hours: int = 24

    rag_similarity_threshold: float = 0.65
    rag_top_k: int = 3
    # Ranking window before picking the single answer chunk (must be >= rag_top_k)
    rag_fetch_multiplier: int = 5
    embedding_provider: str = "gemini"
    embedding_model: str = "gemini-embedding-001"
    embedding_dimensions: int = 768

    llm_provider: str = "gemini"
    llm_model: str = "gemini-3.6-flash"
    # Lightweight model for FR/Darija → AR query translation (separate quota when possible)
    translation_model: str = "gemini-3.5-flash-lite"
    gemini_api_key: str = ""
    anthropic_api_key: str = ""

    stt_provider: str = "faster_whisper"
    stt_model_size: str = "small"
    whisper_api_key: str = ""

    tts_provider: str = "edge"
    tts_voice_fr: str = "fr-FR-HenriNeural"
    tts_voice_ar: str = "ar-MA-JamalNeural"
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    avatar_provider: str = "mock"
    heygen_api_key: str = ""
    heygen_avatar_id: str = ""
    # Optional overrides; if empty, HeyGen look default / sensible FR-AR voices are used.
    heygen_voice_id: str = ""
    heygen_voice_id_fr: str = "f2e07fa46261456b9eea3b35ae8f24ce"  # Antoine
    heygen_voice_id_ar: str = "ee8d15f1254b4f8691cba4c663e0c005"  # Arabic male
    did_api_key: str = ""
    did_source_url: str = ""

    media_root: str = "./media"
    max_audio_upload_mb: int = 15

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _strip_origins(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in {"production", "prod"}

    @property
    def max_audio_bytes(self) -> int:
        return self.max_audio_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
