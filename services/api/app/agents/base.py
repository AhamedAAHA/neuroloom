import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AgentRun, AgentStatus, GraphNode
from app.services.pubsub import publish_agent_event


class AgentContext:
    """Shared context for all Neuroloom agents — logging, graph, DB."""

    def __init__(self, db: AsyncSession, circle_id: uuid.UUID):
        self.db = db
        self.circle_id = circle_id
        self._node_index: dict[tuple[str, str], uuid.UUID] = {}

    async def log_agent(
        self,
        agent_name: str,
        message: str,
        status: AgentStatus = AgentStatus.RUNNING,
        route: str = "gemma-amd",
        meta: dict | None = None,
    ) -> AgentRun:
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
        await publish_agent_event(
            str(self.circle_id),
            {
                "agent": agent_name,
                "status": status.value,
                "message": message,
                "route": route,
                "metadata": meta or {},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return run

    async def add_graph_node(
        self,
        node_type: str,
        label: str,
        data: dict | None = None,
        *,
        links: list[dict] | None = None,
    ) -> GraphNode:
        payload = dict(data or {})
        if links:
            payload["links"] = links
        node = GraphNode(
            circle_id=self.circle_id,
            node_type=node_type,
            label=label,
            data=payload,
        )
        self.db.add(node)
        await self.db.flush()
        self._node_index[(node_type, label)] = node.id
        return node

    def link_nodes(self, source: GraphNode, target: GraphNode, relation: str) -> None:
        links = list(source.data.get("links", []))
        links.append({"target_id": str(target.id), "target_label": target.label, "relation": relation})
        source.data = {**source.data, "links": links}
