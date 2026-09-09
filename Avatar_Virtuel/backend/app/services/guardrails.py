"""Guardrails: blocklist, prompt-injection, reformulation fidelity."""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Optional

from app.core.prompts import FALLBACK_MESSAGES, SENSITIVE_FALLBACK
from app.services.base import GuardrailService

logger = logging.getLogger(__name__)

_INJECTION_PATTERNS = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"ignore\s+(tes|vos|your|all|previous)\s+(instructions?|règles?|regles?|rules?)",
        r"oublie[rz]?\s+(tes|vos)\s+(règles?|regles?|instructions?)",
        r"you\s+are\s+now",
        r"jailbreak",
        r"developer\s+mode",
        r"DAN\s+mode",
        r"system\s+prompt",
        r"تجاهل\s+التعليمات",
        r"انس\s+القواعد",
        r"act\s+as\s+if",
        r"pretend\s+you\s+are",
        r"réponds?\s+librement",
        r"reponds?\s+librement",
    ]
]

# Western + Arabic-Indic digits, percentages, simple years
_NUMBER_RE = re.compile(
    r"(?<![\w])("
    r"\d{1,3}(?:[ \u00a0.,]\d{3})*(?:[.,]\d+)?%?"
    r"|"
    r"[\u0660-\u0669\u06F0-\u06F9]+(?:[.,][\u0660-\u0669\u06F0-\u06F9]+)?%?"
    r")(?![\w])"
)


def _normalize_digits(text: str) -> str:
    """Map Arabic-Indic digits to ASCII for comparison."""
    out = []
    for ch in text:
        if "\u0660" <= ch <= "\u0669":
            out.append(str(ord(ch) - 0x0660))
        elif "\u06F0" <= ch <= "\u06F9":
            out.append(str(ord(ch) - 0x06F0))
        else:
            out.append(ch)
    return "".join(out)


def _canon_number(token: str) -> str:
    """Normalize 37,2% / 37.2% / spaces so FR reformulations aren't rejected."""
    compact = re.sub(r"[\s\u00a0]", "", token)
    has_pct = compact.endswith("%")
    body = compact[:-1] if has_pct else compact
    if "," in body and "." in body:
        # 1.234,56 → European
        body = body.replace(".", "").replace(",", ".")
    elif "," in body:
        body = body.replace(",", ".")
    # strip trailing zeros after decimal for comparison
    if "." in body:
        whole, frac = body.split(".", 1)
        frac = frac.rstrip("0")
        body = f"{whole}.{frac}" if frac else whole
    return body + ("%" if has_pct else "")


def extract_numbers(text: str) -> set[str]:
    """Extract normalized numeric tokens (facts that must not be invented)."""
    normalized = _normalize_digits(text or "")
    found: set[str] = set()
    for m in _NUMBER_RE.finditer(normalized):
        found.add(_canon_number(m.group(1)))
    return found


def invented_numbers(source: str, answer: str) -> set[str]:
    """Numbers present in answer but absent from source.

    Treats 10 and 10% as equivalent so FR reformulations aren't falsely rejected.
    """
    src = extract_numbers(source)
    ans = extract_numbers(answer)

    def _base(n: str) -> str:
        return n[:-1] if n.endswith("%") else n

    src_bases = {_base(n) for n in src} | src
    invented: set[str] = set()
    for n in ans:
        if n in src or _base(n) in src_bases or f"{_base(n)}%" in src:
            continue
        invented.add(n)
    return invented


class DefaultGuardrailService(GuardrailService):
    def __init__(self, blocklist_path: Path | None = None) -> None:
        path = blocklist_path or Path(__file__).resolve().parent.parent / "core" / "blocklist.txt"
        self._patterns: list[str] = []
        if path.exists():
            for line in path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                self._patterns.append(line.lower())
        else:
            logger.warning("blocklist_missing path=%s", path)

    def check_input(self, text: str, language: str) -> tuple[bool, Optional[str]]:
        lowered = text.lower()
        for pattern in self._patterns:
            if pattern in lowered:
                logger.info("guardrail_blocklist_hit")
                return True, SENSITIVE_FALLBACK.get(language, SENSITIVE_FALLBACK["fr"])

        for rx in _INJECTION_PATTERNS:
            if rx.search(text):
                logger.info("guardrail_injection_hit")
                return True, SENSITIVE_FALLBACK.get(language, SENSITIVE_FALLBACK["fr"])

        return False, None

    def validate_output(
        self, answer: str, contexte_rag: str, language: str
    ) -> tuple[bool, str]:
        return self.validate_reformulation(answer, contexte_rag, language)

    def validate_reformulation(
        self, answer: str, reponse_source: str, language: str
    ) -> tuple[bool, str]:
        """
        Accept reformulation only if it does not invent numbers absent from source.
        On failure, return the raw source answer (never invent).
        """
        source = (reponse_source or "").strip()
        cleaned = (answer or "").strip()
        if not source:
            fallback = FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES["fr"])
            return False, fallback
        if not cleaned:
            return False, source

        invented = invented_numbers(source, cleaned)
        if invented:
            logger.warning("guardrail_invented_numbers tokens=%s", sorted(invented))
            return False, source

        lowered = cleaned.lower()
        source_l = source.lower()
        for pattern in self._patterns:
            if pattern in lowered and pattern not in source_l:
                logger.info("guardrail_output_block")
                return False, source

        # Reject extremely long expansions (likely free generation)
        if len(cleaned) > max(len(source) * 3, len(source) + 400):
            logger.warning("guardrail_reformulation_too_long")
            return False, source

        return True, cleaned


def get_guardrail_service() -> GuardrailService:
    return DefaultGuardrailService()
