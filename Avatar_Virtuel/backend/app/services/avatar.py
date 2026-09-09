"""Avatar lip-sync — mock (dev) / HeyGen / D-ID. Provider via AVATAR_PROVIDER."""
from __future__ import annotations

import logging
import uuid
from pathlib import Path

from app.config import get_settings
from app.services.base import AvatarService, MediaResult

logger = logging.getLogger(__name__)


def _video_dir() -> Path:
    root = Path(get_settings().media_root)
    video = root / "video"
    video.mkdir(parents=True, exist_ok=True)
    return video


class MockAvatarService(AvatarService):
    """Offline-safe avatar: UI shows static transparent cutout + TTS audio."""

    async def generate(self, audio_url: str, text: str) -> MediaResult:
        logger.info("avatar_mock_static_portrait audio=%s", bool(audio_url))
        return MediaResult(url=None, provider="mock", success=True)


class HeyGenAvatarService(AvatarService):
    async def generate(self, audio_url: str, text: str) -> MediaResult:
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
            # Create talking avatar from text (HeyGen v2 API)
            payload = {
                "video_inputs": [
                    {
                        "character": {
                            "type": "avatar",
                            "avatar_id": settings.heygen_avatar_id,
                            "avatar_style": "normal",
                        },
                        "voice": {
                            "type": "text",
                            "input_text": text[:2000],
                        },
                    }
                ],
                "dimension": {"width": 640, "height": 360},
            }
            async with httpx.AsyncClient(timeout=120.0) as client:
                create = await client.post(
                    "https://api.heygen.com/v2/video/generate",
                    headers=headers,
                    json=payload,
                )
                create.raise_for_status()
                data = create.json()
                video_id = data.get("data", {}).get("video_id")
                if not video_id:
                    raise RuntimeError(f"HeyGen unexpected response: {data}")

                # Poll status
                for _ in range(40):
                    await asyncio.sleep(3)
                    st = await client.get(
                        f"https://api.heygen.com/v1/video_status.get?video_id={video_id}",
                        headers=headers,
                    )
                    st.raise_for_status()
                    body = st.json().get("data", {})
                    status = body.get("status")
                    if status == "completed":
                        video_url = body.get("video_url")
                        return MediaResult(
                            url=video_url, provider="heygen", success=True
                        )
                    if status == "failed":
                        raise RuntimeError(body.get("error") or "HeyGen failed")

            return MediaResult(
                url=None, provider="heygen", success=False, error="HeyGen timeout"
            )
        except Exception as exc:
            logger.exception("avatar_heygen_error")
            return MediaResult(url=None, provider="heygen", success=False, error=str(exc))


class DIDAvatarService(AvatarService):
    async def generate(self, audio_url: str, text: str) -> MediaResult:
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
