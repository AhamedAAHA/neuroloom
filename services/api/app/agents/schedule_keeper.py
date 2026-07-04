import json

from app.agents.base import AgentContext
from app.agents.utils import extract_json
from app.models import AgentStatus, CareEvent, Medication
from app.services.llm import llm_client


class ScheduleKeeperAgent:
    def __init__(self, ctx: AgentContext):
        self.ctx = ctx

    async def parse_natural_language(self, natural_language: str, assigned_to: str | None = None) -> CareEvent:
        await self.ctx.log_agent("ScheduleKeeper", "Parsing appointment...", AgentStatus.RUNNING)

        prompt = f"""Parse this into JSON with keys: title, event_type, notes. Use ISO date if mentioned, else null.
Input: {natural_language}"""
        response, route = await llm_client.complete(prompt, route="gemma-amd", max_tokens=256)

        try:
            data = json.loads(extract_json(response))
        except json.JSONDecodeError:
            data = {"title": natural_language, "event_type": "appointment", "notes": None}

        event = CareEvent(
            circle_id=self.ctx.circle_id,
            title=data.get("title", natural_language),
            event_type=data.get("event_type", "appointment"),
            assigned_to=assigned_to,
            notes=data.get("notes"),
        )
        self.ctx.db.add(event)
        await self.ctx.db.flush()
        await self.ctx.add_graph_node("event", event.title, {"type": event.event_type})

        await self.ctx.log_agent(
            "ScheduleKeeper",
            f"Added: {event.title}",
            AgentStatus.COMPLETE,
            route,
        )
        return event

    async def from_medication(self, med: Medication) -> CareEvent | None:
        if not med.schedule.strip():
            return None

        await self.ctx.log_agent(
            "ScheduleKeeper",
            f"Scheduling reminders for {med.name}...",
            AgentStatus.RUNNING,
        )

        event = CareEvent(
            circle_id=self.ctx.circle_id,
            title=f"{med.name} — {med.schedule}",
            event_type="medication",
            assigned_to=None,
            notes=f"Auto-scheduled from MedGuard ({med.dose})",
        )
        self.ctx.db.add(event)
        await self.ctx.db.flush()
        med_node = await self.ctx.add_graph_node(
            "medication",
            med.name,
            {"dose": med.dose, "schedule": med.schedule},
        )
        event_node = await self.ctx.add_graph_node(
            "event",
            event.title,
            {"type": "medication"},
            links=[{"target_id": str(med_node.id), "target_label": med.name, "relation": "reminds"}],
        )
        self.ctx.link_nodes(med_node, event_node, "scheduled_as")

        await self.ctx.log_agent(
            "ScheduleKeeper",
            f"Medication schedule linked: {med.name}",
            AgentStatus.COMPLETE,
            meta={"medication": med.name},
        )
        return event
