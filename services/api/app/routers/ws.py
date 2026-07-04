import asyncio
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings
from app.services import memory_bus
from app.services.pubsub import get_redis

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/agents/{circle_id}")
async def agent_websocket(websocket: WebSocket, circle_id: uuid.UUID):
    await websocket.accept()
    channel = f"neuroloom:agents:{circle_id}"

    if settings.redis_url.startswith("memory://") or settings.redis_url == "":
        queue = memory_bus.subscribe(channel)

        async def memory_listener():
            while True:
                data = await queue.get()
                await websocket.send_text(data)

        task = asyncio.create_task(memory_listener())
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            task.cancel()
            memory_bus.unsubscribe(channel, queue)
        return

    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)

    async def listener():
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message["type"] == "message":
                await websocket.send_text(message["data"])
            await asyncio.sleep(0.05)

    task = asyncio.create_task(listener())
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        task.cancel()
        await pubsub.unsubscribe(channel)
        await pubsub.close()
