"""TTS — edge-tts (dev) / ElevenLabs (demo) / espeak fallback. Via TTS_PROVIDER."""
from __future__ import annotations

import asyncio
import logging
import shutil
import subprocess
import uuid
from pathlib import Path

from app.config import get_settings
from app.services.base import MediaResult, TTSService

logger = logging.getLogger(__name__)


def _media_dir() -> Path:
    root = Path(get_settings().media_root)
    audio = root / "audio"
    audio.mkdir(parents=True, exist_ok=True)
    return audio


async def _gtts_synthesize(text: str, language: str, out_path: Path) -> MediaResult:
    """Free Google TTS fallback — more natural than espeak when Edge is blocked."""
    try:
        from gtts import gTTS

        lang = "fr" if language == "fr" else "ar"
        tts = gTTS(text=text[:2000], lang=lang)
        await asyncio.to_thread(tts.save, str(out_path))
        return MediaResult(url=f"/media/audio/{out_path.name}", provider="gtts", success=True)
    except Exception as exc:
        logger.warning("tts_gtts_error err=%s", exc)
        return MediaResult(url=None, provider="gtts", success=False, error=str(exc))


async def _espeak_synthesize(text: str, language: str, out_path: Path) -> MediaResult:
    """Offline TTS fallback when edge-tts / ElevenLabs unavailable."""
    if not shutil.which("espeak-ng") and not shutil.which("espeak"):
        return MediaResult(
            url=None, provider="espeak", success=False, error="espeak-ng not installed"
        )
    bin_name = "espeak-ng" if shutil.which("espeak-ng") else "espeak"
    voice = "fr" if language == "fr" else "ar"
    wav_path = out_path.with_suffix(".wav")

    def _run() -> None:
        subprocess.run(
            [bin_name, "-v", voice, "-w", str(wav_path), text[:2000]],
            check=True,
            capture_output=True,
        )
        # Convert to mp3 if ffmpeg present
        if shutil.which("ffmpeg") and out_path.suffix == ".mp3":
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame", str(out_path)],
                check=True,
                capture_output=True,
            )
            wav_path.unlink(missing_ok=True)
        else:
            wav_path.replace(out_path.with_suffix(".wav"))

    try:
        await asyncio.to_thread(_run)
        url_name = out_path.name if out_path.exists() else out_path.with_suffix(".wav").name
        return MediaResult(url=f"/media/audio/{url_name}", provider="espeak", success=True)
    except Exception as exc:
        logger.exception("tts_espeak_error")
        return MediaResult(url=None, provider="espeak", success=False, error=str(exc))


class EdgeTTSService(TTSService):
    async def synthesize(self, text: str, language: str) -> MediaResult:
        settings = get_settings()
        voice = settings.tts_voice_ar if language in {"ar", "ary"} else settings.tts_voice_fr
        out_name = f"{uuid.uuid4().hex}.mp3"
        out_path = _media_dir() / out_name

        try:
            import edge_tts

            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(str(out_path))
            return MediaResult(url=f"/media/audio/{out_name}", provider="edge", success=True)
        except Exception as exc:
            logger.warning("tts_edge_error falling_back_gtts err=%s", exc)
            # Prefer a slightly more natural free path before robotic espeak.
            gtts_result = await _gtts_synthesize(text, language, out_path)
            if gtts_result.success:
                return gtts_result
            logger.warning("tts_gtts_failed falling_back_espeak")
            return await _espeak_synthesize(text, language, out_path)


class ElevenLabsTTSService(TTSService):
    async def synthesize(self, text: str, language: str) -> MediaResult:
        settings = get_settings()
        if not settings.elevenlabs_api_key or not settings.elevenlabs_voice_id:
            logger.error("tts_elevenlabs_missing_config")
            out_path = _media_dir() / f"{uuid.uuid4().hex}.mp3"
            return await _espeak_synthesize(text, language, out_path)

        out_name = f"{uuid.uuid4().hex}.mp3"
        out_path = _media_dir() / out_name

        try:
            import httpx

            url = (
                f"https://api.elevenlabs.io/v1/text-to-speech/"
                f"{settings.elevenlabs_voice_id}"
            )
            headers = {
                "xi-api-key": settings.elevenlabs_api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            }
            payload = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.4, "similarity_boost": 0.8},
            }
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                out_path.write_bytes(resp.content)
            return MediaResult(
                url=f"/media/audio/{out_name}", provider="elevenlabs", success=True
            )
        except Exception as exc:
            logger.warning("tts_elevenlabs_error falling_back_espeak err=%s", exc)
            return await _espeak_synthesize(text, language, out_path)


class EspeakTTSService(TTSService):
    async def synthesize(self, text: str, language: str) -> MediaResult:
        out_path = _media_dir() / f"{uuid.uuid4().hex}.mp3"
        return await _espeak_synthesize(text, language, out_path)


def get_tts_service() -> TTSService:
    settings = get_settings()
    provider = settings.tts_provider.lower()
    if provider == "elevenlabs":
        return ElevenLabsTTSService()
    if provider == "espeak":
        return EspeakTTSService()
    return EdgeTTSService()
