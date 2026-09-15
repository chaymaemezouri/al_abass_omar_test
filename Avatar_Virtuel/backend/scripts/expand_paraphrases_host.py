"""Offline paraphrase expander via Gemini REST (no google-generativeai package).

Usage (host, not Docker):
  python Avatar_Virtuel/backend/scripts/expand_paraphrases_host.py
  python Avatar_Virtuel/backend/scripts/expand_paraphrases_host.py --limit 20
"""
from __future__ import annotations

import argparse
import json
import os
import re
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
  "ar_question": "... (arabe فصحى — reformulation différente, pas copie mot à mot)",
  "ar_reponse": "... (arabe فصحى — mêmes faits, formulation différente)",
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


def _parse_json_response(raw: str) -> dict:
    text = (raw or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise
        return json.loads(match.group(0))


def gemini_json(api_key: str, model: str, prompt: str) -> dict:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}"
        f":generateContent?key={api_key}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048},
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    last_exc: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            text = (
                payload.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
                .strip()
            )
            return _parse_json_response(text)
        except Exception as exc:
            last_exc = exc
            time.sleep(1.5 * (attempt + 1))
    raise last_exc or RuntimeError("empty gemini response")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--ids", type=str, default=None)
    parser.add_argument("--id-from", type=int, default=None, help="Inclusive source id start")
    parser.add_argument("--id-to", type=int, default=None, help="Inclusive source id end")
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
    elif args.id_from is not None or args.id_to is not None:
        lo = args.id_from if args.id_from is not None else 1
        hi = args.id_to if args.id_to is not None else 999999
        rows = [r for r in rows if lo <= int(r["id"]) <= hi]
    if args.limit is not None:
        rows = rows[: args.limit]

    existing: list[dict] = []
    if OUT.exists():
        existing = json.loads(OUT.read_text(encoding="utf-8"))
    by_id = {int(r["id"]): r for r in existing}

    for i, row in enumerate(rows, 1):
        rid = int(row["id"])
        ar_id, fr_id, ary_id = rid + 300000, rid + 100000, rid + 200000
        specs = (
            ("ar", "ar_question", "ar_reponse", ar_id),
            ("fr", "fr_question", "fr_reponse", fr_id),
            ("ary", "ary_question", "ary_reponse", ary_id),
        )
        if all(oid in by_id for _, _, _, oid in specs):
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
            for lang, qk, rk, oid in specs:
                if oid in by_id:
                    continue
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
