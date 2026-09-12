"""Chat endpoints — text, audio, speak, simplify, stream."""
import asyncio
import json
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.prompts import STT_FAILURE
from app.core.security import get_client_hash, limiter
from app.db.session import get_db
from app.schemas.chat import (
    AvatarMediaRequest,
    AvatarMediaResponse,
    ChatResponse,
    ChatTextRequest,
    SimplifyRequest,
    SimplifyResponse,
    SpeakRequest,
    SpeakResponse,
)
from app.services.avatar import get_avatar_service
from app.services.language import get_language_service
from app.services.pipeline import run_text_pipeline, simplify_answer
from app.services.stt import get_stt_service
from app.services.tts import get_tts_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

ALLOWED_MIME = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/webm",
    "audio/ogg",
    "application/octet-stream",
}
ALLOWED_EXT = {".mp3", ".wav", ".m4a", ".webm", ".ogg"}


@router.post("/text", response_model=ChatResponse)
@limiter.limit(get_settings().rate_limit_chat)
async def chat_text(
    request: Request,
    body: ChatTextRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    client_hash = get_client_hash(request)
    try:
        return await run_text_pipeline(
            db=db,
            question=body.question,
            session_id=body.session_id,
            client_hash=client_hash,
            language_hint=body.language_hint,
            generate_media=body.include_media,
        )
    except Exception:
        logger.exception("chat_text_error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue. Veuillez réessayer.",
        )


@router.post("/speak", response_model=SpeakResponse)
@limiter.limit(get_settings().rate_limit_chat)
async def chat_speak(request: Request, body: SpeakRequest) -> SpeakResponse:
    """TTS only — used after fast text reply so the UI is not blocked on audio."""
    lang = body.language if body.language in {"fr", "ar", "ary"} else "fr"
    try:
        tts = get_tts_service()
        result = await tts.synthesize(body.text, lang)
        return SpeakResponse(audio_url=result.url if result.success else None, success=result.success)
    except Exception:
        logger.exception("chat_speak_error")
        return SpeakResponse(audio_url=None, success=False)


@router.post("/avatar", response_model=AvatarMediaResponse)
@limiter.limit(get_settings().rate_limit_chat)
async def chat_avatar(request: Request, body: AvatarMediaRequest) -> AvatarMediaResponse:
    """Lip-sync video only (HeyGen/D-ID) — called after fast text/TTS so chat stays snappy."""
    settings = get_settings()
    lang = body.language if body.language in {"fr", "ar", "ary"} else "fr"
    if settings.avatar_provider.lower() == "mock":
        return AvatarMediaResponse(video_url=None, success=True, provider="mock")
    try:
        avatar = get_avatar_service()
        result = await avatar.generate(audio_url="", text=body.text, language=lang)
        return AvatarMediaResponse(
            video_url=result.url if result.success else None,
            success=result.success,
            provider=result.provider,
            error=None if result.success else result.error,
        )
    except Exception as exc:
        logger.exception("chat_avatar_error")
        return AvatarMediaResponse(
            video_url=None,
            success=False,
            provider=settings.avatar_provider,
            error=str(exc),
        )


@router.post("/simplify", response_model=SimplifyResponse)
@limiter.limit(get_settings().rate_limit_chat)
async def chat_simplify(request: Request, body: SimplifyRequest) -> SimplifyResponse:
    """Reformulate last answer more simply — same facts."""
    lang = body.language if body.language in {"fr", "ar", "ary"} else "fr"
    try:
        answer = await simplify_answer(lang, body.text)
        return SimplifyResponse(answer=answer, language=lang)
    except Exception:
        logger.exception("chat_simplify_error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de simplifier la réponse.",
        )


@router.post("/stream")
@limiter.limit(get_settings().rate_limit_chat)
async def chat_stream(
    request: Request,
    body: ChatTextRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    SSE stream: status → token* → done (full payload).
    Text is streamed during reformulation; media is not included (client can speak after).
    """
    client_hash = get_client_hash(request)

    async def event_gen():
        try:
            yield _sse({"type": "status", "message": "thinking"})
            # Run full pipeline without media, then simulate token stream for UX
            # (Gemini stream is used inside reformulate when available via chunked send)
            result = await run_text_pipeline(
                db=db,
                question=body.question,
                session_id=body.session_id,
                client_hash=client_hash,
                language_hint=body.language_hint,
                generate_media=False,
                include_followups=False,
            )
            # Reveal quickly (pipeline already finished; avoid slow fake typing)
            text = result.answer or ""
            words = text.split(" ") if text else []
            chunk_size = 4
            for i in range(0, len(words), chunk_size):
                piece = " ".join(words[i : i + chunk_size])
                if i + chunk_size < len(words):
                    piece += " "
                yield _sse({"type": "token", "text": piece})
                await asyncio.sleep(0)
            payload = result.model_dump(mode="json")
            yield _sse({"type": "done", "data": payload})
        except Exception as exc:
            logger.exception("chat_stream_error")
            yield _sse({"type": "error", "detail": str(exc)[:200]})

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _sse(obj: dict) -> str:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


@router.post("/audio", response_model=ChatResponse)
@limiter.limit(get_settings().rate_limit_audio)
async def chat_audio(
    request: Request,
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(default=None),
    language_hint: Optional[str] = Form(default=None),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    settings = get_settings()
    filename = file.filename or "audio.wav"
    ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format audio non autorisé. Utilisez mp3, wav, m4a, webm ou ogg.",
        )

    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type MIME audio non autorisé.",
        )

    raw = await file.read()
    if len(raw) > settings.max_audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Fichier trop volumineux (max {settings.max_audio_upload_mb} Mo).",
        )
    if not raw:
        raise HTTPException(status_code=400, detail="Fichier audio vide.")

    lang_svc = get_language_service()
    hint = language_hint if language_hint in {"fr", "ar", "ary"} else None

    try:
        stt = get_stt_service()
        transcript = await stt.transcribe(raw, filename, language_hint=hint)
        logger.info("stt_transcript_preview len=%s hint=%s", len(transcript or ""), hint)
    except Exception:
        logger.exception("stt_failed")
        language = hint or "fr"
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=STT_FAILURE.get(language, STT_FAILURE["fr"]),
        )

    if not transcript:
        language = hint or "fr"
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=STT_FAILURE.get(language, STT_FAILURE["fr"]),
        )

    sid = None
    if session_id:
        try:
            sid = UUID(session_id)
        except ValueError:
            sid = None

    client_hash = get_client_hash(request)
    try:
        return await run_text_pipeline(
            db=db,
            question=transcript,
            session_id=sid,
            client_hash=client_hash,
            language_hint=hint or lang_svc.detect(transcript),
            generate_media=True,
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("chat_audio_error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue. Veuillez réessayer.",
        )
