from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import auth, circles, emergency, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    from app.database import engine
    await engine.dispose()


app = FastAPI(
    title="Neuroloom API",
    description="Multi-agent family care coordination platform",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(circles.router)
app.include_router(emergency.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "neuroloom-api"}


@app.get("/health/gemma")
async def gemma_health():
    url = settings.gemma_inference_url.rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{url}/health")
            resp.raise_for_status()
            data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            return {
                "status": "online",
                "route": "gemma-amd",
                "endpoint": url,
                "details": data,
            }
    except Exception as e:
        return {
            "status": "offline",
            "route": "gemma-amd",
            "endpoint": url,
            "fallback": "fireworks-gemma" if settings.fireworks_api_key else "local-fallback",
            "error": str(e),
        }


@app.get("/")
async def root():
    return {
        "name": "Neuroloom",
        "tagline": "Family care command center",
        "docs": "/docs",
    }
