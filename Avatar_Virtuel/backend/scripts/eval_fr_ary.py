"""Eval FR + Darija after query-translation RAG bridge."""
from __future__ import annotations

import asyncio
import json
import sys
import time

import httpx

sys.path.insert(0, "/app")
from tests.test_scenarios import IN_SCOPE_ARY, IN_SCOPE_FR, OUT_OF_SCOPE


async def ask(client: httpx.AsyncClient, q: str) -> dict:
    t0 = time.perf_counter()
    resp = await client.post(
        "/api/v1/chat/text",
        json={"question": q, "include_media": False},
        timeout=180.0,
    )
    resp.raise_for_status()
    data = resp.json()
    data["_latency"] = time.perf_counter() - t0
    await asyncio.sleep(0.5)
    return data


async def main() -> None:
    sourced_fr = sourced_ary = 0
    total_fr = total_ary = 0
    out_ok = outs = 0
    lats: list[float] = []

    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=180.0) as client:
        for q in IN_SCOPE_FR:
            d = await ask(client, q)
            total_fr += 1
            ok = (not d.get("used_fallback")) and (not d.get("blocked"))
            sourced_fr += int(ok)
            lats.append(d["_latency"])
            print(
                f"FR ok={ok} score={d.get('similarity_score')} "
                f"lang={d.get('language')} lat={d['_latency']:.2f}s | {q[:55]}",
                flush=True,
            )

        for q in IN_SCOPE_ARY:
            d = await ask(client, q)
            total_ary += 1
            ok = (not d.get("used_fallback")) and (not d.get("blocked"))
            sourced_ary += int(ok)
            lats.append(d["_latency"])
            print(
                f"ARY ok={ok} score={d.get('similarity_score')} "
                f"lang={d.get('language')} lat={d['_latency']:.2f}s | {q[:55]}",
                flush=True,
            )

        for q in OUT_OF_SCOPE:
            d = await ask(client, q)
            outs += 1
            fb = bool(d.get("used_fallback") or d.get("blocked"))
            out_ok += int(fb)
            lats.append(d["_latency"])
            print(
                f"OUT fb={fb} score={d.get('similarity_score')} lat={d['_latency']:.2f}s | {q[:55]}",
                flush=True,
            )

    summary = {
        "fr_sourced_pct": (sourced_fr / total_fr * 100) if total_fr else 0,
        "ary_sourced_pct": (sourced_ary / total_ary * 100) if total_ary else 0,
        "out_of_scope_detection_pct": (out_ok / outs * 100) if outs else 0,
        "avg_latency_s": (sum(lats) / len(lats)) if lats else None,
        "fr_sourced": sourced_fr,
        "fr_total": total_fr,
        "ary_sourced": sourced_ary,
        "ary_total": total_ary,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
