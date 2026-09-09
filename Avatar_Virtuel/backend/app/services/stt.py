"""Speech-to-text — faster-whisper (local)."""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from app.config import get_settings
from app.services.base import STTService

logger = logging.getLogger(__name__)

_ALLOWED_EXT = {".mp3", ".wav", ".m4a", ".webm", ".ogg"}


class FasterWhisperSTT(STTService):
    def __init__(self) -> None:
        self.model_size = get_settings().stt_model_size
        self._model = None

    def _get_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel

            self._model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
        return self._model

    async def transcribe(self, audio_bytes: bytes, filename: str) -> str:
        import asyncio

        suffix = Path(filename).suffix.lower() or ".wav"
        if suffix not in _ALLOWED_EXT:
            raise ValueError(f"Format audio non supporté: {suffix}")

        def _run() -> str:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
                tmp.write(audio_bytes)
                tmp.flush()
                model = self._get_model()
                segments, _info = model.transcribe(tmp.name, beam_size=3)
                return " ".join(seg.text.strip() for seg in segments).strip()

        try:
            return await asyncio.to_thread(_run)
        except Exception:
            logger.exception("stt_faster_whisper_error")
            raise


def get_stt_service() -> STTService:
    return FasterWhisperSTT()
