"""Unit tests for query-translation prompt (RAG bridge FR/Darija → AR)."""
from app.core.prompts import build_query_translation_prompt


def test_translation_prompt_is_literal_only():
    prompt = build_query_translation_prompt(
        "Comment réduire le chômage ?",
        "fr",
    )
    assert "traducteur fidèle" in prompt.lower() or "traducteur" in prompt.lower()
    assert "UNIQUEMENT la traduction" in prompt or "uniquement" in prompt.lower()
    assert "Ne réponds PAS à la question" in prompt
    assert "Comment réduire le chômage ?" in prompt
    assert "فصحى" in prompt or "arabe standard" in prompt
