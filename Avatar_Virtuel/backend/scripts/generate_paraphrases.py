"""Generate FR + Darija paraphrases for Arabic QA rows (same facts, new phrasings).

Usage (from backend / Docker):
  python -m scripts.generate_paraphrases
  python -m scripts.generate_paraphrases --limit 20
  python -m scripts.generate_paraphrases --ids 8,9,101,102

Output:
  data/knowledge_base/qa/questions_reponses_paraphrases.json

Then ingest:
  python -m scripts.ingest_knowledge --qa-only --qa /app/data/knowledge_base/qa/questions_reponses_paraphrases.json
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("paraphrases")

LOCAL_QA = Path(__file__).resolve().parents[2] / "data" / "knowledge_base" / "qa"
DOCKER_QA = Path("/app/data/knowledge_base/qa")


def qa_dir() -> Path:
    if DOCKER_QA.exists():
        return DOCKER_QA
    return LOCAL_QA


PROMPT = """Tu aides un moteur RAG électoral. À partir d'une fiche Q/R arabe, produis des paraphrases
fidèles (mêmes faits, chiffres, seuils — n'invente rien).

Réponds UNIQUEMENT en JSON valide:
{{
  "fr_question": "...",
  "fr_reponse": "...",
  "ary_question": "... (darija marocaine en alphabet latin ou arabe)",
  "ary_reponse": "..."
}}

Fiche source:
chapitre: {chapitre}
question_ar: {question}
reponse_ar: {reponse}
"""


async def paraphrase_one(model, row: dict) -> list[dict]:
    import google.generativeai as genai

    prompt = PROMPT.format(
        chapitre=row.get("chapitre") or "",
        question=row.get("question") or "",
        reponse=row.get("reponse") or "",
    )
    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config={"temperature": 0.2, "max_output_tokens": 500},
    )
    raw = (response.text or "").strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:].strip()
    data = json.loads(raw)
    base_id = int(row["id"])
    out: list[dict] = []
    for lang, q_key, r_key, offset in (
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
    return out


async def run(limit: int | None, ids: set[int] | None) -> Path:
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

    out_path = qa_dir() / "questions_reponses_paraphrases.json"
    existing: list[dict] = []
    if out_path.exists():
        existing = json.loads(out_path.read_text(encoding="utf-8"))
    by_id = {int(r["id"]): r for r in existing}

    for i, row in enumerate(rows, 1):
        rid = int(row["id"])
        logger.info("paraphrase %s/%s id=%s", i, len(rows), rid)
        try:
            items = await paraphrase_one(model, row)
            for item in items:
                by_id[int(item["id"])] = item
            # Persist incrementally
            out_path.write_text(
                json.dumps(list(by_id.values()), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            await asyncio.sleep(0.8)
        except Exception:
            logger.exception("paraphrase_failed id=%s", rid)
            await asyncio.sleep(2.0)

    final = sorted(by_id.values(), key=lambda r: int(r["id"]))
    out_path.write_text(json.dumps(final, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info("wrote %s items → %s", len(final), out_path)
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--ids", type=str, default=None, help="Comma-separated source ids")
    args = parser.parse_args()
    ids = {int(x) for x in args.ids.split(",")} if args.ids else None
    asyncio.run(run(args.limit, ids))


if __name__ == "__main__":
    main()
