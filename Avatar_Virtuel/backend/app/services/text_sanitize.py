"""Strip markdown / Q&A labels from user-facing answers and TTS input."""

from __future__ import annotations

import re


def strip_qa_labels(text: str) -> str:
    """Remove accidental « Question : / Réponse : » formatting."""
    t = (text or "").strip()
    if not t:
        return t
    if re.search(r"Question\s*:", t, re.IGNORECASE):
        split = re.split(r"\n\s*Réponse\s*:\s*", t, maxsplit=1, flags=re.IGNORECASE)
        if len(split) == 2:
            return split[1].strip()
        split = re.split(r"\n\s*Reponse\s*:\s*", t, maxsplit=1, flags=re.IGNORECASE)
        if len(split) == 2:
            return split[1].strip()
    for prefix in (
        r"^Réponse\s*:\s*",
        r"^Reponse\s*:\s*",
        r"^Question\s*:\s*",
        r"^الجواب\s*:\s*",
        r"^الإجابة\s*:\s*",
        r"^السؤال\s*:\s*",
    ):
        t = re.sub(prefix, "", t, count=1, flags=re.IGNORECASE | re.MULTILINE).strip()
    return t


def strip_markdown_artifacts(text: str) -> str:
    """Remove markdown separators and markers that TTS would read aloud."""
    t = (text or "").strip()
    if not t:
        return t

    # Horizontal rules (whole lines or inline runs of --- / *** / ___)
    t = re.sub(r"^\s*[-*_]{3,}\s*$", "", t, flags=re.MULTILINE)
    t = re.sub(r"\s*[-*_]{3,}\s*", " ", t)

    # ATX headers
    t = re.sub(r"^\s*#+\s*", "", t, flags=re.MULTILINE)

    # Bold / italic (non-greedy, keep inner text)
    for pattern in (r"\*\*(.+?)\*\*", r"__(.+?)__", r"\*(.+?)\*", r"_(.+?)_"):
        t = re.sub(pattern, r"\1", t)

    # Bullet / list markers at line start
    t = re.sub(r"^\s*[-*•]\s+", "", t, flags=re.MULTILINE)

    # Stray isolated markdown chars (often left after partial LLM output)
    t = re.sub(r"(?<!\S)[*_]{1,2}(?!\S)", "", t)

    return t


def sanitize_answer_text(text: str) -> str:
    """Full cleanup for UI display and speech synthesis."""
    t = strip_qa_labels(text)
    t = strip_markdown_artifacts(t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()
