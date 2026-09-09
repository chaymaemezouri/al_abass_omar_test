"""Run evaluation against a live API (after Gemini embedding ingestion).

Usage:
  python -m scripts.eval_rag --base-url http://localhost:8000
"""
from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import sys
import time
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tests.test_scenarios import IN_SCOPE_AR, IN_SCOPE_ARY, IN_SCOPE_FR, OUT_OF_SCOPE


async def ask(client: httpx.AsyncClient, question: str) -> dict:
    t0 = time.perf_counter()
    resp = await client.post(
        "/api/v1/chat/text",
        json={"question": question, "include_media": False},
        timeout=120.0,
    )
    latency = time.perf_counter() - t0
    resp.raise_for_status()
    data = resp.json()
    data["_latency"] = latency
    await asyncio.sleep(0.35)
    return data


async def eval_pack(
    client: httpx.AsyncClient, label: str, questions: list[str], *, expect_sourced: bool
) -> dict:
    total = 0
    ok = 0
    latencies: list[float] = []
    for q in questions:
        try:
            data = await ask(client, q)
        except Exception as exc:
            print(f"ERR {label}: {q[:60]} -> {exc}")
            continue
        total += 1
        latencies.append(data["_latency"])
        sourced = (not data.get("used_fallback")) and (not data.get("blocked"))
        if expect_sourced:
            hit = sourced
        else:
            hit = (not sourced)  # fallback expected
        ok += int(hit)
        flag = "ok" if sourced else "fallback"
        print(
            f"{label} {flag} score={data.get('similarity_score')} "
            f"lat={data['_latency']:.2f}s | {q[:50]}"
        )
    return {
        "total": total,
        "ok": ok,
        "rate_pct": (ok / total * 100) if total else 0.0,
        "latencies": latencies,
    }


async def run(base_url: str) -> dict:
    async with httpx.AsyncClient(base_url=base_url) as client:
        ar = await eval_pack(client, "AR", IN_SCOPE_AR, expect_sourced=True)
        fr = await eval_pack(client, "FR", IN_SCOPE_FR, expect_sourced=True)
        ary = await eval_pack(client, "ARY", IN_SCOPE_ARY, expect_sourced=True)
        out = await eval_pack(client, "OUT", OUT_OF_SCOPE, expect_sourced=False)

    all_lat = ar["latencies"] + fr["latencies"] + ary["latencies"] + out["latencies"]
    # Primary acceptance metric = official Arabic Q/R (KB language)
    summary = {
        "sourced_rate_pct_ar_official": ar["rate_pct"],
        "sourced_rate_pct_fr_paraphrase": fr["rate_pct"],
        "sourced_rate_pct_ary_paraphrase": ary["rate_pct"],
        "out_of_scope_detection_pct": out["rate_pct"],
        "avg_latency_s": statistics.mean(all_lat) if all_lat else None,
        "note": (
            "KB officielle = arabe. Le taux AR est le critère primaire Section 11. "
            "FR/Darija sont des paraphrases cross-lingues (bonus)."
        ),
    }
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()
    asyncio.run(run(args.base_url))


if __name__ == "__main__":
    main()
