"""Unit tests for conversational safety + intent parsing (no LLM)."""
from app.services.intent import (
    _parse_intent,
    conversational_reply_looks_unsafe,
)


def test_parse_intent_words():
    assert _parse_intent("programme") == "programme"
    assert _parse_intent("conversationnel") == "conversationnel"
    assert _parse_intent("PROGRAMME.") == "programme"
    assert _parse_intent("weird") == "programme"  # safe default


def test_conversational_unsafe_on_digits():
    assert conversational_reply_looks_unsafe("Nous visons 100 milliards.")
    assert conversational_reply_looks_unsafe("Objectif 2030 pour l'eau.")
    assert not conversational_reply_looks_unsafe(
        "Bonjour, je suis l'assistant virtuel d'Al Abass Omar. Posez-moi une question sur le programme."
    )


def test_conversational_unsafe_on_length():
    long = "mot " * 80
    assert conversational_reply_looks_unsafe(long)
