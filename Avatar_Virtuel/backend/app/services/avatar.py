"""Avatar lip-sync — mock (dev) / HeyGen / D-ID. Provider via AVATAR_PROVIDER."""
from __future__ import annotations

import logging
from pathlib import Path

from app.config import get_settings
from app.services.base import AvatarService, MediaResult

logger = logging.getLogger(__name__)


def _clip_for_avatar(text: str, max_chars: int = 100) -> str:
    """Ultra-short scripts → HeyGen finishes much faster (credits + latency)."""
    cleaned = " ".join((text or "").split()).strip()
    if not cleaned:
        return ""
    for sep in (". ", "! ", "? ", "۔", "؟"):
        idx = cleaned.find(sep)
        if idx < 0:
            continue
        end = idx + (1 if sep in {". ", "! ", "? "} else len(sep))
        if 20 <= end <= max_chars + 5:
            return cleaned[:end].strip()[:max_chars]
    if len(cleaned) <= max_chars:
        return cleaned
    cut = cleaned[:max_chars]
    sp = cut.rfind(" ")
    if sp >= 28:
        return cut[:sp].rstrip(" ,;:") + "…"
    return cut.rstrip(" ,;:") + "…"


def _video_dir() -> Path:
    root = Path(get_settings().media_root)
    video = root / "video"
    video.mkdir(parents=True, exist_ok=True)
    return video


class MockAvatarService(AvatarService):
    """Offline-safe avatar: UI shows static transparent cutout + TTS audio."""

    async def generate(
        self, audio_url: str, text: str, language: str = "fr"
    ) -> MediaResult:
        logger.info("avatar_mock_static_portrait audio=%s", bool(audio_url))
        return MediaResult(url=None, provider="mock", success=True)


class HeyGenAvatarService(AvatarService):
    def _voice_id(self, language: str) -> str:
        settings = get_settings()
        if settings.heygen_voice_id:
            return settings.heygen_voice_id
        lang = (language or "fr").lower()
        if lang in {"ar", "ary"}:
            return settings.heygen_voice_id_ar
        return settings.heygen_voice_id_fr

    async def generate(
        self, audio_url: str, text: str, language: str = "fr"
    ) -> MediaResult:
        settings = get_settings()
        if not settings.heygen_api_key or not settings.heygen_avatar_id:
            return MediaResult(
                url=None,
                provider="heygen",
                success=False,
                error="HEYGEN_API_KEY or HEYGEN_AVATAR_ID missing",
            )
        try:
            import asyncio
            import httpx

            headers = {
                "X-Api-Key": settings.heygen_api_key,
                "Content-Type": "application/json",
            }
            voice_id = self._voice_id(language)
            # Short clip = much faster + fewer credits. Full answer stays in chat.
            script = _clip_for_avatar(text, max_chars=100)
            # Prefer fast MP4 (stage-matched bg). WebM transparency is slower / optional.
            payloads = [
                {
                    "type": "avatar",
                    "avatar_id": settings.heygen_avatar_id,
                    "script": script,
                    "voice_id": voice_id,
                    "title": "avatar-virtuel",
                    "resolution": "720p",
                    "aspect_ratio": "9:16",
                    "background": {"type": "color", "color": "#123A6B"},
                },
                {
                    "type": "avatar",
                    "avatar_id": settings.heygen_avatar_id,
                    "script": script,
                    "voice_id": voice_id,
                    "title": "avatar-virtuel",
                    "resolution": "720p",
                    "aspect_ratio": "9:16",
                    "output_format": "webm",
                },
            ]
            async with httpx.AsyncClient(timeout=120.0) as client:
                create = None
                data = {}
                for payload in payloads:
                    create = await client.post(
                        "https://api.heygen.com/v3/videos",
                        headers=headers,
                        json=payload,
                    )
                    if create.status_code < 400:
                        break
                    logger.warning(
                        "avatar_heygen_create_retry status=%s body=%s",
                        create.status_code,
                        create.text[:400],
                    )
                if create is None or create.status_code >= 400:
                    detail = (create.text if create is not None else "")[:500]
                    logger.error("avatar_heygen_create_failed status=%s body=%s", getattr(create, "status_code", None), detail)
                    return MediaResult(
                        url=None,
                        provider="heygen",
                        success=False,
                        error=f"HeyGen create failed: {detail}",
                    )
                data = create.json().get("data") or {}
                video_id = data.get("video_id") or data.get("id")
                if not video_id:
                    raise RuntimeError(f"HeyGen unexpected response: {create.text[:500]}")

                for _ in range(50):
                    await asyncio.sleep(2)
                    st = await client.get(
                        f"https://api.heygen.com/v3/videos/{video_id}",
                        headers=headers,
                    )
                    st.raise_for_status()
                    body = st.json().get("data") or {}
                    status = body.get("status")
                    if status in {"completed", "done", "success"}:
                        video_url = (
                            body.get("video_url")
                            or body.get("url")
                            or (body.get("video") or {}).get("url")
                        )
                        if not video_url:
                            legacy = await client.get(
                                f"https://api.heygen.com/v1/video_status.get?video_id={video_id}",
                                headers=headers,
                            )
                            legacy.raise_for_status()
                            video_url = (legacy.json().get("data") or {}).get("video_url")
                        if not video_url:
                            raise RuntimeError(f"HeyGen completed without URL: {body}")
                        return MediaResult(
                            url=video_url, provider="heygen", success=True
                        )
                    if status in {"failed", "error"}:
                        raise RuntimeError(body.get("error") or "HeyGen failed")

            return MediaResult(
                url=None, provider="heygen", success=False, error="HeyGen timeout"
            )
        except Exception as exc:
            logger.exception("avatar_heygen_error")
            return MediaResult(url=None, provider="heygen", success=False, error=str(exc))


