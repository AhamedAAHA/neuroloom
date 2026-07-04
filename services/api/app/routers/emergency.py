import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import EmergencyPack

router = APIRouter(prefix="/api/emergency", tags=["emergency"])


@router.get("/{token}")
async def get_emergency_pack(token: str, pin: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmergencyPack).where(EmergencyPack.share_token == token))
    pack = result.scalar_one_or_none()
    if not pack:
        raise HTTPException(404, "Emergency pack not found")
    if pack.pin != pin:
        raise HTTPException(403, "Invalid PIN")
    return {
        "content": pack.content,
        "expires_at": pack.expires_at.isoformat() if pack.expires_at else None,
        "disclaimer": "Neuroloom provides care coordination only — not medical advice.",
    }
