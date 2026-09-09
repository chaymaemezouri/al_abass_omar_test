"""Smoke tests for conversational vs programme routing (natural user phrasings)."""
from __future__ import annotations

import asyncio
import json
import sys

import httpx

sys.path.insert(0, "/app")

# Natural, non-scripted-looking variants — not a fixed greeting dictionary
SAMPLES = [
    # Should be conversational (no RAG fallback "je n'ai pas...")
    ("Salut !", "conversationnel"),
    ("Merci beaucoup pour ta réponse", "conversationnel"),
    ("Tu es qui exactement ?", "conversationnel"),
    ("واش بخير؟", "conversationnel"),
    ("السلام عليكم", "conversationnel"),
    ("كيفاش نقدر نسولك؟", "conversationnel"),
    # Should be programme (RAG path)
    ("C'est quoi le plan pour l'eau ?", "programme"),
    ("salut, comment tu vas et c'est quoi son programme pour l'eau ?", "programme"),
    ("كيفاش غادي يخلق مناصب شغل للشباب؟", "programme"),
    ("ما هو هدف تحلية المياه لسنة 2030؟", "programme"),
    ("Bonjour, il propose quoi contre la corruption ?", "programme"),
]


async def ask(client: httpx.AsyncClient, q: str) -> dict:
    resp = await client.post(
        "/api/v1/chat/text",
        json={"question": q, "include_media": False},
        timeout=180.0,
    )
    resp.raise_for_status()
    await asyncio.sleep(0.7)
    return resp.json()


async def main() -> None:
    rows = []
    conv_ok = prog_ok = 0
    conv_n = prog_n = 0

    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=180.0) as client:
        for q, expect in SAMPLES:
            d = await ask(client, q)
            fb = bool(d.get("used_fallback"))
            answer = (d.get("answer") or "")[:120]
            score = d.get("similarity_score")

            if expect == "conversationnel":
                conv_n += 1
                # Success: not the RAG out-of-scope fallback
                ok = (not fb) and ("pas cette information" not in answer.lower()) and (
                    "ما عنديش" not in answer
                ) and ("ليس لدي هذه المعلومة" not in answer)
                conv_ok += int(ok)
            else:
                prog_n += 1
                # Programme path: either sourced answer or legitimate OOS fallback
                # For in-scope samples we expect not conversational-only fluff without RAG
                ok = score is not None or fb
                # Better: water/jobs questions should be sourced
                if "eau" in q.lower() or "ماء" in q or "شغل" in q or "فساد" in q or "corruption" in q.lower():
                    ok = (not fb) and (score is not None) and float(score) >= 0.65
                prog_ok += int(ok)

            row = {
                "q": q,
                "expect": expect,
                "ok": ok,
                "fallback": fb,
                "score": score,
                "lang": d.get("language"),
                "answer": answer,
            }
            rows.append(row)
            print(
                f"{'OK' if ok else 'FAIL'} expect={expect} fb={fb} score={score} | {q[:50]}",
                flush=True,
            )
            print(f"  → {answer}", flush=True)

    summary = {
        "conversationnel_pct": round(conv_ok / conv_n * 100, 1) if conv_n else 0,
        "programme_pct": round(prog_ok / prog_n * 100, 1) if prog_n else 0,
        "conversationnel": f"{conv_ok}/{conv_n}",
        "programme": f"{prog_ok}/{prog_n}",
    }
    print(json.dumps({"summary": summary, "rows": rows}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