class DIDAvatarService(AvatarService):
    async def generate(
        self, audio_url: str, text: str, language: str = "fr"
    ) -> MediaResult:
        settings = get_settings()
        if not settings.did_api_key or not settings.did_source_url:
            return MediaResult(
                url=None,
                provider="did",
                success=False,
                error="DID_API_KEY or DID_SOURCE_URL missing",
            )
        try:
            import asyncio
            import httpx
            import base64

            auth = base64.b64encode(f"{settings.did_api_key}:".encode()).decode()
            headers = {
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/json",
            }
            payload = {
                "source_url": settings.did_source_url,
                "script": {
                    "type": "text",
                    "input": text[:2000],
                },
            }
            async with httpx.AsyncClient(timeout=120.0) as client:
                create = await client.post(
                    "https://api.d-id.com/talks", headers=headers, json=payload
                )
                create.raise_for_status()
                talk_id = create.json().get("id")
                if not talk_id:
                    raise RuntimeError("D-ID missing talk id")

                for _ in range(40):
                    await asyncio.sleep(3)
                    st = await client.get(
                        f"https://api.d-id.com/talks/{talk_id}", headers=headers
                    )
                    st.raise_for_status()
                    body = st.json()
                    status = body.get("status")
                    if status == "done":
                        return MediaResult(
                            url=body.get("result_url"), provider="did", success=True
                        )
                    if status == "error":
                        raise RuntimeError(body.get("error") or "D-ID failed")

            return MediaResult(url=None, provider="did", success=False, error="D-ID timeout")
        except Exception as exc:
            logger.exception("avatar_did_error")
            return MediaResult(url=None, provider="did", success=False, error=str(exc))


def get_avatar_service() -> AvatarService:
    settings = get_settings()
    provider = settings.avatar_provider.lower()
    if provider == "heygen":
        return HeyGenAvatarService()
    if provider == "did":
        return DIDAvatarService()
    return MockAvatarService()
