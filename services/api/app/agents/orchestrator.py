import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    AgentRun,
    AgentStatus,
    CareEvent,
    CheckIn,
    Document,
    EmergencyPack,
    FamilyTask,
    GraphNode,
    Handoff,
    Medication,
)
from app.services.llm import llm_client
from app.services.pubsub import publish_agent_event


class AgentOrchestrator:
    def __init__(self, db: AsyncSession, circle_id: uuid.UUID):
        self.db = db
        self.circle_id = circle_id

    async def log_agent(self, agent_name: str, message: str, status: AgentStatus = AgentStatus.RUNNING, route: str = "gemma-amd", meta: dict | None = None):
        run = AgentRun(
            circle_id=self.circle_id,
            agent_name=agent_name,
            status=status,
            message=message,
            model_route=route,
            metadata_json=meta or {},
        )
        self.db.add(run)
        await self.db.flush()
        await publish_agent_event(str(self.circle_id), {
            "agent": agent_name,
            "status": status.value,
            "message": message,
            "route": route,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        return run

    async def add_graph_node(self, node_type: str, label: str, data: dict | None = None):
        node = GraphNode(
            circle_id=self.circle_id,
            node_type=node_type,
            label=label,
            data=data or {},
        )
        self.db.add(node)
        await self.db.flush()
        return node

    async def process_medication_text(self, text: str, source: str = "text") -> list[Medication]:
        await self.log_agent("MedGuard", "Analyzing medication information...", AgentStatus.RUNNING, "gemma-multimodal-amd")

        prompt = f"""Extract medications from this text. Return ONLY a JSON array with objects having keys: name, dose, schedule, instructions.
Text:
{text}"""

        response, route = await llm_client.complete(
            prompt,
            system="You extract structured medication data for family caregivers. Return valid JSON only.",
            route="gemma-multimodal-amd",
        )

        meds_data = self._parse_json_array(response)
        created = []
        for m in meds_data:
            med = Medication(
                circle_id=self.circle_id,
                name=m.get("name", "Unknown"),
                dose=m.get("dose", ""),
                schedule=m.get("schedule", ""),
                instructions=m.get("instructions"),
                source=source,
                confirmed=False,
            )
            self.db.add(med)
            created.append(med)
            await self.add_graph_node("medication", med.name, {"dose": med.dose, "schedule": med.schedule})

        await self.log_agent(
            "MedGuard",
            f"Extracted {len(created)} medication(s). Please confirm before saving.",
            AgentStatus.COMPLETE,
            route,
        )
        return created

    async def process_document(self, doc: Document) -> Document:
        await self.log_agent("DocumentVault", f"Indexing {doc.filename}...", AgentStatus.RUNNING, "gemma-multimodal-amd")

        text = doc.extracted_text or ""
        prompt = f"""Summarize this care document for a family caregiver. Extract key action items and dates.
Document type: {doc.doc_type}
Content:
{text[:8000]}"""

        summary, route = await llm_client.complete(prompt, route="gemma-multimodal-amd")
        doc.summary = summary
        await self.add_graph_node("document", doc.filename, {"type": doc.doc_type, "summary": summary[:200]})

        # Auto-suggest follow-up event from discharge docs
        if doc.doc_type == "discharge":
            event = CareEvent(
                circle_id=self.circle_id,
                title="Cardiology follow-up (from discharge)",
                event_type="appointment",
                scheduled_at=datetime.now(timezone.utc) + timedelta(days=7),
                notes="Auto-suggested by Document Vault agent",
            )
            self.db.add(event)
            await self.add_graph_node("event", event.title, {"type": "appointment"})

        await self.log_agent("DocumentVault", "Document indexed and summarized.", AgentStatus.COMPLETE, route)
        return doc

    async def create_handoff(self, from_member: str, to_member: str) -> Handoff:
        await self.log_agent("Handoff", f"Preparing shift briefing: {from_member} → {to_member}", AgentStatus.RUNNING)

        meds = (await self.db.execute(select(Medication).where(Medication.circle_id == self.circle_id))).scalars().all()
        checkins = (await self.db.execute(select(CheckIn).where(CheckIn.circle_id == self.circle_id).order_by(CheckIn.created_at.desc()).limit(3))).scalars().all()
        tasks = (await self.db.execute(select(FamilyTask).where(FamilyTask.circle_id == self.circle_id, FamilyTask.completed == False))).scalars().all()  # noqa: E712

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
            circle_id=self.circle_id,
            from_member=from_member,
            to_member=to_member,
            briefing=briefing,
        )
        self.db.add(handoff)
        await self.add_graph_node("handoff", f"{from_member} → {to_member}", {"id": str(handoff.id)})

        await self.log_agent("Handoff", "Shift briefing ready.", AgentStatus.COMPLETE, route)
        return handoff

    async def generate_emergency_pack(self) -> EmergencyPack:
        await self.log_agent("EmergencyPack", "Compiling emergency care packet...", AgentStatus.RUNNING)

        meds = (await self.db.execute(select(Medication).where(Medication.circle_id == self.circle_id))).scalars().all()
        checkins = (await self.db.execute(select(CheckIn).where(CheckIn.circle_id == self.circle_id).order_by(CheckIn.created_at.desc()).limit(1))).scalars().one_or_none()

        context = {
            "medications": [{"name": m.name, "dose": m.dose, "schedule": m.schedule} for m in meds],
            "last_checkin": {"mood": checkins.mood, "notes": checkins.notes} if checkins else None,
        }

        prompt = f"Generate an emergency care packet for ER staff and family. Context: {json.dumps(context)}"
        content, route = await llm_client.complete(prompt, route="gemma-amd", max_tokens=2000)

        pack = EmergencyPack(
            circle_id=self.circle_id,
            share_token=uuid.uuid4().hex[:16],
            content=content,
            pin=f"{hash(str(self.circle_id)) % 10000:04d}",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=72),
        )
        self.db.add(pack)

        await self.log_agent("EmergencyPack", "Emergency packet ready to share.", AgentStatus.COMPLETE, route)
        return pack

    async def analyze_trends(self) -> dict[str, Any]:
        await self.log_agent("TrendAnalyst", "Analyzing care patterns...", AgentStatus.RUNNING)

        checkins = (await self.db.execute(
            select(CheckIn).where(CheckIn.circle_id == self.circle_id).order_by(CheckIn.created_at.desc()).limit(14)
        )).scalars().all()

        if len(checkins) < 2:
            await self.log_agent("TrendAnalyst", "Not enough data yet for trend analysis.", AgentStatus.COMPLETE)
            return {"alerts": [], "summary": "Need more check-ins"}

        moods = [c.mood for c in checkins]
        low_mood_streak = sum(1 for m in moods[:3] if m <= 2)
        alerts = []
        if low_mood_streak >= 3:
            alerts.append("3 consecutive low-mood check-ins detected — consider reaching out")
        if sum(moods) / len(moods) < 2.5:
            alerts.append("Average mood below baseline this week")

        summary = f"Analyzed {len(checkins)} check-ins. Average mood: {sum(moods)/len(moods):.1f}/5."
        await self.log_agent("TrendAnalyst", summary, AgentStatus.COMPLETE, meta={"alerts": alerts})
        return {"alerts": alerts, "summary": summary}

    async def parse_schedule(self, natural_language: str, assigned_to: str | None = None) -> CareEvent:
        await self.log_agent("ScheduleKeeper", "Parsing appointment...", AgentStatus.RUNNING)

        prompt = f"""Parse this into JSON with keys: title, event_type, notes. Use ISO date if mentioned, else null.
Input: {natural_language}"""
        response, route = await llm_client.complete(prompt, route="gemma-amd", max_tokens=256)

        try:
            data = json.loads(self._extract_json(response))
        except json.JSONDecodeError:
            data = {"title": natural_language, "event_type": "appointment", "notes": None}

        event = CareEvent(
            circle_id=self.circle_id,
            title=data.get("title", natural_language),
            event_type=data.get("event_type", "appointment"),
            assigned_to=assigned_to,
            notes=data.get("notes"),
        )
        self.db.add(event)
        await self.add_graph_node("event", event.title, {"type": event.event_type})

        await self.log_agent("ScheduleKeeper", f"Added: {event.title}", AgentStatus.COMPLETE, route)
        return event

    def _parse_json_array(self, text: str) -> list[dict]:
        try:
            return json.loads(self._extract_json(text))
        except json.JSONDecodeError:
            return []

    def _extract_json(self, text: str) -> str:
        match = re.search(r"\[.*\]|\{.*\}", text, re.DOTALL)
        return match.group(0) if match else text
