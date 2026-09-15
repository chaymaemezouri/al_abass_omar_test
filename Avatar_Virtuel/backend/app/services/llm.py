"""LLM wrappers — reformulation (+ streaming / simplify)."""
from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator

from app.config import get_settings
from app.core.prompts import build_reformulation_prompt, build_simplify_prompt
from app.services.base import LLMService, LlmResult
from app.services.gemini_client import gemini_generate_content, has_gemini_api_key

logger = logging.getLogger(__name__)

_REFORMULATE_TOKENS = 400


class GeminiLLMService(LLMService):
    def __init__(self) -> None:
        settings = get_settings()
        self.model_name = settings.llm_model or settings.translation_model

    async def reformulate(
        self,
        language: str,
        reponse_source: str,
        question: str,
        historique: str = "",
    ) -> LlmResult:
        if not has_gemini_api_key():
            logger.warning("llm_gemini_skip reason=missing_or_placeholder_key")
            return LlmResult(text="", provider="gemini", model=self.model_name)

        try:
            prompt = build_reformulation_prompt(
                language, reponse_source, question, historique=historique
            )
            text, key_label = await gemini_generate_content(
                prompt=prompt,
                model_name=self.model_name,
                generation_config={
                    "temperature": 0.1,
                    "max_output_tokens": _REFORMULATE_TOKENS,
                },
                timeout=25.0,
            )
            provider = f"gemini:{key_label}"
            return LlmResult(text=text, provider=provider, model=self.model_name)
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
        if not has_gemini_api_key():
            return
        try:
            import google.generativeai as genai

            from app.services.gemini_client import list_gemini_api_keys

            prompt = build_reformulation_prompt(
                language, reponse_source, question, historique=historique
            )
            keys = list_gemini_api_keys()
            if not keys:
                return

            import queue
            import threading

            out: queue.Queue[str | None] = queue.Queue()

            def _produce() -> None:
                last_exc: Exception | None = None
                for api_key in keys:
                    try:
                        genai.configure(api_key=api_key)
                        model = genai.GenerativeModel(
                            self.model_name,
                            generation_config={
                                "temperature": 0.1,
                                "max_output_tokens": _REFORMULATE_TOKENS,
                            },
                        )
                        stream = model.generate_content(prompt, stream=True)
                        for chunk in stream:
                            t = getattr(chunk, "text", None) or ""
                            if t:
                                out.put(t)
                        last_exc = None
                        break
                    except Exception as exc:
                        last_exc = exc
                        logger.warning(
                            "llm_gemini_stream_key_fail err=%s",
                            type(exc).__name__,
                        )
                if last_exc is not None:
                    logger.exception("llm_gemini_stream_produce_error")
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
        if not has_gemini_api_key():
            return LlmResult(text=answer, provider="gemini", model=self.model_name)
        try:
            prompt = build_simplify_prompt(language, answer)
            text, key_label = await gemini_generate_content(
                prompt=prompt,
                model_name=self.model_name,
                generation_config={"temperature": 0.2, "max_output_tokens": 256},
                timeout=20.0,
            )
            return LlmResult(
                text=text or answer,
                provider=f"gemini:{key_label}",
                model=self.model_name,
            )
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
                max_tokens=512,
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
