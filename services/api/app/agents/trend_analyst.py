from typing import Any

from sqlalchemy import select

from app.agents.base import AgentContext
from app.models import AgentStatus, CheckIn


class TrendAnalystAgent:
    def __init__(self, ctx: AgentContext):
        self.ctx = ctx

    async def analyze(self) -> dict[str, Any]:
        await self.ctx.log_agent("TrendAnalyst", "Analyzing care patterns...", AgentStatus.RUNNING)

        checkins = (
            await self.ctx.db.execute(
                select(CheckIn)
                .where(CheckIn.circle_id == self.ctx.circle_id)
                .order_by(CheckIn.created_at.desc())
                .limit(14)
            )
        ).scalars().all()

        if len(checkins) < 2:
            await self.ctx.log_agent(
                "TrendAnalyst",
                "Not enough data yet for trend analysis.",
                AgentStatus.COMPLETE,
            )
            return {"alerts": [], "summary": "Need more check-ins"}

        moods = [c.mood for c in checkins]
        low_mood_streak = sum(1 for m in moods[:3] if m <= 2)
        alerts: list[str] = []
        if low_mood_streak >= 3:
            alerts.append("3 consecutive low-mood check-ins detected — consider reaching out")
        if sum(moods) / len(moods) < 2.5:
            alerts.append("Average mood below baseline this week")

        summary = f"Analyzed {len(checkins)} check-ins. Average mood: {sum(moods) / len(moods):.1f}/5."
        await self.ctx.log_agent(
            "TrendAnalyst",
            summary,
            AgentStatus.COMPLETE,
            meta={"alerts": alerts, "sample_size": len(checkins)},
        )
        return {"alerts": alerts, "summary": summary}
