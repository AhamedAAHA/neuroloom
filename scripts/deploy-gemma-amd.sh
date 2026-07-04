#!/usr/bin/env bash
# Deploy Gemma inference with vLLM on AMD Developer Cloud (ROCm)
# Usage: bash scripts/deploy-gemma-amd.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODEL="${MODEL_NAME:-google/gemma-3-4b-it}"
VLLM_PORT="${VLLM_PORT:-8001}"
PROXY_PORT="${PROXY_PORT:-8080}"

echo "=== Neuroloom Gemma on AMD ==="
echo "Model: $MODEL"
echo "vLLM port: $VLLM_PORT | Proxy port: $PROXY_PORT"
echo ""

if ! command -v vllm >/dev/null 2>&1; then
  echo "Install vLLM with ROCm support first:"
  echo "  pip install vllm"
  echo "See: https://rocm.docs.amd.com/projects/install-on-linux/en/latest/"
  exit 1
fi

export ROCM_VISIBLE_DEVICES="${ROCM_VISIBLE_DEVICES:-0}"
export INFERENCE_BACKEND=vllm
export VLLM_BASE_URL="http://127.0.0.1:${VLLM_PORT}/v1"
export MODEL_NAME="$MODEL"

echo "Starting vLLM..."
vllm serve "$MODEL" --host 0.0.0.0 --port "$VLLM_PORT" &
VLLM_PID=$!
sleep 15

if [ ! -d "$ROOT/.venv-gemma" ]; then
  python3 -m venv "$ROOT/.venv-gemma"
fi
source "$ROOT/.venv-gemma/bin/activate"
pip install -q -r "$ROOT/services/gemma-inference/requirements.txt"

echo "Starting Neuroloom inference proxy on :$PROXY_PORT..."
cd "$ROOT/services/gemma-inference"
uvicorn main:app --host 0.0.0.0 --port "$PROXY_PORT"

trap "kill $VLLM_PID 2>/dev/null" EXIT
