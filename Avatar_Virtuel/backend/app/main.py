"""FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text

from app.api.v1.endpoints import admin, chat, health
from app.config import get_settings
from app.core.security import limiter
from app.db.migrate import ensure_embedding_column
from app.db.models import Base
from app.db.session import engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("avatar")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    Path(settings.media_root).joinpath("audio").mkdir(parents=True, exist_ok=True)
    Path(settings.media_root).joinpath("video").mkdir(parents=True, exist_ok=True)

    # Ensure pgvector + tables
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
        # Additive migration: dual-source KB (qa | document)
        await conn.execute(
            text(
                """
                ALTER TABLE knowledge_chunks
                ADD COLUMN IF NOT EXISTS source_type VARCHAR(32) NOT NULL DEFAULT 'qa'
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE knowledge_chunks
                ADD COLUMN IF NOT EXISTS external_id INTEGER
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE knowledge_chunks
                ADD COLUMN IF NOT EXISTS chapitre_numero INTEGER
                """
            )
        )
        await conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_knowledge_source_type
                ON knowledge_chunks (source_type)
                """
            )
        )
        await ensure_embedding_column(conn)
        # HNSW may already exist after ensure_embedding_column
        await conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_knowledge_embedding_hnsw
                ON knowledge_chunks
                USING hnsw (embedding vector_cosine_ops)
                """
            )
        )
    logger.info("startup_complete env=%s", settings.app_env)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        docs_url="/docs" if settings.app_debug and not settings.is_production else None,
        redoc_url=None,
        lifespan=lifespan,
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # CORS — never * in production
    origins = settings.cors_origin_list
    if settings.is_production and ("*" in origins or not origins):
        logger.error("cors_misconfigured_production")
        origins = []

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-Admin-Key", "Authorization"],
    )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        logger.exception("unhandled_error path=%s", request.url.path)
        # Never leak stack traces to client in production
        detail = (
            str(exc)
            if settings.app_debug and not settings.is_production
            else "Une erreur interne est survenue."
        )
        return JSONResponse(status_code=500, content={"detail": detail})

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={"detail": "Données invalides."})

    app.include_router(health.router, prefix="/api/v1")
    app.include_router(chat.router, prefix="/api/v1")
    app.include_router(admin.router, prefix="/api/v1")

    media_root = Path(settings.media_root)
    media_root.mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=str(media_root)), name="media")

    return app


app = create_app()
