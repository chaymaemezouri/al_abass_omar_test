"""Abstract service interfaces — swap providers via env without rewriting business logic."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class RagHit:
    chunk_id: str
    chapitre: str
    question: str
    reponse: str
    langue: str
    score: float
    source_page: Optional[str] = None
    source_type: str = "qa"


@dataclass
class RagResult:
    hits: list[RagHit] = field(default_factory=list)
    best_score: float = 0.0
    above_threshold: bool = False


@dataclass
class LlmResult:
    text: str
    provider: str
    model: str


@dataclass
class MediaResult:
    url: Optional[str]
    provider: str
    success: bool
    error: Optional[str] = None


class STTService(ABC):
    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        language_hint: Optional[str] = None,
    ) -> str:
        ...


class LanguageService(ABC):
    @abstractmethod
    def detect(self, text: str, hint: Optional[str] = None) -> str:
        """Return 'fr' | 'ar' | 'ary'."""
        ...


class EmbeddingService(ABC):
    @abstractmethod
    async def embed(
        self,
        texts: list[str],
        *,
        task_type: str = "retrieval_document",
    ) -> list[list[float]]:
        """
        Embed texts. For Gemini RAG quality:
        - task_type='retrieval_document' when indexing chunks
        - task_type='retrieval_query' when embedding user questions
        """
        ...


class RAGService(ABC):
    @abstractmethod
    async def search(self, query: str, top_k: int | None = None) -> RagResult:
        ...


class LLMService(ABC):
    @abstractmethod
    async def reformulate(
        self,
        language: str,
        reponse_source: str,
        question: str,
        historique: str = "",
    ) -> LlmResult:
        """Reformulate source answer only — never invent facts."""
        ...

    async def formulate(
        self,
        language: str,
        contexte_rag: str,
        historique: str,
        question: str,
    ) -> LlmResult:
        """Compatibility wrapper: treat contexte as source answer to reformulate."""
        return await self.reformulate(
            language, contexte_rag, question, historique=historique
        )


class GuardrailService(ABC):
    @abstractmethod
    def check_input(self, text: str, language: str) -> tuple[bool, Optional[str]]:
        """Return (is_blocked, fallback_message_if_blocked)."""
        ...

    @abstractmethod
    def validate_output(
        self, answer: str, contexte_rag: str, language: str
    ) -> tuple[bool, str]:
        """Return (is_valid, answer_or_fallback)."""
        ...

    def validate_reformulation(
        self, answer: str, reponse_source: str, language: str
    ) -> tuple[bool, str]:
        """Validate reformulation against source; default delegates to validate_output."""
        return self.validate_output(answer, reponse_source, language)


class TTSService(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str) -> MediaResult:
        ...


class AvatarService(ABC):
    @abstractmethod
    async def generate(
        self, audio_url: str, text: str, language: str = "fr"
    ) -> MediaResult:
        ...
