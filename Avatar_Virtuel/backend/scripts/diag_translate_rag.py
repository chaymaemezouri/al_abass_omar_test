"""Diagnose FR→AR translation impact on RAG scores."""
from __future__ import annotations

import asyncio
import json
import sys

sys.path.insert(0, "/app")

from app.db.session import AsyncSessionLocal
from app.services.rag import PgVectorRAGService
from app.services.translate import translate_query_to_arabic

FR = [
    "Quelle est l'idée directrice de la plateforme électorale ?",
    "Comment lutter contre la corruption ?",
    "Comment réduire le chômage ?",
    "Comment soutenir les PME ?",
    "Quelle position sur l'hydrogène vert ?",
]


async def score(db, q: str) -> dict:
    rag = PgVectorRAGService(db)
    r = await rag.search(q)
    best = r.hits[0] if r.hits else None
    return {
        "score": round(r.best_score or 0.0, 4),
        "above": r.above_threshold,
        "hit_q": (best.question[:90] if best else None),
        "src": (best.source_type if best else None),
    }


async def main() -> None:
    async with AsyncSessionLocal() as db:
        # Baseline: exact official AR question
        official = "ما هي الفكرة الموجهة للأرضية الانتخابية الانتخابية؟"
        print("OFFICIAL", json.dumps(await score(db, official), ensure_ascii=False))

        for fr in FR:
            ar = await translate_query_to_arabic(fr, "fr")
            fr_s = await score(db, fr)
            ar_s = await score(db, ar)
            print(
                json.dumps(
                    {
                        "fr": fr,
                        "ar": ar,
                        "fr_score": fr_s,
                        "ar_score": ar_s,
                        "delta": round((ar_s["score"] or 0) - (fr_s["score"] or 0), 4),
                    },
                    ensure_ascii=False,
                )
            )
            await asyncio.sleep(0.3)


if __name__ == "__main__":
    asyncio.run(main())
