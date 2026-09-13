"""Unit tests for conversational safety + intent parsing (no LLM)."""
from app.core.prompts import IDENTITY_INTRO, get_identity_intro
from app.services.intent import (
    _parse_intent,
    conversational_reply_looks_unsafe,
    identity_wording_is_valid,
    is_greeting_only,
    is_identity_question,
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


def test_identity_question_detection():
    assert is_identity_question("Qui es-tu ?")
    assert is_identity_question("Tu es qui exactement ?")
    assert is_identity_question("Présente-toi")
    assert is_identity_question("من أنت؟")
    assert not is_identity_question("Quelle est la place des PME au Maroc ?")


def test_greeting_only_detection():
    assert is_greeting_only("Bonjour")
    assert is_greeting_only("السلام عليكم")
    assert not is_greeting_only("Bonjour, quel est le programme pour l'eau ?")


def test_identity_intro_messages():
    fr = get_identity_intro("fr")
    ar = get_identity_intro("ar")
    assert fr.startswith("Je suis la version numérique d'Omar Abass.")
    assert "programme électoral" in fr
    assert "النسخة الرقمية" in ar
    assert "الأرضية الانتخابية" in ar


def test_identity_wording_validation():
    assert identity_wording_is_valid(
        "Je suis la version numérique d'Omar Abass. Posez vos questions."
    )
    assert identity_wording_is_valid("أنا النسخة الرقمية لعمر العباس.")
    assert not identity_wording_is_valid("Je suis l'assistant virtuel du candidat.")
    assert not identity_wording_is_valid("أنا المساعد الافتراضي.")
    assert not identity_wording_is_valid("Bonjour, comment puis-je vous aider ?")
