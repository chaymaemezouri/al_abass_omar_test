"""LLM wrappers — reformulation (+ streaming / simplify)."""
from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator

from app.config import get_settings
from app.core.prompts import build_reformulation_prompt, build_simplify_prompt
from app.services.base import LLMService, LlmResult

logger = logging.getLogger(__name__)


class GeminiLLMService(LLMService):
    def __init__(self) -> None:
        settings = get_settings()
        self.model_name = settings.llm_model or settings.translation_model
        self.api_key = settings.gemini_api_key

    async def reformulate(
        self,
        language: str,
        reponse_source: str,
        question: str,
        historique: str = "",
    ) -> LlmResult:
        if not self.api_key or self.api_key.startswith("your-"):
            logger.warning("llm_gemini_skip reason=missing_or_placeholder_key")
            return LlmResult(text="", provider="gemini", model=self.model_name)

        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(
                self.model_name,
                generation_config={
                    "temperature": 0.2,
                    "max_output_tokens": 1536,
                },
            )
            prompt = build_reformulation_prompt(
                language, reponse_source, question, historique=historique
            )
            response = await asyncio.wait_for(
                asyncio.to_thread(model.generate_content, prompt),
                timeout=45.0,
            )
            text = (response.text or "").strip()
            return LlmResult(text=text, provider="gemini", model=self.model_name)
        except Exception:
            logger.exception("llm_gemini_error")
            return LlmResult(text="", provider="gemini", model=self.model_name)

    async def reformulate_stream(
        self,
        language: str,
        reponse_source: str,
        question: str,
        historique: str = "",
    ) -> AsyncIterator[str]:
        """Yield text chunks as the model writes."""
        if not self.api_key or self.api_key.startswith("your-"):
            return
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(
                self.model_name,
                generation_config={
                    "temperature": 0.2,
                    "max_output_tokens": 1536,
                },
            )
            prompt = build_reformulation_prompt(
                language, reponse_source, question, historique=historique
            )

            import queue
            import threading

            out: queue.Queue[str | None] = queue.Queue()

            def _produce() -> None:
                try:
                    stream = model.generate_content(prompt, stream=True)
                    for chunk in stream:
                        t = getattr(chunk, "text", None) or ""
                        if t:
                            out.put(t)
                except Exception:
                    logger.exception("llm_gemini_stream_produce_error")
                finally:
                    out.put(None)

            thread = threading.Thread(target=_produce, daemon=True)
            thread.start()
            while True:
                piece = await asyncio.to_thread(out.get)
                if piece is None:
                    break
                yield piece
            thread.join(timeout=5)
        except Exception:
            logger.exception("llm_gemini_stream_error")

    async def simplify(self, language: str, answer: str) -> LlmResult:
        if not self.api_key or self.api_key.startswith("your-"):
            return LlmResult(text=answer, provider="gemini", model=self.model_name)
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(
                self.model_name,
                generation_config={"temperature": 0.2, "max_output_tokens": 160},
            )
            prompt = build_simplify_prompt(language, answer)
            response = await asyncio.to_thread(model.generate_content, prompt)
            text = (response.text or "").strip() or answer
            return LlmResult(text=text, provider="gemini", model=self.model_name)
        except Exception:
            logger.exception("llm_simplify_error")
            return LlmResult(text=answer, provider="gemini", model=self.model_name)

    async def formulate(
        self,
        language: str,
        contexte_rag: str,
        historique: str,
        question: str,
    ) -> LlmResult:
        return await self.reformulate(
            language, contexte_rag, question, historique=historique
        )


class AnthropicLLMService(LLMService):
    def __init__(self) -> None:
        settings = get_settings()
        self.model_name = (
            settings.llm_model
            if settings.llm_provider == "anthropic"
            else "claude-3-5-sonnet-20241022"
        )
        self.api_key = settings.anthropic_api_key

    async def reformulate(
        self,
        language: str,
        reponse_source: str,
        question: str,
        historique: str = "",
    ) -> LlmResult:
        if not self.api_key or self.api_key.startswith("your-"):
            logger.error("llm_missing_anthropic_key")
            return LlmResult(text="", provider="anthropic", model=self.model_name)

        try:
            from anthropic import AsyncAnthropic

            client = AsyncAnthropic(api_key=self.api_key)
            prompt = build_reformulation_prompt(
                language, reponse_source, question, historique=historique
            )
            resp = await client.messages.create(
                model=self.model_name,
                max_tokens=1536,
                temperature=0.15,
                messages=[{"role": "user", "content": prompt}],
            )
            text = "".join(
                block.text for block in resp.content if getattr(block, "type", "") == "text"
            ).strip()
            return LlmResult(text=text, provider="anthropic", model=self.model_name)
        except Exception:
            logger.exception("llm_anthropic_error")
            return LlmResult(text="", provider="anthropic", model=self.model_name)

    async def formulate(
        self,
        language: str,
        contexte_rag: str,
        historique: str,
        question: str,
    ) -> LlmResult:
        return await self.reformulate(
            language, contexte_rag, question, historique=historique
        )


def get_llm_service() -> LLMService:
    settings = get_settings()
    if settings.llm_provider.lower() == "anthropic":
        return AnthropicLLMService()
    return GeminiLLMService()
