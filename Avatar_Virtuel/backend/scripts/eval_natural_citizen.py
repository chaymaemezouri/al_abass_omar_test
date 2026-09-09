"""Eval: natural citizen questions (broad, spontaneous) vs current RAG.

Reports:
- API sourced rate (score >= 0.75, answer returned)
- Topical hit rate (manual expected_topic keywords vs retrieved chunk)
- Top-3 score band for the proposed lower-threshold / multi-chunk option

Does NOT change production code.
"""
from __future__ import annotations

import asyncio
import json
import re
import sys
import time
from dataclasses import dataclass

import httpx

sys.path.insert(0, "/app")

from app.db.session import AsyncSessionLocal
from app.services.language import get_language_service
from app.services.rag import PgVectorRAGService
from app.services.translate import translate_query_to_arabic


@dataclass
class NaturalQ:
    question: str
    # Arabic keywords that should appear in a *correct* retrieved Q or R
    expect_any: list[str]
    topic: str


# ~18 spontaneous citizen questions (FR + Darija mix), not faithful KB paraphrases
NATURAL: list[NaturalQ] = [
    NaturalQ(
        "Comment il va créer des emplois pour les jeunes ?",
        ["تشغيل", "بطالة", "شباب", "NEET", "منصب"],
        "emploi_jeunes",
    ),
    NaturalQ(
        "C'est quoi le plan pour l'eau ?",
        ["ماء", "تحلية", "مياه", "مائي"],
        "eau",
    ),
    NaturalQ(
        "Il compte faire quoi contre la corruption ?",
        ["فساد", "رقمنة", "منافية"],
        "corruption",
    ),
    NaturalQ(
        "Et pour les PME, y a quoi concrètement ?",
        ["مقاول", "صفقات", "استثمار", "جبائ"],
        "pme",
    ),
    NaturalQ(
        "Il va faire quoi pour la santé ?",
        ["صحة", "طبيب", "أطباء", "مستشفى", "مرض"],
        "sante",
    ),
    NaturalQ(
        "Comment il veut améliorer l'école ?",
        ["تربي", "تعليم", "أستاذ", "مدرس", "تلاميذ"],
        "education",
    ),
    NaturalQ(
        "C'est quoi son idée sur l'hydrogène vert ?",
        ["هيدروجين", "أخضر", "أمونيا"],
        "hydrogene",
    ),
    NaturalQ(
        "Il propose quoi pour la justice ?",
        ["عدال", "قضا", "محاكم", "اعتقال"],
        "justice",
    ),
    NaturalQ(
        "Et le numérique / l'IA dans tout ça ?",
        ["رقمي", "ذكاء", "سيبراني", "بيانات", "سحاب"],
        "numerique_ia",
    ),
    NaturalQ(
        "Comment il veut protéger le pouvoir d'achat des malades ?",
        ["قدرة شرائية", "مرضى", "صحة", "دواء"],
        "sante_pouvoir_achat",
    ),
    NaturalQ(
        "Il compte vraiment digitaliser l'administration ?",
        ["رقمن", "إدارة", "مساطر", "رقمي"],
        "admin_digitale",
    ),
    NaturalQ(
        "كيفاش غادي يخلق مناصب شغل للشباب؟",
        ["تشغيل", "بطالة", "شباب", "NEET", "منصب"],
        "emploi_jeunes",
    ),
    NaturalQ(
        "شنو الخطة ديالو فالماء؟",
        ["ماء", "تحلية", "مياه", "مائي"],
        "eau",
    ),
    NaturalQ(
        "واش غادي يدير ضد الفساد؟",
        ["فساد", "رقمنة", "منافية"],
        "corruption",
    ),
    NaturalQ(
        "والمقاولات الصغرى؟ شنو عندو؟",
        ["مقاول", "صفقات", "استثمار", "جبائ"],
        "pme",
    ),
    NaturalQ(
        "كيفاش بغا يحسن التعليم؟",
        ["تربي", "تعليم", "أستاذ", "مدرس", "تلاميذ"],
        "education",
    ),
    NaturalQ(
        "شنو رأيو فالهيدروجين الأخضر؟",
        ["هيدروجين", "أخضر", "أمونيا"],
        "hydrogene",
    ),
    NaturalQ(
        "واش كاين شي حاجة على التقاعد والمعاشات؟",
        ["تقاعد", "معاش"],
        "retraites",
    ),
]


def topical(hit_q: str, hit_r: str, expect_any: list[str]) -> bool:
    blob = f"{hit_q or ''}\n{hit_r or ''}"
    return any(k in blob for k in expect_any)


