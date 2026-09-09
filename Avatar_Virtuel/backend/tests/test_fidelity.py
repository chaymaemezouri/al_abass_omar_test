"""Phase 7 — fidelity tests: final answers must not invent facts absent from source."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.core.prompts import build_reformulation_prompt
from app.services.guardrails import (
    DefaultGuardrailService,
    extract_numbers,
    invented_numbers,
)


def _qa_path() -> Path:
    candidates = [
        Path("/app/data/knowledge_base/qa/questions_reponses.json"),
        Path(__file__).resolve().parents[2]
        / "data"
        / "knowledge_base"
        / "qa"
        / "questions_reponses.json",
    ]
    for p in candidates:
        if p.exists():
            return p
    return candidates[-1]


def _load_sample(n: int = 10) -> list[dict]:
    path = _qa_path()
    if not path.exists():
        pytest.skip(f"QA file missing: {path}")
    rows = json.loads(path.read_text(encoding="utf-8"))
    assert len(rows) >= n
    step = max(len(rows) // n, 1)
    return [rows[i * step] for i in range(n)]


def test_reformulation_prompt_is_reformulator_only():
    prompt = build_reformulation_prompt(
        "ar",
        "نرفع نسبة التشغيل إلى 60٪ بحلول 2030.",
        "ما هي أهداف التشغيل؟",
    )
    assert "reformulateur" in prompt.lower()
    assert "RÉPONSE SOURCE" in prompt
    assert "N'ajoute AUCUNE information" in prompt
    assert "2030" in prompt


def test_invented_numbers_detection():
    source = "Nous créons 10000 emplois et atteignons 5% de croissance."
    good = "Nous allons créer 10000 emplois, avec une croissance de 5%."
    bad = "Nous créons 10000 emplois et 25% de croissance."
    assert invented_numbers(source, good) == set()
    invented = invented_numbers(source, bad)
    assert any(n.rstrip("%") == "25" or n == "25%" for n in invented)


def test_guardrail_rejects_invented_number():
    g = DefaultGuardrailService()
    source = "الهدف هو بلوغ 60 في المائة من الطاقات المتجددة."
    ok, _out = g.validate_reformulation(
        "نهدف إلى بلوغ 60 في المائة من الطاقات المتجددة.",
        source,
        "ar",
    )
    assert ok is True

    bad_ok, bad_out = g.validate_reformulation(
        "نهدف إلى بلوغ 85 في المائة من الطاقات المتجددة بحلول 2040.",
        source,
        "ar",
    )
    assert bad_ok is False
    assert bad_out == source


def test_ten_official_qa_fidelity_sample():
    """
    Sample ≥10 official Q/R entries:
    - verbatim / faithful paraphrase → no invented numbers
    - hostile injection of a new percentage → rejected, source restored
    Manual review contract for Phase 7 (chunk source vs final answer).
    """
    sample = _load_sample(10)
    g = DefaultGuardrailService()
    assert len(sample) >= 10

    for entry in sample:
        source = entry["reponse"]
        lang = entry.get("langue", "ar")

        ok, out = g.validate_reformulation(source, source, lang)
        assert ok is True
        assert invented_numbers(source, out) == set()

        paraphrase = " ".join(source.split())
        _ok2, out2 = g.validate_reformulation(paraphrase, source, lang)
        assert invented_numbers(source, out2) == set()

        hostile = f"{source} ونصل إلى 99٪ كهدف إضافي."
        if extract_numbers(hostile) - extract_numbers(source):
            ok3, out3 = g.validate_reformulation(hostile, source, lang)
            assert ok3 is False
            assert out3 == source
