from datetime import datetime, timedelta, timezone

from app.agents.base import AgentContext
from app.models import AgentStatus, CareEvent, Document
from app.services.llm import llm_client


class DocumentVaultAgent:
    def __init__(self, ctx: AgentContext):
        self.ctx = ctx

    async def process(self, doc: Document) -> tuple[Document, CareEvent | None]:
        await self.ctx.log_agent(
            "DocumentVault",
            f"Indexing {doc.filename}...",
            AgentStatus.RUNNING,
            "gemma-multimodal-amd",
        )

        text = doc.extracted_text or ""
        prompt = f"""Summarize this care document for a family caregiver. Extract key action items and dates.
Document type: {doc.doc_type}
Content:
{text[:8000]}"""

        summary, route = await llm_client.complete(prompt, route="gemma-multimodal-amd")
        doc.summary = summary
        doc_node = await self.ctx.add_graph_node(
            "document",
            doc.filename,
            {"type": doc.doc_type, "summary": summary[:200]},
        )

        follow_up: CareEvent | None = None
        if doc.doc_type == "discharge":
            follow_up = CareEvent(
                circle_id=self.ctx.circle_id,
                title="Cardiology follow-up (from discharge)",
                event_type="appointment",
                scheduled_at=datetime.now(timezone.utc) + timedelta(days=7),
                notes="Auto-suggested by Document Vault agent",
            )
            self.ctx.db.add(follow_up)
            await self.ctx.db.flush()
            event_node = await self.ctx.add_graph_node(
                "event",
                follow_up.title,
                {"type": "appointment"},
                links=[{"target_id": str(doc_node.id), "target_label": doc.filename, "relation": "derived_from"}],
            )
            self.ctx.link_nodes(doc_node, event_node, "suggests")

        await self.ctx.log_agent(
            "DocumentVault",
            "Document indexed and summarized.",
            AgentStatus.COMPLETE,
            route,
            meta={"doc_type": doc.doc_type, "filename": doc.filename},
        )
        return doc, follow_up
