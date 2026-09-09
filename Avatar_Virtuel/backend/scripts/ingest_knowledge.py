"""Idempotent dual-source knowledge ingestion.

Sources:
  - QA JSON  → data/knowledge_base/qa/questions_reponses.json
  - Document → data/knowledge_base/documents/*.pdf (أرضية انتخابية / programme_electoral.pdf)

Usage:
  python -m scripts.ingest_knowledge              # both
  python -m scripts.ingest_knowledge --qa-only
  python -m scripts.ingest_knowledge --doc-only
  python -m scripts.ingest_knowledge --qa PATH --document PATH
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.migrate import ensure_embedding_column
from app.db.models import Base
from app.db.session import AsyncSessionLocal, engine
from app.services.rag import PgVectorRAGService

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("ingest")

DEFAULT_ROOT = Path("/app/data/knowledge_base")
LOCAL_ROOT = Path(__file__).resolve().parents[2] / "data" / "knowledge_base"

# Document chunking: 300–500 words with light overlap
DOC_CHUNK_MIN_WORDS = 300
DOC_CHUNK_MAX_WORDS = 500
DOC_CHUNK_OVERLAP_WORDS = 50


def resolve_data_root(explicit: Path | None = None) -> Path:
    if explicit and explicit.exists():
        return explicit
    if DEFAULT_ROOT.exists():
        return DEFAULT_ROOT
    if LOCAL_ROOT.exists():
        return LOCAL_ROOT
    raise FileNotFoundError("Répertoire knowledge_base introuvable")


def _load_qa_rows(path: Path) -> list[dict]:
    """Load questions_reponses.json — flat list or {items:[...]}."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, dict):
        rows = raw.get("items") or raw.get("questions") or raw.get("data")
        if not isinstance(rows, list):
            raise ValueError(f"JSON Q/R invalide (pas de liste items): {path}")
    elif isinstance(raw, list):
        rows = raw
    else:
        raise ValueError(f"JSON Q/R invalide: {path}")
    return rows


async def ingest_qa(db: AsyncSession, path: Path) -> dict:
    """Read structured Q/R JSON — one chunk per entry.

    Expected fields per entry:
      id, chapitre_numero, chapitre, question, reponse, langue, source_page, source_type

    Embedding = concatenation of question + reponse.
    Other fields stored as metadata on knowledge_chunks.
    """
    if not path.exists():
        raise FileNotFoundError(f"Fichier Q/R introuvable: {path}")

    rows = _load_qa_rows(path)
    rag = PgVectorRAGService(db)
    created = 0
    updated = 0

    for row in rows:
        question = (row.get("question") or "").strip()
        reponse = (row.get("reponse") or "").strip()
        if not question or not reponse:
            logger.warning("qa_skip_incomplete id=%s", row.get("id"))
            continue

        chapitre = (row.get("chapitre") or "Sans chapitre").strip()
        langue = (row.get("langue") or "ar").strip()
        if langue not in {"ar", "fr", "ary"}:
            langue = "ar"

        source_type = (row.get("source_type") or "qa").strip()
        if source_type != "qa":
            logger.warning("qa_force_source_type id=%s got=%s", row.get("id"), source_type)
            source_type = "qa"

        source_page = row.get("source_page")
        if source_page is not None:
            source_page = str(source_page)[:128]

        external_id = row.get("id")
        try:
            external_id = int(external_id) if external_id is not None else None
        except (TypeError, ValueError):
            external_id = None

        chapitre_numero = row.get("chapitre_numero")
        try:
            chapitre_numero = int(chapitre_numero) if chapitre_numero is not None else None
        except (TypeError, ValueError):
            chapitre_numero = None

        # One chunk = one entry; Q+R kept together; embed Q+R concat in upsert_chunk
        _, is_new = await rag.upsert_chunk(
            chapitre=chapitre,
            question=question,
            reponse=reponse,
            langue=langue,
            source_type=source_type,
            source_page=source_page,
            external_id=external_id,
            chapitre_numero=chapitre_numero,
        )
        if is_new:
            created += 1
        else:
            updated += 1

    logger.info(
        "ingest_qa done path=%s total=%s created=%s updated=%s",
        path.name,
        created + updated,
        created,
        updated,
    )
    return {"source": "qa", "created": created, "updated": updated, "total": created + updated}


