# Terminus-Lite

Terminus-Lite is a distributed sub-agent router that prevents context-window bloat in AI workflows. It offloads verbose terminal logs to localized Small Language Models (SLMs), passing only concise signals back to the primary orchestrator.

## Core Concept: Log Distillation

AI agents often lose context when overwhelmed by thousands of lines of terminal output. Terminus-Lite solves this using a split-brain architecture:

1. **Primary Agent (Llama 3)**: Manages high-level reasoning and task logic.
2. **SLM Service (Qwen 2.5)**: Distills raw logs into 1-2 sentence summaries.
3. **Worker**: Executes system commands and manages the local agent loop.

By distilling logs, the Primary Agent maintains a clean context window, reducing token usage by up to 90%.

## Getting Started

The entire stack is self-contained via Docker.

```bash
docker compose up -d
```

### Usage
1. Open the dashboard at [http://localhost:5173](http://localhost:5173).
2. Input a terminal-heavy task (e.g., "Find all python files in the project").
3. Monitor the distillation process as raw output is converted into structured summaries.

## Architecture

- **Orchestrator**: FastAPI gateway managing the task lifecycle and Redis state.
- **Worker Cluster**: Stateless nodes processing agent logic and execution.
- **SLM Service**: Dedicated inference endpoint for log summarization.
- **Redis Queue**: Backbone for task routing and horizontal scaling.
- **Ollama**: Local inference engine for internal model orchestration.

## Benchmarking

Measure throughput and token efficiency:

```bash
python scripts/benchmark.py
```

## Security

This system executes commands directly within the container environment. Use caution when running tasks that modify the filesystem.
