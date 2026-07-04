# Neuroloom

**Family Care Command Center** — Multi-agent AI platform for family caregivers.

Coordinate medications, handoffs, documents, check-ins, and emergencies with **nine specialized agents** powered by **Gemma on AMD GPUs**.

Built for **AMD Developer Hackathon: ACT II** — Track 3 (Unicorn) + Best AMD-Hosted Gemma Project.

---

## Problem

53M+ unpaid family caregivers coordinate aging parent care across WhatsApp, sticky notes, and scattered PDFs. Neuroloom gives them one live command center.

## Features

- **9 AI Agents**: Conductor, MedGuard, Schedule Keeper, Handoff, Document Vault, Check-in Companion, Emergency Pack, Family Sync, Trend Analyst
- **4 Care Modes**: Post-Hospital, Dementia, Chronic Care, Long-Distance
- **Care Knowledge Graph**: Live visualization of meds, events, documents, handoffs
- **Live Agent Feed**: WebSocket stream of agent activity
- **Senior View**: Large-text, accessible interface for care recipients
- **Emergency Pack**: One-tap shareable care packet with PIN protection
- **Gemma on AMD**: Sensitive data processed on AMD Developer Cloud (ROCm + vLLM)

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Next.js    │────▶│  FastAPI     │────▶│ Gemma Inference     │
│  Frontend   │ WS  │  + LangGraph │     │ (AMD ROCm / vLLM)   │
└─────────────┘     └──────┬───────┘     └─────────────────────┘
                           │
                    ┌──────┴───────┐
                    │ Postgres     │
                    │ Redis        │
                    │ MinIO        │
                    └──────────────┘
```

## Quick Start

### Option A — No Docker (recommended for local laptop)

**Prerequisites:** Node.js 18+, Python 3.12+, `python3-pip`

```bash
git clone https://github.com/AhamedAAHA/neuroloom.git
cd neuroloom
cp .env.example .env

# One command starts everything (Gemma + API + Frontend)
bash scripts/run-local.sh
```

- **App**: http://localhost:3000
- **API docs**: http://localhost:8000/docs
- **Gemma**: http://localhost:8080/health

Uses **SQLite** + in-memory pub/sub — no Postgres, Redis, or Docker required.

### Option B — Docker (full production stack)

**Prerequisites:** Docker & Docker Compose

```bash
git clone https://github.com/AhamedAAHA/neuroloom.git
cd neuroloom
cp .env.example .env

docker compose up --build
```

Install Docker on Ubuntu:
```bash
sudo apt install docker.io docker-compose-v2
sudo usermod -aG docker $USER   # log out and back in
```

### Manual start (3 terminals)

**Terminal 1 — Gemma:**
```bash
cd services/gemma-inference
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8080
```

**Terminal 2 — API:**
```bash
cd services/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=sqlite+aiosqlite:///$(pwd)/../../data/neuroloom.db
export REDIS_URL=memory://
export GEMMA_INFERENCE_URL=http://localhost:8080
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 — Frontend:**
```bash
cd services/web    # ← package.json is HERE, not in repo root
npm install
npm run dev
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Command 'docker' not found` | Use `bash scripts/run-local.sh` instead, or install Docker (see above) |
| `Could not read package.json` at repo root | Run `npm install` inside `services/web/`, not the root folder |
| `pip` can't find fastapi / `Name or service not known` | VPN DNS blocking pypi.org — run: `echo "151.101.128.223 pypi.org" \| sudo tee -a /etc/hosts` then retry |
| `fatal: destination path 'neuroloom' already exists` | You already cloned — just `cd neuroloom` (don't clone again) |
| `cd: command not found` with `^[[200~` | Paste issue — type `cd neuroloom` manually |

## AMD-Hosted Gemma

See [services/gemma-inference/AMD_DEPLOYMENT.md](services/gemma-inference/AMD_DEPLOYMENT.md) for production deployment on AMD Developer Cloud with ROCm and vLLM.

Model routing:
| Agent | Route |
|-------|-------|
| MedGuard | gemma-multimodal-amd |
| Document Vault | gemma-multimodal-amd |
| Handoff | gemma-amd → fireworks overflow |
| Emergency Pack | gemma-amd |
| Schedule Keeper | gemma-amd (4B fast) |
| Trend Analyst | gemma-amd |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/circles` | Create care circle |
| POST | `/api/circles/{id}/medications/extract` | MedGuard extraction |
| POST | `/api/circles/{id}/documents` | Upload & index document |
| POST | `/api/circles/{id}/handoffs` | Generate handoff briefing |
| POST | `/api/circles/{id}/check-ins` | Daily wellness check-in |
| POST | `/api/circles/{id}/emergency-pack` | Generate emergency packet |
| WS | `/ws/agents/{id}` | Live agent activity stream |
| GET | `/api/circles/{id}/graph` | Knowledge graph data |

## Disclaimer

Neuroloom is a **care coordination tool**. It does not provide medical advice, diagnosis, or treatment. Always consult healthcare professionals for medical decisions.

## License

MIT

## Author

AhamedAAHA — AMD Developer Hackathon ACT II
