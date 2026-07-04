from app.agents.base import AgentContext
from app.agents.check_in_companion import CheckInCompanionAgent, FamilySyncAgent
from app.agents.document_vault import DocumentVaultAgent
from app.agents.emergency_pack import EmergencyPackAgent
from app.agents.handoff import HandoffAgent
from app.agents.med_guard import MedGuardAgent
from app.agents.schedule_keeper import ScheduleKeeperAgent
from app.agents.trend_analyst import TrendAnalystAgent
from app.agents.utils import text_has_medication_hints
from app.models import AgentStatus, CheckIn, Document, FamilyTask, Handoff, Medication


class Conductor:
    """Routes user actions through multi-agent pipelines on AMD Gemma."""

    def __init__(self, ctx: AgentContext):
        self.ctx = ctx

    async def _start_pipeline(self, action: str, agents: list[str]) -> None:
        await self.ctx.log_agent(
            "Conductor",
            f"Routing {action}: {' → '.join(agents)}",
            AgentStatus.RUNNING,
            meta={"pipeline": agents, "action": action},
        )

    async def _finish_pipeline(self, action: str, agents: list[str], summary: str) -> None:
        await self.ctx.log_agent(
            "Conductor",
            summary,
            AgentStatus.COMPLETE,
            meta={"pipeline": agents, "action": action},
        )

    async def pipeline_medication_extract(self, text: str, source: str = "text") -> list[Medication]:
        agents = ["MedGuard", "ScheduleKeeper"]
        await self._start_pipeline("medication_extract", agents)

        meds = await MedGuardAgent(self.ctx).process(text, source)
        keeper = ScheduleKeeperAgent(self.ctx)
        for med in meds:
            await keeper.from_medication(med)

        await self._finish_pipeline(
            "medication_extract",
            agents,
            f"Pipeline complete — {len(meds)} medication(s) extracted and scheduled.",
        )
        return meds

    async def pipeline_document(self, doc: Document) -> Document:
        agents = ["DocumentVault"]
        await self._start_pipeline("document_upload", agents)

        doc, _follow_up = await DocumentVaultAgent(self.ctx).process(doc)
        if doc.doc_type == "discharge":
            agents.append("ScheduleKeeper")

        if text_has_medication_hints(doc.extracted_text):
            agents.append("MedGuard")
            await MedGuardAgent(self.ctx).process(
                doc.extracted_text or "",
                source=f"document:{doc.filename}",
            )

        await self._finish_pipeline(
            "document_upload",
            agents,
            f"Document pipeline complete for {doc.filename}.",
        )
        return doc

    async def pipeline_check_in(self, checkin: CheckIn) -> dict:
        agents = ["CheckInCompanion", "TrendAnalyst"]
        await self._start_pipeline("check_in", agents)

        await CheckInCompanionAgent(self.ctx).record(checkin)
        result = await TrendAnalystAgent(self.ctx).analyze()

        await self._finish_pipeline(
            "check_in",
            agents,
            result.get("summary", "Check-in pipeline complete."),
        )
        return result

    async def pipeline_handoff(self, from_member: str, to_member: str) -> Handoff:
        agents = ["Handoff"]
        await self._start_pipeline("handoff", agents)
        handoff = await HandoffAgent(self.ctx).process(from_member, to_member)
        await self._finish_pipeline("handoff", agents, "Handoff briefing generated.")
        return handoff

    async def pipeline_emergency(self):
        agents = ["EmergencyPack"]
        await self._start_pipeline("emergency_pack", agents)
        pack = await EmergencyPackAgent(self.ctx).generate()
        await self._finish_pipeline("emergency_pack", agents, "Emergency pack ready.")
        return pack

    async def pipeline_task(self, task: FamilyTask) -> None:
        agents = ["FamilySync"]
        await self._start_pipeline("task_create", agents)
        await FamilySyncAgent(self.ctx).assign_task(task)
        await self._finish_pipeline("task_create", agents, f"Task synced: {task.title}")

    async def pipeline_schedule(self, natural_language: str, assigned_to: str | None = None):
        agents = ["ScheduleKeeper"]
        await self._start_pipeline("schedule_parse", agents)
        event = await ScheduleKeeperAgent(self.ctx).parse_natural_language(natural_language, assigned_to)
        await self._finish_pipeline("schedule_parse", agents, f"Event scheduled: {event.title}")
        return event
