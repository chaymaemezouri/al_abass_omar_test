"""LLM rerank of top RAG hits — pick the chunk that best answers the user question."""
from __future__ import annotations

import asyncio
import logging
import re

from app.config import get_settings
from app.services.base import RagHit

logger = logging.getLogger(__name__)


def build_rerank_prompt(question: str, hits: list[RagHit]) -> str:
    blocks = []
    for i, h in enumerate(hits[:3], 1):
        blocks.append(
            f"[{i}]\nQ: {h.question}\nR: {(h.reponse or '')[:400]}"
        )
    joined = "\n\n".join(blocks)
    return f"""Tu choisis QUEL extrait du programme répond le mieux à la question du citoyen.
Réponds UNIQUEMENT par le numéro 1, 2 ou 3 (rien d'autre).

Critères :
- L'extrait doit répondre à l'intention (mesures/aide ≠ simple statistique si on demande comment aider).
- Préférer une proposition concrète si la question demande comment / quoi / quelles mesures.
- Si la question parle d'évolution fiscale / impôts / taxe, préférer l'extrait fiscal (pas seulement le cadre juridique général).
- Si égalité, choisir le plus directement utile.

QUESTION CITOYEN :
{question}

EXTRAITS :
{joined}
"""


async def rerank_hits(question: str, hits: list[RagHit]) -> RagHit:
    """Return best hit among top-3 via lite LLM; fallback to hits[0]."""
    if not hits:
        raise ValueError("no hits to rerank")
    if len(hits) == 1:
        return hits[0]

    settings = get_settings()
    if not settings.gemini_api_key or settings.gemini_api_key.startswith("your-"):
        return hits[0]

    prompt = build_rerank_prompt(question, hits)
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(
            settings.translation_model,
            generation_config={"temperature": 0.0, "max_output_tokens": 8},
        )
        raw = await asyncio.to_thread(model.generate_content, prompt)
        text = (raw.text or "").strip()
        m = re.search(r"[123]", text)
        if not m:
            logger.info("rerank_parse_failed raw=%r", text[:40])
            return hits[0]
        idx = int(m.group(0)) - 1
        idx = max(0, min(idx, len(hits) - 1))
        chosen = hits[idx]
        logger.info(
            "rerank_ok pick=%s score=%.4f q=%s",
            idx + 1,
            chosen.score,
            (chosen.question or "")[:60],
        )
        return chosen
    except Exception:
        logger.exception("rerank_failed")
        return hits[0]
