import json

from app.config import settings
from app.services import memory_bus

_redis = None


def _use_memory() -> bool:
    return settings.redis_url.startswith("memory://") or settings.redis_url == ""


async def get_redis():
    if _use_memory():
        return None
    global _redis
    if _redis is None:
        import redis.asyncio as aioredis
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def publish_agent_event(circle_id: str, event: dict):
    channel = f"neuroloom:agents:{circle_id}"
    payload = json.dumps(event)
    if _use_memory():
        await memory_bus.publish(channel, payload)
        return
    redis = await get_redis()
    await redis.publish(channel, payload)
