"""Speech-to-text — faster-whisper tuned for FR / Arabic MSA / Moroccan Darija."""
from __future__ import annotations

import logging
import re
import tempfile
from pathlib import Path
from typing import Optional

from app.config import get_settings
from app.services.base import STTService

logger = logging.getLogger(__name__)

_ALLOWED_EXT = {".mp3", ".wav", ".m4a", ".webm", ".ogg"}

_PROMPT = {
    "fr": (
        "Question d'un citoyen marocain sur la plateforme électorale 2026 d'Al Abass Omar. "
        "Thèmes : PME, NEET, eau, dessalement, numérique, santé, emploi, agriculture, justice. "
        "Français oral naturel du Maroc."
    ),
    "ar": (
        "سؤال مواطن مغربي حول الأرضية الانتخابية 2026 للعباس عمر. "
        "المواضيع: المقاولات، الشباب، الماء، التحلية، الرقمنة، الصحة، التشغيل، الفلاحة. "
        "العربية الفصحى أو الدارجة المغربية."
    ),
    "ary": (
        "سؤال بالدارجة المغربية على الأرضية الانتخابية 2026. "
        "كلمات دارجة: واش، شنو، كيفاش، شحال، بغيت، عافاك، دابا، بزاف، مزيان، ديال. "
        "Mélange darija / français possible : PME, NEET, digital, eau."
    ),
}

_DARIJA_MARKERS = re.compile(
    r"(واش|شنو|كيفاش|شحال|بغيت|عافاك|دابا|بزاف|مزيان|ديال|"
    r"wach|chnou|chno|kifach|kifash|ch7al|shhal|bghit|3afak|daba|bezzaf|dyal)",
    re.IGNORECASE,
)


def _clean_transcript(text: str) -> str:
    cleaned = (text or "").strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    low = cleaned.lower().strip(" .،!")
    junk = {
        "thanks for watching",
        "thank you for watching",
        "sous-titres réalisés par",
        "subtitles by",
        "subscribe",
        "music",
        "[musique]",
        "(silence)",
        "www.youtube.com",
    }
    if not cleaned or low in junk:
        return ""
    if len(cleaned) < 2:
        return ""
    return cleaned


def _score_transcript(text: str, hint: Optional[str]) -> float:
    """Prefer transcripts that look like a real citizen question in the expected language."""
    t = (text or "").strip()
    if not t:
        return -1.0
    score = min(len(t), 80) / 80.0
    has_ar = bool(re.search(r"[\u0600-\u06FF]", t))
    has_lat = bool(re.search(r"[A-Za-zÀ-ÿ]", t))
    if hint == "fr":
        score += 0.35 if has_lat else -0.2
        score += 0.1 if ("?" in t or "؟" in t) else 0
    elif hint in {"ar", "ary"}:
        score += 0.4 if has_ar else 0.05
        if hint == "ary" and _DARIJA_MARKERS.search(t):
            score += 0.35
        if hint == "ary" and has_lat and has_ar:
            score += 0.15  # code-switching typical of Darija speakers
    else:
        score += 0.15 if (has_ar or has_lat) else 0
    return score


class FasterWhisperSTT(STTService):
    def __init__(self) -> None:
        settings = get_settings()
        self.model_size = settings.stt_model_size
        self._model = None

    def _get_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel

            logger.info("stt_loading_model size=%s device=cpu", self.model_size)
            self._model = WhisperModel(
                self.model_size,
                device="cpu",
                compute_type="int8",
            )
        return self._model

    def _transcribe_once(
        self,
        path: str,
        *,
        language: Optional[str],
        prompt: str,
    ) -> str:
        model = self._get_model()
        segments, info = model.transcribe(
            path,
            language=language,
            task="transcribe",
            beam_size=5,
            best_of=5,
            patience=1.0,
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": 350,
                "speech_pad_ms": 250,
            },
            condition_on_previous_text=False,
            initial_prompt=prompt,
            temperature=[0.0, 0.2, 0.4],
            without_timestamps=True,
        )
        text = " ".join(seg.text.strip() for seg in segments).strip()
        detected = getattr(info, "language", None)
        logger.info(
            "stt_pass language=%s detected=%s chars=%s",
            language,
            detected,
            len(text),
        )
        return _clean_transcript(text)

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        language_hint: Optional[str] = None,
    ) -> str:
        import asyncio

        suffix = Path(filename).suffix.lower() or ".wav"
        if suffix not in _ALLOWED_EXT:
            raise ValueError(f"Format audio non supporté: {suffix}")

        hint = language_hint if language_hint in {"fr", "ar", "ary"} else None

        def _run() -> str:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
                tmp.write(audio_bytes)
                tmp.flush()
                path = tmp.name

                # Primary pass biased to UI language
                if hint == "fr":
                    candidates = [
                        self._transcribe_once(path, language="fr", prompt=_PROMPT["fr"]),
                    ]
                elif hint == "ar":
                    candidates = [
                        self._transcribe_once(path, language="ar", prompt=_PROMPT["ar"]),
                    ]
                elif hint == "ary":
                    # Darija: Arabic script pass + French pass (latin darija / code-switch)
                    candidates = [
                        self._transcribe_once(path, language="ar", prompt=_PROMPT["ary"]),
                        self._transcribe_once(path, language="fr", prompt=_PROMPT["ary"]),
                    ]
                else:
                    # Auto: try Arabic then French (Morocco bilingual)
                    candidates = [
                        self._transcribe_once(path, language="ar", prompt=_PROMPT["ar"]),
                        self._transcribe_once(path, language="fr", prompt=_PROMPT["fr"]),
                    ]

                best = max(candidates, key=lambda t: _score_transcript(t, hint))
                logger.info(
                    "stt_best hint=%s score=%.2f text=%r",
                    hint,
                    _score_transcript(best, hint),
                    (best or "")[:80],
                )
                return best

        try:
            return await asyncio.to_thread(_run)
        except Exception:
            logger.exception("stt_faster_whisper_error")
            raise


def get_stt_service() -> STTService:
    return FasterWhisperSTT()
