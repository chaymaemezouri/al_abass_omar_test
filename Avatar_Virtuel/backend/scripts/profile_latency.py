"""Run latency profiling on representative requests (with media)."""
from __future__ import annotations

import asyncio
import json
import sys

import httpx

sys.path.insert(0, "/app")

CASES = [
    ("programme_fr", "C'est quoi le plan pour l'eau ?", True),
    ("programme_ar", "ما هو هدف تحلية المياه لسنة 2030؟", True),
    ("conversationnel_fr", "Salut !", True),
    ("programme_fr_no_media", "Quelle superficie pour l'hydrogène vert ?", False),
]


async def ask(client: httpx.AsyncClient, q: str, media: bool) -> dict:
    resp = await client.post(
        "/api/v1/chat/text",
        json={"question": q, "include_media": media},
        timeout=180.0,
    )
    resp.raise_for_status()
    return resp.json()


async def main() -> None:
    rows = []
    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=180.0) as client:
        for name, q, media in CASES:
            d = await ask(client, q, media)
            lat = d.get("latency") or {}
            seconds = (lat.get("seconds") or {}) if isinstance(lat, dict) else {}
            pct = (lat.get("pct_of_timed_steps") or {}) if isinstance(lat, dict) else {}
            row = {
                "case": name,
                "question": q,
                "media": media,
                "fallback": d.get("used_fallback"),
                "score": d.get("similarity_score"),
                "seconds": seconds,
                "pct": pct,
            }
            rows.append(row)
            print(f"\n=== {name} total={seconds.get('total')}s ===", flush=True)
            for k in sorted(seconds.keys()):
                if k == "total":
                    continue
                print(
                    f"  {k:22s} {seconds[k]:6.3f}s  ({pct.get(k, 0):5.1f}%)",
                    flush=True,
                )
            print(f"  {'TOTAL':22s} {seconds.get('total', 0):6.3f}s", flush=True)
            await asyncio.sleep(0.8)

    print("\n" + json.dumps({"profiles": rows}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
