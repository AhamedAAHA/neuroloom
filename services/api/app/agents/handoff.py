import json

from sqlalchemy import select

from app.agents.base import AgentContext
from app.models import AgentStatus, CheckIn, FamilyTask, Handoff, Medication
from app.services.llm import llm_client


class HandoffAgent:
    def __init__(self, ctx: AgentContext):
        self.ctx = ctx

    async def process(self, from_member: str, to_member: str) -> Handoff:
        await self.ctx.log_agent(
            "Handoff",
            f"Preparing shift briefing: {from_member} → {to_member}",
            AgentStatus.RUNNING,
        )

        meds = (
            await self.ctx.db.execute(select(Medication).where(Medication.circle_id == self.ctx.circle_id))
        ).scalars().all()
        checkins = (
            await self.ctx.db.execute(
                select(CheckIn)
                .where(CheckIn.circle_id == self.ctx.circle_id)
                .order_by(CheckIn.created_at.desc())
                .limit(3)
            )
        ).scalars().all()
        tasks = (
            await self.ctx.db.execute(
                select(FamilyTask).where(
                    FamilyTask.circle_id == self.ctx.circle_id,
                    FamilyTask.completed == False,  # noqa: E712
                )
            )
        ).scalars().all()

        context = {
            "medications": [{"name": m.name, "dose": m.dose, "schedule": m.schedule} for m in meds],
            "recent_checkins": [{"mood": c.mood, "notes": c.notes} for c in checkins],
            "pending_tasks": [{"title": t.title, "assigned": t.assigned_to} for t in tasks],
        }

        prompt = f"""Create a care handoff briefing for a family caregiver shift change.
From: {from_member}
To: {to_member}
Context: {json.dumps(context, indent=2)}

Include: Completed today, Pending tasks, Watch items, Emergency contacts placeholder."""

        briefing, route = await llm_client.complete(prompt, route="gemma-amd", max_tokens=1500)

        handoff = Handoff(
            circle_id=self.ctx.circle_id,
            from_member=from_member,
            to_member=to_member,
            briefing=briefing,
        )
        self.ctx.db.add(handoff)
        await self.ctx.db.flush()
        await self.ctx.add_graph_node(
            "handoff",
            f"{from_member} → {to_member}",
            {"id": str(handoff.id)},
        )

        await self.ctx.log_agent(
            "Handoff",
            "Shift briefing ready.",
            AgentStatus.COMPLETE,
            route,
            meta={"from": from_member, "to": to_member},
        )
        return handoff
