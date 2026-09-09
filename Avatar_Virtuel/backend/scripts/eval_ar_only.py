"""Quick AR-only eval against live API."""
from __future__ import annotations

import asyncio
import json
import sys

import httpx

sys.path.insert(0, "/app")
from tests.test_scenarios import IN_SCOPE_AR, OUT_OF_SCOPE


async def main() -> None:
    sourced = 0
    total = 0
    out_ok = 0
    outs = 0
    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=120.0) as client:
        for q in IN_SCOPE_AR:
            resp = await client.post(
                "/api/v1/chat/text",
                json={"question": q, "include_media": False},
            )
            data = resp.json()
            total += 1
            ok = (not data.get("used_fallback")) and (not data.get("blocked"))
            sourced += int(ok)
            print(
                f"AR ok={ok} score={data.get('similarity_score')} q={q[:60]}",
                flush=True,
            )
            await asyncio.sleep(0.4)
        for q in OUT_OF_SCOPE:
            resp = await client.post(
                "/api/v1/chat/text",
                json={"question": q, "include_media": False},
            )
            data = resp.json()
            outs += 1
            fb = bool(data.get("used_fallback") or data.get("blocked"))
            out_ok += int(fb)
            print(
                f"OUT fb={fb} score={data.get('similarity_score')} q={q[:60]}",
                flush=True,
            )
            await asyncio.sleep(0.4)
    summary = {
        "ar_sourced_pct": (sourced / total * 100) if total else 0,
        "out_of_scope_detection_pct": (out_ok / outs * 100) if outs else 0,
        "ar_total": total,
        "ar_sourced": sourced,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
