# Deploying Gemma on AMD Developer Cloud (ROCm)

## Overview

Neuroloom routes sensitive care data (medications, documents, check-ins) to
**Gemma models hosted on AMD GPUs** before falling back to Fireworks AI.

## Production Setup

```bash
# On AMD Developer Cloud instance with ROCm
export ROCM_VISIBLE_DEVICES=0

# Option A: vLLM with ROCm
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model google/gemma-3-4b-it \
  --host 0.0.0.0 \
  --port 8080

# Option B: Hugging Face TGI with ROCm
docker run --device=/dev/kfd --device=/dev/dri \
  -p 8080:80 \
  -e MODEL_ID=google/gemma-3-4b-it \
  ghcr.io/huggingface/text-generation-inference:rocm
```

## Fine-tuning (LoRA on AMD)

```bash
# Train care-domain adapter on AMD GPU
pip install peft transformers torch --index-url https://download.pytorch.org/whl/rocm6.2
python scripts/finetune_gemma.py --dataset data/care_transcripts.jsonl
```

## Environment

Set in `.env`:
```
GEMMA_INFERENCE_URL=http://your-amd-instance:8080
ROCM_VISIBLE_DEVICES=0
```

## Model Routing

| Agent | Model Route | Hardware |
|-------|-------------|----------|
| MedGuard | gemma-multimodal-amd | AMD GPU |
| DocumentVault | gemma-multimodal-amd | AMD GPU |
| Handoff | gemma-amd → fireworks overflow | AMD GPU |
| EmergencyPack | gemma-amd | AMD GPU |
| ScheduleKeeper | gemma-amd (4B fast) | AMD GPU |
| TrendAnalyst | gemma-amd | AMD GPU |

## Verify

```bash
curl http://localhost:8080/health
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"google/gemma-3-4b-it","messages":[{"role":"user","content":"hello"}]}'
```