def extract_pdf_text(path: Path) -> list[tuple[int, str]]:
    """Return list of (1-based page_number, text)."""
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    pages: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages):
        text_page = page.extract_text() or ""
        # Normalize whitespace while preserving Arabic letters
        text_page = re.sub(r"[ \t]+", " ", text_page)
        text_page = re.sub(r"\n{3,}", "\n\n", text_page).strip()
        if text_page:
            pages.append((i + 1, text_page))
    return pages


def chunk_tagged_words(
    tagged: list[tuple[int, str]],
    *,
    min_words: int = DOC_CHUNK_MIN_WORDS,
    max_words: int = DOC_CHUNK_MAX_WORDS,
    overlap: int = DOC_CHUNK_OVERLAP_WORDS,
) -> list[list[tuple[int, str]]]:
    """Split tagged (page, word) stream into overlapping 300–500 word windows."""
    if not tagged:
        return []
    n = len(tagged)
    if n <= max_words:
        return [tagged]

    chunks: list[list[tuple[int, str]]] = []
    start = 0
    target = min(max_words, max(min_words, 400))

    while start < n:
        end = min(start + target, n)
        remaining = n - end
        if 0 < remaining < (min_words // 2):
            end = n
        chunks.append(tagged[start:end])
        if end >= n:
            break
        start = max(end - overlap, start + 1)

    return chunks


async def ingest_document(db: AsyncSession, path: Path) -> dict:
    """Read PDF, split into 300–500 word overlapping chunks, embed each."""
    if not path.exists():
        raise FileNotFoundError(f"Document PDF introuvable: {path}")

    pages = extract_pdf_text(path)
    if not pages:
        raise ValueError(f"Aucun texte extractible depuis {path}")

    tagged: list[tuple[int, str]] = []
    for page_no, page_text in pages:
        for w in page_text.split():
            if w.strip():
                tagged.append((page_no, w.strip()))

    windows = chunk_tagged_words(tagged)
    rag = PgVectorRAGService(db)
    created = 0
    updated = 0
    chapitre = "Programme électoral"

    for idx, span in enumerate(windows, start=1):
        if not span:
            continue
        pages_in_chunk = sorted({p for p, _ in span})
        page_label = (
            str(pages_in_chunk[0])
            if len(pages_in_chunk) == 1
            else f"{pages_in_chunk[0]}-{pages_in_chunk[-1]}"
        )
        body = " ".join(w for _, w in span).strip()
        if len(body.split()) < 40:
            continue

        label = f"Extrait du programme électoral — segment {idx} (p.{page_label})"
        _, is_new = await rag.upsert_chunk(
            chapitre=chapitre,
            question=label,
            reponse=body,
            langue="ar",
            source_type="document",
            source_page=page_label,
        )
        if is_new:
            created += 1
        else:
            updated += 1

    logger.info(
        "ingest_document done path=%s pages=%s chunks=%s created=%s updated=%s",
        path.name,
        len(pages),
        created + updated,
        created,
        updated,
    )
    return {
        "source": "document",
        "created": created,
        "updated": updated,
        "total": created + updated,
        "pages": len(pages),
    }


async def ensure_schema() -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
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
        await conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_knowledge_external_id
                ON knowledge_chunks (external_id)
                """
            )
        )
        await ensure_embedding_column(conn)


def resolve_unique_documents(root: Path, explicit: Path | None = None) -> list[Path]:
    """
    Return unique PDF paths under documents/ (dedupe by SHA-256).
    If two files are byte-identical, keep only one (prefer Arabic name / 2026*).
    """
    import hashlib

    if explicit is not None:
        if not explicit.exists():
            raise FileNotFoundError(explicit)
        return [explicit]

    docs = root / "documents"
    if not docs.exists():
        return []

    pdfs = sorted(docs.glob("*.pdf"), key=lambda p: p.name)
    by_hash: dict[str, Path] = {}
    duplicates: list[tuple[Path, Path]] = []

    def preference_score(p: Path) -> tuple[int, str]:
        name = p.name
        score = 0
        if "انتخاب" in name:
            score += 2
        if name.startswith("2026"):
            score += 1
        if name == "programme_electoral.pdf":
            score -= 1  # prefer original Arabic copy over rename duplicate
        return (score, name)

    for p in pdfs:
        digest = hashlib.sha256(p.read_bytes()).hexdigest()
        if digest in by_hash:
            kept = by_hash[digest]
            # Keep the preferred filename
            if preference_score(p) > preference_score(kept):
                duplicates.append((kept, p))
                by_hash[digest] = p
            else:
                duplicates.append((p, kept))
            logger.warning(
                "document_duplicate_skipped duplicate=%s kept=%s sha256=%s",
                p.name,
                by_hash[digest].name,
                digest[:16],
            )
        else:
            by_hash[digest] = p

    unique = list(by_hash.values())
    unique.sort(key=lambda p: preference_score(p), reverse=True)
    return unique


def resolve_document_path(root: Path, explicit: Path | None = None) -> Path:
    """Single document path (first unique PDF). Prefer Arabic programme file."""
    unique = resolve_unique_documents(root, explicit)
    if not unique:
        return root / "documents" / "programme_electoral.pdf"
    return unique[0]


async def run(
    *,
    qa_path: Path | None,
    document_paths: list[Path] | None,
    do_qa: bool,
    do_doc: bool,
) -> None:
    settings = get_settings()
    await ensure_schema()

    results = []
    async with AsyncSessionLocal() as db:
        if do_qa:
            assert qa_path is not None
            results.append(await ingest_qa(db, qa_path))
            await db.commit()
            # Optional FR / Darija paraphrases alongside the Arabic QA file
            para = qa_path.parent / "questions_reponses_paraphrases.json"
            if para.exists() and para.resolve() != qa_path.resolve():
                results.append(await ingest_qa(db, para))
                await db.commit()
        if do_doc:
            assert document_paths is not None
            for doc_path in document_paths:
                results.append(await ingest_document(db, doc_path))
                await db.commit()

    logger.info(
        "ingest_done results=%s threshold=%s",
        results,
        settings.rag_similarity_threshold,
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ingest Q/R JSON and/or programme PDF into pgvector"
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=None,
        help="Racine knowledge_base (défaut: /app/data/knowledge_base ou ./data/knowledge_base)",
    )
    parser.add_argument(
        "--qa",
        type=Path,
        default=None,
        help="Chemin JSON Q/R (défaut: <data-dir>/qa/questions_reponses.json)",
    )
    parser.add_argument(
        "--document",
        type=Path,
        default=None,
        help="Chemin PDF programme (défaut: <data-dir>/documents/programme_electoral.pdf)",
    )
    parser.add_argument("--qa-only", action="store_true", help="Ingestion Q/R uniquement")
    parser.add_argument("--doc-only", action="store_true", help="Ingestion PDF uniquement")
    args = parser.parse_args()

    if args.qa_only and args.doc_only:
        parser.error("Choisir --qa-only OU --doc-only, pas les deux")

    root = resolve_data_root(args.data_dir)
    qa_path = args.qa or (root / "qa" / "questions_reponses.json")
    if args.document:
        document_paths = [args.document]
    else:
        document_paths = resolve_unique_documents(root)

    do_qa = not args.doc_only
    do_doc = not args.qa_only

    if do_qa and not qa_path.exists():
        raise SystemExit(f"Fichier Q/R manquant: {qa_path}")
    if do_doc and not document_paths:
        raise SystemExit(f"Aucun document PDF unique trouvé dans {root / 'documents'}")
    if do_doc:
        for p in document_paths:
            if not p.exists():
                raise SystemExit(f"Document PDF manquant: {p}")

    logger.info(
        "ingest_paths qa=%s documents=%s",
        qa_path,
        [str(p) for p in document_paths] if do_doc else [],
    )

    asyncio.run(
        run(
            qa_path=qa_path if do_qa else None,
            document_paths=document_paths if do_doc else None,
            do_qa=do_qa,
            do_doc=do_doc,
        )
    )


if __name__ == "__main__":
    main()
