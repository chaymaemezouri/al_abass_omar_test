"""Run the three Section-11 eval packs after threshold change.

1) Faithful FR/Darija paraphrases
2) Natural citizen questions (API sourced rate)
3) Out-of-scope detection
"""
from __future__ import annotations

import asyncio
import json
import sys
import time

import httpx

sys.path.insert(0, "/app")

from scripts.eval_natural_citizen import NATURAL, topical
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
    await asyncio.sleep(0.55)
    return data


async def main() -> None:
    summary: dict = {}
    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=180.0) as client:
        # --- Faithful paraphrases ---
        fr_ok = ary_ok = 0
        for q in IN_SCOPE_FR:
            d = await ask(client, q)
            ok = (not d.get("used_fallback")) and (not d.get("blocked"))
            fr_ok += int(ok)
            print(f"FAITH_FR ok={ok} score={d.get('similarity_score')} | {q[:50]}", flush=True)
        for q in IN_SCOPE_ARY:
            d = await ask(client, q)
            ok = (not d.get("used_fallback")) and (not d.get("blocked"))
            ary_ok += int(ok)
            print(f"FAITH_ARY ok={ok} score={d.get('similarity_score')} | {q[:50]}", flush=True)
        summary["faithful_fr_pct"] = round(fr_ok / len(IN_SCOPE_FR) * 100, 1)
        summary["faithful_ary_pct"] = round(ary_ok / len(IN_SCOPE_ARY) * 100, 1)
        summary["faithful_combined_pct"] = round(
            (fr_ok + ary_ok) / (len(IN_SCOPE_FR) + len(IN_SCOPE_ARY)) * 100, 1
        )

        # --- Natural citizen ---
        nat_ok = 0
        for item in NATURAL:
            d = await ask(client, q := item.question)
            ok = (not d.get("used_fallback")) and (not d.get("blocked"))
            nat_ok += int(ok)
            print(
                f"NAT ok={ok} score={d.get('similarity_score')} | {q[:50]}",
                flush=True,
            )
        summary["natural_citizen_sourced_pct"] = round(nat_ok / len(NATURAL) * 100, 1)
        summary["natural_citizen_sourced"] = nat_ok
        summary["natural_citizen_total"] = len(NATURAL)

        # --- Out of scope ---
        oos_ok = 0
        for q in OUT_OF_SCOPE:
            d = await ask(client, q)
            fb = bool(d.get("used_fallback") or d.get("blocked"))
            oos_ok += int(fb)
            print(
                f"OOS fb={fb} score={d.get('similarity_score')} | {q[:50]}",
                flush=True,
            )
        summary["out_of_scope_detection_pct"] = round(oos_ok / len(OUT_OF_SCOPE) * 100, 1)

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
