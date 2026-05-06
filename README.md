# Terminus-Lite

Terminus-Lite is a distributed sub-agent router designed to solve context-window bloat in agentic workflows. It offloads verbose terminal logs to localized Small Language Models (SLMs), passing only concise signals back to the primary orchestrator.

## Quick Start

The stack runs on Docker or natively via PowerShell.

**Option 1: Docker (Recommended)**
```bash
docker compose up --build
```

**Option 2: Native PowerShell**
Requires a local Redis instance on port 6379.
```powershell
.\start_distributed.ps1
```

Access the dashboard at `http://localhost:5173`.

## Architecture

Terminus-Lite uses a distributed worker model to isolate high-latency execution and inference tasks from the API gateway.

- **Orchestrator**: A FastAPI gateway managing task lifecycles and Redis state.
- **Worker Cluster**: Stateless nodes processing agent logic and terminal execution.
- **SLM Service**: A dedicated inference endpoint for log summarization (Ollama/Qwen).
- **Redis Queue**: The backbone for task routing and horizontal worker scaling.

## Reliability & Resiliency

The system is built for production durability:
- **Resilient Inference**: SLM failures trigger exponential backoff before falling back to smart truncation.
- **Stateless Workers**: All task state is persisted in Redis; workers can be horizontally scaled or replaced without data loss.
- **Context Isolation**: By distilling massive terminal outputs into structured summaries, the primary agent maintains a clean, high-performance context window.

## Performance & Benchmarking

Measure throughput and token efficiency locally:
```powershell
python scripts/benchmark.py
```
The suite provides end-to-end latency metrics, throughput analysis, and estimated cost savings achieved through SLM offloading.
