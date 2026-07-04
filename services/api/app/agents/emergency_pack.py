import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.agents.base import AgentContext
from app.models import AgentStatus, CheckIn, EmergencyPack, Medication
from app.services.llm import llm_client


class EmergencyPackAgent:
    def __init__(self, ctx: AgentContext):
        self.ctx = ctx

    async def generate(self) -> EmergencyPack:
        await self.ctx.log_agent("EmergencyPack", "Compiling emergency care packet...", AgentStatus.RUNNING)

        meds = (
            await self.ctx.db.execute(select(Medication).where(Medication.circle_id == self.ctx.circle_id))
        ).scalars().all()
        checkin = (
            await self.ctx.db.execute(
                select(CheckIn)
                .where(CheckIn.circle_id == self.ctx.circle_id)
                .order_by(CheckIn.created_at.desc())
                .limit(1)
            )
        ).scalars().one_or_none()

        context = {
            "medications": [{"name": m.name, "dose": m.dose, "schedule": m.schedule} for m in meds],
            "last_checkin": {"mood": checkin.mood, "notes": checkin.notes} if checkin else None,
        }

        prompt = f"Generate an emergency care packet for ER staff and family. Context: {context}"
        content, route = await llm_client.complete(prompt, route="gemma-amd", max_tokens=2000)

        pack = EmergencyPack(
            circle_id=self.ctx.circle_id,
            share_token=uuid.uuid4().hex[:16],
            content=content,
            pin=f"{hash(str(self.ctx.circle_id)) % 10000:04d}",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=72),
        )
        self.ctx.db.add(pack)

        await self.ctx.log_agent(
            "EmergencyPack",
            "Emergency packet ready to share.",
            AgentStatus.COMPLETE,
            route,
        )
        return pack
