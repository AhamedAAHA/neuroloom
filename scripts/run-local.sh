#!/usr/bin/env bash
# Neuroloom local dev — no Docker required
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Neuroloom local setup ==="

# Fix VPN DNS blocking pypi.org (common with neko-tun / similar VPNs)
if ! getent hosts pypi.org >/dev/null 2>&1; then
  echo "Fixing pypi.org DNS (VPN may block it)..."
  if ! grep -q 'pypi.org' /etc/hosts 2>/dev/null; then
    echo "151.101.128.223 pypi.org" | sudo tee -a /etc/hosts >/dev/null
  fi
fi

mkdir -p "$ROOT/data"

# Python venvs
if [ ! -d "$ROOT/.venv-api" ]; then
  python3 -m venv "$ROOT/.venv-api"
fi
if [ ! -d "$ROOT/.venv-gemma" ]; then
  python3 -m venv "$ROOT/.venv-gemma"
fi

source "$ROOT/.venv-api/bin/activate"
pip install -q -r services/api/requirements.txt
deactivate

source "$ROOT/.venv-gemma/bin/activate"
pip install -q -r services/gemma-inference/requirements.txt
deactivate

# Frontend deps
if [ ! -d "$ROOT/services/web/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$ROOT/services/web" && npm install)
fi

# Env file
if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
fi

echo ""
echo "=== Starting services (Ctrl+C to stop all) ==="
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:8000/docs"
echo "  Gemma:     http://localhost:8080/health"
echo ""

cleanup() {
  echo ""
  echo "Stopping..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

# Gemma inference stub
source "$ROOT/.venv-gemma/bin/activate"
(cd "$ROOT/services/gemma-inference" && uvicorn main:app --host 0.0.0.0 --port 8080) &
deactivate

# API
source "$ROOT/.venv-api/bin/activate"
export GEMMA_INFERENCE_URL=http://localhost:8080
export DATABASE_URL="sqlite+aiosqlite:///$ROOT/data/neuroloom.db"
export REDIS_URL=memory://
export CORS_ORIGINS=http://localhost:3000
(cd "$ROOT/services/api" && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
deactivate

# Frontend
(cd "$ROOT/services/web" && npm run dev) &

wait
