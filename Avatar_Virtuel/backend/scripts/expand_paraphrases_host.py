"""Offline paraphrase expander via Gemini REST (no google-generativeai package).

Usage (host, not Docker):
  python Avatar_Virtuel/backend/scripts/expand_paraphrases_host.py
  python Avatar_Virtuel/backend/scripts/expand_paraphrases_host.py --limit 20
"""
from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
QA_DIR = ROOT / "data" / "knowledge_base" / "qa"
SRC = QA_DIR / "questions_reponses.json"
OUT = QA_DIR / "questions_reponses_paraphrases.json"
ENV = ROOT / ".env"

PROMPT = """Tu aides un moteur RAG électoral. À partir d'une fiche Q/R arabe, produis des paraphrases
fidèles (mêmes faits, chiffres, seuils — n'invente rien).

Réponds UNIQUEMENT en JSON valide:
{{
  "fr_question": "...",
  "fr_reponse": "...",
  "ary_question": "... (darija marocaine, alphabet latin OK)",
  "ary_reponse": "..."
}}

Fiche source:
chapitre: {chapitre}
question_ar: {question}
reponse_ar: {reponse}
"""


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if ENV.exists():
        for line in ENV.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def gemini_json(api_key: str, model: str, prompt: str) -> dict:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}"
        f":generateContent?key={api_key}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 500},
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {err[:300]}") from e

    text = (
        payload.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
        .strip()
    )
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()
    return json.loads(text)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--ids", type=str, default=None)
    parser.add_argument("--sleep", type=float, default=1.5)
    args = parser.parse_args()

    env = load_env()
    api_key = env.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key.startswith("your-"):
        raise SystemExit("GEMINI_API_KEY manquante dans Avatar_Virtuel/.env")
    model = (
        env.get("TRANSLATION_MODEL")
        or env.get("LLM_MODEL")
        or "gemini-2.0-flash"
    ).replace("models/", "")

    rows = json.loads(SRC.read_text(encoding="utf-8"))
    if args.ids:
        want = {int(x) for x in args.ids.split(",")}
        rows = [r for r in rows if int(r["id"]) in want]
    if args.limit is not None:
        rows = rows[: args.limit]

    existing: list[dict] = []
    if OUT.exists():
        existing = json.loads(OUT.read_text(encoding="utf-8"))
    by_id = {int(r["id"]): r for r in existing}

    for i, row in enumerate(rows, 1):
        rid = int(row["id"])
        fr_id, ary_id = rid + 100000, rid + 200000
        if fr_id in by_id and ary_id in by_id:
            print(f"[{i}/{len(rows)}] skip id={rid} (already)")
            continue
        print(f"[{i}/{len(rows)}] paraphrase id={rid}…", flush=True)
        try:
            data = gemini_json(
                api_key,
                model,
                PROMPT.format(
                    chapitre=row.get("chapitre") or "",
                    question=row.get("question") or "",
                    reponse=row.get("reponse") or "",
                ),
            )
            for lang, qk, rk, oid in (
                ("fr", "fr_question", "fr_reponse", fr_id),
                ("ary", "ary_question", "ary_reponse", ary_id),
            ):
                q = (data.get(qk) or "").strip()
                r = (data.get(rk) or "").strip()
                if not q or not r:
                    continue
                by_id[oid] = {
                    "id": oid,
                    "chapitre_numero": row.get("chapitre_numero"),
                    "chapitre": row.get("chapitre"),
                    "question": q,
                    "reponse": r,
                    "langue": lang,
                    "source_page": row.get("source_page"),
                    "source_type": "qa",
                    "paraphrase_of": rid,
                }
            OUT.write_text(
                json.dumps(list(by_id.values()), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            time.sleep(args.sleep)
        except Exception as exc:
            msg = str(exc)
            print(f"  FAIL id={rid}: {msg[:200]}")
            # Free-tier rate limit: back off hard then continue
            wait = max(args.sleep, 20.0) if "429" in msg else max(args.sleep, 5.0)
            time.sleep(wait)

    final = sorted(by_id.values(), key=lambda r: int(r["id"]))
    OUT.write_text(json.dumps(final, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"done -> {OUT} ({len(final)} items)")


if __name__ == "__main__":
    main()
