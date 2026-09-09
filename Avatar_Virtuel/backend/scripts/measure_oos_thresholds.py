"""Measure out-of-scope false-accept rates at candidate thresholds.

NO production code changes — diagnostic only.
"""
from __future__ import annotations

import asyncio
import json
import sys

sys.path.insert(0, "/app")

from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.services.language import get_language_service
from app.services.rag import PgVectorRAGService, lexical_similarity
from app.services.translate import translate_query_to_arabic
from tests.test_scenarios import OUT_OF_SCOPE

THRESHOLDS = [0.65, 0.68, 0.70, 0.72, 0.75]


async def best_score(db, question: str) -> dict:
    lang = get_language_service().detect(question)
    rag_q = question
    if lang != "ar":
        rag_q = await translate_query_to_arabic(question, lang)

    rag = PgVectorRAGService(db)
    vectors = await rag.embedder.embed([rag_q], task_type="retrieval_query")
    emb_str = "[" + ",".join(str(float(x)) for x in vectors[0]) + "]"
    sql = text(
        """
        SELECT question, reponse, source_type,
               1 - (embedding <=> CAST(:embedding AS vector)) AS score
        FROM knowledge_chunks
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT 5
        """
    )
    rows = (await db.execute(sql, {"embedding": emb_str})).mappings().all()
    scored = []
    for row in rows:
        vec = float(row["score"] or 0.0)
        lex = max(
            lexical_similarity(rag_q, row["question"]),
            lexical_similarity(rag_q, (row["reponse"] or "")[:800]),
        )
        scored.append(
            {
                "score": max(vec, lex),
                "q": (row["question"] or "")[:80],
                "src": row["source_type"],
            }
        )
    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[0] if scored else None
    return {
        "question": question,
        "lang": lang,
        "best_score": round(top["score"], 4) if top else None,
        "top_q": top["q"] if top else None,
        "src": top["src"] if top else None,
    }


async def main() -> None:
    rows = []
    async with AsyncSessionLocal() as db:
        for q in OUT_OF_SCOPE:
            # Skip pure injection/blocked patterns that never reach RAG? Still score them.
            r = await best_score(db, q)
            rows.append(r)
            print(
                f"score={r['best_score']} lang={r['lang']} | {q[:55]}",
                flush=True,
            )
            await asyncio.sleep(0.35)

    n = len(rows)
    by_th = {}
    for th in THRESHOLDS:
        false_accept = sum(1 for r in rows if (r["best_score"] or 0) >= th)
        detected = n - false_accept
        by_th[str(th)] = {
            "false_accept": false_accept,
            "detected_oos": detected,
            "oos_detection_pct": round(detected / n * 100, 1) if n else 0,
            "false_accept_pct": round(false_accept / n * 100, 1) if n else 0,
        }

    # Lowest among {0.65,0.68,0.70,0.72} with oos_detection >= 90
    candidates = [0.65, 0.68, 0.70, 0.72]
    chosen = None
    for th in candidates:  # already ascending = lowest first
        if by_th[str(th)]["oos_detection_pct"] >= 90.0:
            chosen = th
            break
    if chosen is None:
        chosen = 0.75

    out = {
        "n_out_of_scope": n,
        "by_threshold": by_th,
        "recommended_threshold": chosen,
        "rule": "lowest in {0.65,0.68,0.70,0.72} with OOS detection >= 90%, else keep 0.75",
        "rows": rows,
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
