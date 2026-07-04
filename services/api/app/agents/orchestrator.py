import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import AgentContext
from app.agents.conductor import Conductor
from app.agents.trend_analyst import TrendAnalystAgent
from app.models import AgentStatus, CheckIn, Document, FamilyTask, GraphNode, Handoff, Medication


class AgentOrchestrator:
    """Backward-compatible facade — delegates to Conductor + AgentContext."""

    def __init__(self, db: AsyncSession, circle_id: uuid.UUID):
        self.ctx = AgentContext(db, circle_id)
        self.conductor = Conductor(self.ctx)
        self.db = db
        self.circle_id = circle_id

    async def log_agent(
        self,
        agent_name: str,
        message: str,
        status: AgentStatus = AgentStatus.RUNNING,
        route: str = "gemma-amd",
        meta: dict | None = None,
    ):
        return await self.ctx.log_agent(agent_name, message, status, route, meta)

    async def add_graph_node(
        self,
        node_type: str,
        label: str,
        data: dict | None = None,
        *,
        links: list[dict] | None = None,
    ) -> GraphNode:
        return await self.ctx.add_graph_node(node_type, label, data, links=links)

    async def process_medication_text(self, text: str, source: str = "text") -> list[Medication]:
        return await self.conductor.pipeline_medication_extract(text, source)

    async def process_document(self, doc: Document) -> Document:
        return await self.conductor.pipeline_document(doc)

    async def create_handoff(self, from_member: str, to_member: str) -> Handoff:
        return await self.conductor.pipeline_handoff(from_member, to_member)

    async def generate_emergency_pack(self):
        return await self.conductor.pipeline_emergency()

    async def analyze_trends(self) -> dict[str, Any]:
        return await TrendAnalystAgent(self.ctx).analyze()

    async def parse_schedule(self, natural_language: str, assigned_to: str | None = None):
        return await self.conductor.pipeline_schedule(natural_language, assigned_to)

    async def process_check_in(self, checkin: CheckIn) -> dict[str, Any]:
        return await self.conductor.pipeline_check_in(checkin)

    async def process_task(self, task: FamilyTask) -> None:
        await self.conductor.pipeline_task(task)
