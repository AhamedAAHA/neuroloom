FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

# Production AMD deployment:
# FROM rocm/vllm-dev or custom ROCm image
# RUN pip install vllm
# CMD python -m vllm.entrypoints.openai.api_server --model google/gemma-3-4b-it --host 0.0.0.0 --port 8080
