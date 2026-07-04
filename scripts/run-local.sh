#!/usr/bin/env bash
# Neuroloom local dev — single canonical repo at /media/aaha/AAHA1/Project/Neuroloom
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Neuroloom local setup ($ROOT) ==="

if [ -d "$ROOT/../New/neuroloom" ]; then
  echo "WARNING: Duplicate repo detected at New/neuroloom — use this Neuroloom folder only."
fi

# Fix VPN DNS blocking pypi.org
if ! getent hosts pypi.org >/dev/null 2>&1; then
  echo "Fixing pypi.org DNS (VPN may block it)..."
  if ! grep -q 'pypi.org' /etc/hosts 2>/dev/null; then
    echo "151.101.128.223 pypi.org" | sudo tee -a /etc/hosts >/dev/null
  fi
fi

mkdir -p "$ROOT/data"

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

if [ ! -d "$ROOT/services/web/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$ROOT/services/web" && npm install)
fi

if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
fi

# Load .env for all services
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a

export GEMMA_INFERENCE_URL="${GEMMA_INFERENCE_URL:-http://localhost:8080}"
export DATABASE_URL="${DATABASE_URL:-sqlite+aiosqlite:///$ROOT/data/neuroloom.db}"
export REDIS_URL="${REDIS_URL:-memory://}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3000}"
export WEB_APP_URL="${WEB_APP_URL:-http://localhost:3000}"

# Normalize relative sqlite path to absolute
if [[ "$DATABASE_URL" == sqlite+aiosqlite:///./data/* ]]; then
  export DATABASE_URL="sqlite+aiosqlite:///$ROOT/data/neuroloom.db"
fi

echo ""
echo "=== Starting services (Ctrl+C to stop all) ==="
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:8000/docs"
echo "  Gemma:     ${GEMMA_INFERENCE_URL}/health"
echo "  Backend:   ${INFERENCE_BACKEND:-stub}"
echo ""

cleanup() {
  echo ""
  echo "Stopping..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

source "$ROOT/.venv-gemma/bin/activate"
(cd "$ROOT/services/gemma-inference" && uvicorn main:app --host 0.0.0.0 --port 8080) &
deactivate

source "$ROOT/.venv-api/bin/activate"
(cd "$ROOT/services/api" && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
deactivate

(cd "$ROOT/services/web" && npm run dev) &

wait
