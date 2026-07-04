from app.agents.base import AgentContext
from app.models import AgentStatus, CheckIn, FamilyTask


class CheckInCompanionAgent:
    def __init__(self, ctx: AgentContext):
        self.ctx = ctx

    async def record(self, checkin: CheckIn) -> None:
        await self.ctx.log_agent(
            "CheckInCompanion",
            f"Check-in recorded — mood {checkin.mood}/5",
            AgentStatus.RUNNING,
        )
        await self.ctx.add_graph_node(
            "checkin",
            f"Mood {checkin.mood}/5",
            {"notes": checkin.notes, "mood": checkin.mood},
        )
        await self.ctx.log_agent(
            "CheckInCompanion",
            "Check-in saved to care graph.",
            AgentStatus.COMPLETE,
            meta={"mood": checkin.mood},
        )


class FamilySyncAgent:
    def __init__(self, ctx: AgentContext):
        self.ctx = ctx

    async def assign_task(self, task: FamilyTask) -> None:
        await self.ctx.log_agent(
            "FamilySync",
            f"Task assigned: {task.title}",
            AgentStatus.COMPLETE,
            meta={"assigned_to": task.assigned_to, "title": task.title},
        )
        await self.ctx.add_graph_node(
            "task",
            task.title,
            {"assigned_to": task.assigned_to, "completed": task.completed},
        )
