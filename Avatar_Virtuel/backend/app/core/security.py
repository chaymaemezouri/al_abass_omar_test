"""Security helpers: admin key, CORS policy notes, client hashing, rate limiter."""
import hashlib
import hmac
import logging
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


def hash_client_id(raw: str) -> str:
    """One-way hash for session anonymity (never store raw IP/PII)."""
    settings = get_settings()
    return hmac.new(
        settings.secret_key.encode("utf-8"),
        raw.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


async def require_admin_key(
    x_admin_key: Annotated[str | None, Header(alias="X-Admin-Key")] = None,
) -> None:
    settings = get_settings()
    if not x_admin_key or not hmac.compare_digest(x_admin_key, settings.admin_api_key):
        logger.warning("admin_auth_failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )


def get_client_hash(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    return hash_client_id(ip)


AdminAuth = Annotated[None, Depends(require_admin_key)]
