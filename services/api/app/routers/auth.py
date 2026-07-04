import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import CircleMember, MagicLinkToken
from app.schemas import MagicLinkRequest, MagicLinkResponse, SessionOut, VerifyResponse
from app.services.auth import (
    MAGIC_LINK_EXPIRE_MINUTES,
    create_access_token,
    decode_access_token,
    new_magic_token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    if not creds:
        return None
    return decode_access_token(creds.credentials)


async def require_user(user: dict | None = Depends(get_current_user)) -> dict:
    if not user:
        raise HTTPException(401, "Not authenticated")
    return user


@router.post("/magic-link", response_model=MagicLinkResponse)
async def request_magic_link(payload: MagicLinkRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(400, "Valid email required")

    token = new_magic_token()
    expires = datetime.now(timezone.utc) + timedelta(minutes=MAGIC_LINK_EXPIRE_MINUTES)
    db.add(MagicLinkToken(email=email, token=token, expires_at=expires))
    await db.flush()

    web_base = settings.web_app_url.rstrip("/")
    magic_link = f"{web_base}/auth/verify?token={token}"

    return MagicLinkResponse(
        message="Magic link created. Open the link to sign in.",
        magic_link=magic_link,
        expires_at=expires.isoformat(),
    )


@router.get("/verify", response_model=VerifyResponse)
async def verify_magic_link(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MagicLinkToken).where(MagicLinkToken.token == token, MagicLinkToken.used == False)  # noqa: E712
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(400, "Invalid or expired link")
    if link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "Link expired")

    members = (
        await db.execute(select(CircleMember).where(CircleMember.email == link.email))
    ).scalars().all()

    link.used = True
    primary = next((m for m in members if m.role.value == "primary"), members[0] if members else None)
    access_token = create_access_token(
        email=link.email,
        name=primary.name if primary else link.email.split("@")[0],
        role=primary.role.value if primary else "viewer",
    )

    circles = [
        {"circle_id": str(m.circle_id), "name": m.name, "role": m.role.value}
        for m in members
    ]

    return VerifyResponse(
        access_token=access_token,
        token_type="bearer",
        user=SessionOut(
            email=link.email,
            name=primary.name if primary else link.email.split("@")[0],
            role=primary.role.value if primary else "viewer",
        ),
        circles=circles,
    )


@router.get("/me", response_model=SessionOut)
async def me(user: dict = Depends(require_user)):
    return SessionOut(
        email=user["email"],
        name=user.get("name") or user["email"].split("@")[0],
        role=user.get("role") or "viewer",
    )
