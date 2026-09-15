"""Generate FR + Darija paraphrases for Arabic QA rows (same facts, new phrasings).

Usage (from backend / Docker):
  python -m scripts.generate_paraphrases
  python -m scripts.generate_paraphrases --limit 20
  python -m scripts.generate_paraphrases --ids 8,9,101,102
  python -m scripts.generate_paraphrases --ids 121,122 --output /app/media/questions_reponses_paraphrases.json

Output (default):
  data/knowledge_base/qa/questions_reponses_paraphrases.json
  Falls back to /app/media/questions_reponses_paraphrases.json when data/ is read-only (Docker).

Then ingest:
  python -m scripts.ingest_knowledge --qa-only --qa /app/data/knowledge_base/qa/questions_reponses_paraphrases.json
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

from app.config import get_settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("paraphrases")

LOCAL_QA = Path(__file__).resolve().parents[2] / "data" / "knowledge_base" / "qa"
DOCKER_QA = Path("/app/data/knowledge_base/qa")
DOCKER_MEDIA = Path("/app/media")


def qa_dir() -> Path:
    if DOCKER_QA.exists():
        return DOCKER_QA
    return LOCAL_QA


def default_output_path() -> Path:
    preferred = qa_dir() / "questions_reponses_paraphrases.json"
    try:
        preferred.parent.mkdir(parents=True, exist_ok=True)
        probe = preferred.parent / ".write_probe"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink(missing_ok=True)
        return preferred
    except OSError:
        pass
    fallback = DOCKER_MEDIA / "questions_reponses_paraphrases.json"
    if DOCKER_MEDIA.exists():
        return fallback
    return preferred


PROMPT = """Tu aides un moteur RAG électoral. À partir d'une fiche Q/R arabe, produis des paraphrases
fidèles (mêmes faits, chiffres, seuils — n'invente rien). Garde les réponses concises.

Réponds UNIQUEMENT en JSON valide (pas de markdown):
{{
  "ar_question": "... (arabe فصحى — reformulation différente de la question source, pas copie mot à mot)",
  "ar_reponse": "... (arabe فصحى — mêmes faits, formulation différente)",
  "fr_question": "...",
  "fr_reponse": "...",
  "ary_question": "... (darija marocaine)",
  "ary_reponse": "..."
}}

Fiche source:
chapitre: {chapitre}
question_ar: {question}
reponse_ar: {reponse}
"""


def _parse_json_response(raw: str) -> dict:
    text = (raw or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise
        return json.loads(match.group(0))


async def paraphrase_one(model, row: dict) -> list[dict]:
    prompt = PROMPT.format(
        chapitre=row.get("chapitre") or "",
        question=row.get("question") or "",
        reponse=(row.get("reponse") or "")[:1200],
    )
    last_exc: Exception | None = None
    data: dict | None = None
    for attempt in range(3):
        try:
            response = await asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config={"temperature": 0.2, "max_output_tokens": 2048},
            )
            data = _parse_json_response(response.text or "")
            last_exc = None
            break
        except Exception as exc:
            last_exc = exc
            logger.warning("paraphrase_json_retry attempt=%s id=%s err=%s", attempt + 1, row.get("id"), type(exc).__name__)
            await asyncio.sleep(1.5 * (attempt + 1))
    if last_exc is not None or data is None:
        raise last_exc or RuntimeError("empty paraphrase response")

    base_id = int(row["id"])
    out: list[dict] = []
    for lang, q_key, r_key, offset in (
        ("ar", "ar_question", "ar_reponse", 300000),
        ("fr", "fr_question", "fr_reponse", 100000),
        ("ary", "ary_question", "ary_reponse", 200000),
    ):
        q = (data.get(q_key) or "").strip()
        r = (data.get(r_key) or "").strip()
        if not q or not r:
            continue
        out.append(
            {
                "id": base_id + offset,
                "chapitre_numero": row.get("chapitre_numero"),
                "chapitre": row.get("chapitre"),
                "question": q,
                "reponse": r,
                "langue": lang,
                "source_page": row.get("source_page"),
                "source_type": "qa",
                "paraphrase_of": base_id,
            }
        )
    if not out:
        raise ValueError(f"empty paraphrase fields for id={base_id}")
    return out


def _load_existing(path: Path | None) -> dict[int, dict]:
    if path is None or not path.exists():
        return {}
    rows = json.loads(path.read_text(encoding="utf-8"))
    return {int(r["id"]): r for r in rows}


def _persist(out_path: Path, by_id: dict[int, dict]) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final = sorted(by_id.values(), key=lambda r: int(r["id"]))
    out_path.write_text(json.dumps(final, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


async def run(
    limit: int | None,
    ids: set[int] | None,
    output: Path | None,
    merge_from: Path | None,
) -> Path:
    settings = get_settings()
    key = settings.gemini_api_key
    if not key or key.startswith("your-"):
        raise SystemExit("GEMINI_API_KEY manquante")

    import google.generativeai as genai

    genai.configure(api_key=key)
    model_name = settings.translation_model or settings.llm_model
    model = genai.GenerativeModel(model_name)

    src = qa_dir() / "questions_reponses.json"
    rows = json.loads(src.read_text(encoding="utf-8"))
    if ids:
        rows = [r for r in rows if int(r["id"]) in ids]
    if limit is not None:
        rows = rows[:limit]

    out_path = output or default_output_path()
    canonical_existing = qa_dir() / "questions_reponses_paraphrases.json"
    merge_path = merge_from or (canonical_existing if canonical_existing.exists() else None)
    by_id = _load_existing(merge_path)
    if out_path.exists() and out_path.resolve() != (merge_path.resolve() if merge_path else None):
        by_id.update(_load_existing(out_path))

    logger.info("output=%s merge_from=%s existing=%s targets=%s", out_path, merge_path, len(by_id), len(rows))

    for i, row in enumerate(rows, 1):
        rid = int(row["id"])
        logger.info("paraphrase %s/%s id=%s", i, len(rows), rid)
        try:
            items = await paraphrase_one(model, row)
            for item in items:
                by_id[int(item["id"])] = item
            _persist(out_path, by_id)
            await asyncio.sleep(0.8)
        except Exception:
            logger.exception("paraphrase_failed id=%s", rid)
            await asyncio.sleep(2.0)

    _persist(out_path, by_id)
    logger.info("wrote %s items → %s", len(by_id), out_path)
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--ids", type=str, default=None, help="Comma-separated source ids")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Writable output JSON (default: data/qa or /app/media fallback)",
    )
    parser.add_argument(
        "--merge-from",
        type=Path,
        default=None,
        help="Existing paraphrases file to merge (default: data/qa/questions_reponses_paraphrases.json)",
    )
    args = parser.parse_args()
    ids = {int(x) for x in args.ids.split(",")} if args.ids else None
    asyncio.run(run(args.limit, ids, args.output, args.merge_from))


if __name__ == "__main__":
    main()