async def rag_top3(db, question: str) -> dict:
    lang = get_language_service().detect(question)
    rag_q = question
    if lang != "ar":
        rag_q = await translate_query_to_arabic(question, lang)
    rag = PgVectorRAGService(db)
    # Temporarily inspect more hits via search internals: call search then
    # re-query with lower threshold logic by reading top vector hits.
    from sqlalchemy import text

    vectors = await rag.embedder.embed([rag_q], task_type="retrieval_query")
    emb_str = "[" + ",".join(str(float(x)) for x in vectors[0]) + "]"
    sql = text(
        """
        SELECT question, reponse, source_type, chapitre,
               1 - (embedding <=> CAST(:embedding AS vector)) AS score
        FROM knowledge_chunks
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT 5
        """
    )
    rows = (await db.execute(sql, {"embedding": emb_str})).mappings().all()
    # Apply same hybrid max(vector, lexical) as production for fair scores
    from app.services.rag import lexical_similarity

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
                "vec": vec,
                "question": row["question"],
                "reponse": (row["reponse"] or "")[:180],
                "source_type": row["source_type"],
                "chapitre": row["chapitre"],
            }
        )
    scored.sort(key=lambda x: x["score"], reverse=True)
    return {"lang": lang, "rag_query": rag_q, "hits": scored[:3]}


async def ask_api(client: httpx.AsyncClient, q: str) -> dict:
    t0 = time.perf_counter()
    resp = await client.post(
        "/api/v1/chat/text",
        json={"question": q, "include_media": False},
        timeout=180.0,
    )
    resp.raise_for_status()
    data = resp.json()
    data["_latency"] = time.perf_counter() - t0
    await asyncio.sleep(0.6)
    return data


async def main() -> None:
    rows_out = []
    api_sourced = 0
    topical_at_075 = 0
    topical_in_top1 = 0
    topical_in_top3 = 0
    above_070_topical = 0
    above_065_topical = 0
    n = len(NATURAL)

    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=180.0) as client:
        async with AsyncSessionLocal() as db:
            for item in NATURAL:
                api = await ask_api(client, item.question)
                diag = await rag_top3(db, item.question)
                hits = diag["hits"]
                top1 = hits[0] if hits else None
                top1_topical = bool(
                    top1 and topical(top1["question"], top1["reponse"], item.expect_any)
                )
                top3_topical = any(
                    topical(h["question"], h["reponse"], item.expect_any) for h in hits
                )
                api_ok = (not api.get("used_fallback")) and (not api.get("blocked"))
                score = api.get("similarity_score")
                if api_ok:
                    api_sourced += 1
                if api_ok and top1_topical:
                    topical_at_075 += 1
                if top1_topical:
                    topical_in_top1 += 1
                if top3_topical:
                    topical_in_top3 += 1

                best_topical_score = 0.0
                for h in hits:
                    if topical(h["question"], h["reponse"], item.expect_any):
                        best_topical_score = max(best_topical_score, h["score"])
                if best_topical_score >= 0.70:
                    above_070_topical += 1
                if best_topical_score >= 0.65:
                    above_065_topical += 1

                row = {
                    "q": item.question,
                    "topic": item.topic,
                    "lang": diag["lang"],
                    "api_sourced": api_ok,
                    "api_score": score,
                    "api_sources": api.get("sources"),
                    "top1_score": top1["score"] if top1 else None,
                    "top1_topical": top1_topical,
                    "top3_topical": top3_topical,
                    "best_topical_score": round(best_topical_score, 4) if best_topical_score else None,
                    "top3": [
                        {
                            "score": round(h["score"], 4),
                            "src": h["source_type"],
                            "q": (h["question"] or "")[:70],
                        }
                        for h in hits
                    ],
                    "latency_s": round(api["_latency"], 2),
                }
                rows_out.append(row)
                print(
                    f"{'OK' if api_ok else 'FB'} api={score} top1={top1['score'] if top1 else None:.3f} "
                    f"topical1={top1_topical} topical3={top3_topical} | {item.question[:50]}",
                    flush=True,
                )

    summary = {
        "n": n,
        "api_sourced_pct": round(api_sourced / n * 100, 1),
        "api_sourced_and_topical_pct": round(topical_at_075 / n * 100, 1),
        "top1_topical_pct": round(topical_in_top1 / n * 100, 1),
        "top3_topical_pct": round(topical_in_top3 / n * 100, 1),
        "would_pass_if_threshold_070_and_topical_pct": round(above_070_topical / n * 100, 1),
        "would_pass_if_threshold_065_and_topical_pct": round(above_065_topical / n * 100, 1),
        "api_sourced": api_sourced,
        "topical_at_075": topical_at_075,
        "topical_in_top1": topical_in_top1,
        "topical_in_top3": topical_in_top3,
    }
    print(json.dumps({"summary": summary, "rows": rows_out}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
