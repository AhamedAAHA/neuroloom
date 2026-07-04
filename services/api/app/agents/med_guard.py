from app.agents.base import AgentContext
from app.agents.utils import parse_json_array
from app.models import AgentStatus, Medication
from app.services.llm import llm_client


class MedGuardAgent:
    def __init__(self, ctx: AgentContext):
        self.ctx = ctx

    async def process(self, text: str, source: str = "text") -> list[Medication]:
        await self.ctx.log_agent(
            "MedGuard",
            "Analyzing medication information...",
            AgentStatus.RUNNING,
            "gemma-multimodal-amd",
        )

        prompt = f"""Extract medications from this text. Return ONLY a JSON array with objects having keys: name, dose, schedule, instructions.
Text:
{text}"""

        response, route = await llm_client.complete(
            prompt,
            system="You extract structured medication data for family caregivers. Return valid JSON only.",
            route="gemma-multimodal-amd",
        )

        meds_data = parse_json_array(response)
        created: list[Medication] = []
        for m in meds_data:
            med = Medication(
                circle_id=self.ctx.circle_id,
                name=m.get("name", "Unknown"),
                dose=m.get("dose", ""),
                schedule=m.get("schedule", ""),
                instructions=m.get("instructions"),
                source=source,
                confirmed=False,
            )
            self.ctx.db.add(med)
            created.append(med)
            await self.ctx.add_graph_node(
                "medication",
                med.name,
                {"dose": med.dose, "schedule": med.schedule, "source": source},
            )

        await self.ctx.log_agent(
            "MedGuard",
            f"Extracted {len(created)} medication(s). Please confirm before saving.",
            AgentStatus.COMPLETE,
            route,
            meta={"count": len(created), "source": source},
        )
        return created
