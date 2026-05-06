# Terminus-Lite: Distributed SLM Sub-Agent Router

**Terminus-Lite** is a production-grade, distributed execution offloading system. Built with Google-scale engineering fundamentals, it demonstrates how to leverage Small Language Models (SLMs) in a resilient, scalable, and observable backend architecture.

## 🏗 System Architecture

Terminus-Lite is decoupled into specialized microservices to ensure independent scalability and fault tolerance:

- **Orchestrator API**: FastAPI-based gateway that manages task lifecycle and state using Redis.
- **Worker Cluster**: Asynchronous execution nodes that handle terminal operations and agent logic.
- **SLM Inference Service**: High-throughput log summarization service with built-in retries and fallbacks.
- **Message Queue (Redis)**: Decouples request ingestion from task execution, enabling horizontal scaling of workers.

### Architecture Diagram
```text
[User] -> [Orchestrator API] -> [Redis Queue] -> [Worker Cluster]
                                                      |
                                          [SLM Inference Service]
                                                      |
                                              [Ollama Engine]
```

## 🚀 Deployment

### Local Development (Docker)
The entire stack can be launched with:
```powershell
docker compose up --build
```
*(Note: Use `docker compose` without the hyphen on modern Docker Desktop).*

### Local Development (No Docker)
If you prefer to run natively, use the automated launch script:
```powershell
.\start_distributed.ps1
```
*(Requires Redis to be running locally on port 6379).*

### Manual Service Start
If running without Docker, ensure Redis is active:
1. `python services/orchestrator/main.py` (Port 8001)
2. `python services/slm/main.py` (Port 8002)
3. `python services/worker/main.py`

## 📊 Observability & Metrics

Terminus-Lite implements structured JSON logging for all services and tracks critical KPIs:
- **Token Efficiency**: Measures context saved by SLM offloading.
- **Latency (p95)**: End-to-end task execution time.
- **Reliability**: Exponential backoff on SLM failures with primary-model fallback.

### Running Benchmarks
Evaluate system performance and scalability:
```powershell
python scripts/benchmark.py
```

## 🛠 Engineering Fundamentals
- **Distributed State**: Tasks are persisted in Redis, allowing workers to be stateless and replaceable.
- **Resiliency**: Circuit breakers and fallbacks ensure the system remains operational even if the SLM service degrades.
- **Schema Safety**: Shared Pydantic models ensure consistency across the distributed boundary.
- **Scalability**: Designed to handle 100+ concurrent jobs by scaling the Worker Cluster.
