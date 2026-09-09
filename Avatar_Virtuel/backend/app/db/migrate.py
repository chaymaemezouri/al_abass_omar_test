"""Schema helpers — pgvector dimension migration."""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.config import get_settings


async def ensure_embedding_column(conn: AsyncConnection) -> None:
    """
    Ensure knowledge_chunks.embedding is vector(N) matching EMBEDDING_DIMENSIONS.
    Recreates the column if the dimension changed (e.g. 1536 → 768).
    """
    dims = get_settings().embedding_dimensions
    row = (
        await conn.execute(
            text(
                """
                SELECT format_type(a.atttypid, a.atttypmod) AS typ
                FROM pg_attribute a
                JOIN pg_class c ON a.attrelid = c.oid
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE c.relname = 'knowledge_chunks'
                  AND a.attname = 'embedding'
                  AND NOT a.attisdropped
                """
            )
        )
    ).mappings().first()

    expected = f"vector({dims})"
    current = (row["typ"] if row else None) or ""

    if current == expected:
        return

    await conn.execute(text("DROP INDEX IF EXISTS ix_knowledge_embedding_hnsw"))
    if row:
        await conn.execute(text("ALTER TABLE knowledge_chunks DROP COLUMN embedding"))
    await conn.execute(
        text(f"ALTER TABLE knowledge_chunks ADD COLUMN embedding vector({dims})")
    )
    await conn.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_knowledge_embedding_hnsw
            ON knowledge_chunks
            USING hnsw (embedding vector_cosine_ops)
            """
        )
    )
