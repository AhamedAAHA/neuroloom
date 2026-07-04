import asyncio
from collections import defaultdict

_queues: dict[str, list[asyncio.Queue[str]]] = defaultdict(list)


def subscribe(channel: str) -> asyncio.Queue[str]:
    q: asyncio.Queue[str] = asyncio.Queue()
    _queues[channel].append(q)
    return q


def unsubscribe(channel: str, q: asyncio.Queue[str]) -> None:
    if channel in _queues and q in _queues[channel]:
        _queues[channel].remove(q)


async def publish(channel: str, data: str) -> None:
    for q in list(_queues.get(channel, [])):
        await q.put(data)
