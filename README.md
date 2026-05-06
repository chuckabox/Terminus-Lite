# Terminus-Lite

Terminus-Lite is a distributed sub-agent router designed to solve **context-window bloat**. It sits between your AI "Brain" and the terminal, ensuring the AI only sees meaningful results instead of thousands of lines of raw logs.

## Live Demo

**[View the Live Demo on GitHub Pages](https://chuckabox.github.io/Terminus-Lite/)**

### Static Demo vs. Local Installation

Because GitHub Pages hosts only static files, the live website runs in **Simulation Mode**. Here is how it differs from the full local version:

| Feature | **Live Website (Demo)** | **Local Setup (Full)** |
| :--- | :--- | :--- |
| **AI Inference** | Simulated (Pre-scripted) | **Real** (Llama 3 & Qwen 2.5 via Ollama) |
| **Command Execution** | None (Mocked) | **Real** (Executes in Docker Worker) |
| **Data Source** | `mock_target/` folder | **Your actual filesystem** (via Volume Mount) |
| **Backend** | Browser-only | **Full Stack** (FastAPI, Redis, Docker) |
| **Purpose** | Visual UI/UX demonstration | Production-grade log distillation |

## Why use this?

Standard AI agents often "choke" on large terminal outputs. If an agent runs `npm install` or `grep`, it might receive 5,000 lines of text.

- **Without Terminus**: Those 5,000 lines go directly into the AI's memory. The AI becomes slow, expensive, and forgets your original goal.
- **With Terminus**: A localized Small Language Model (SLM) "reads" those 5,000 lines and tells the Brain: *"Successfully installed 42 packages."* 

**The result:** Your primary agent stays focused and can solve much longer, more complex tasks.

## How it Works: Split-Brain Architecture

Terminus-Lite divides the workload across three specialized components:

1.  **The Brain (Primary Agent - Llama 3)**: Handles high-level logic and decisions.
2.  **The Filter (SLM Service - Qwen 2.5)**: Distills raw logs into 1-2 sentence summaries.
3.  **The Hands (Worker)**: Executes system commands inside a secure Docker environment.

## Tech Stack

- **AI Orchestration**: [LangChain](https://www.langchain.com/) & [Ollama](https://ollama.com/)
- **Core Models**: Llama 3 (8B) & Qwen 2.5 (3B)
- **Backend**: Python 3.12, [FastAPI](https://fastapi.tiangolo.com/)
- **State & Queue**: [Redis](https://redis.io/)
- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **Infrastructure**: Docker & Docker Compose

## Getting Started (Local Setup)

### 1. Launch the Stack
The stack includes a local **Ollama** instance, so all AI processing happens on your own hardware.
```bash
docker-compose up --build -d
```

### 2. Run a Task
Open [http://localhost:5173](http://localhost:5173) and enter a task that would usually generate a lot of "noise," such as:
*   `List every file in the project recursively.`
*   `Search for the word 'python' in every file.`

### 3. Observe Distillation
The dashboard will show you the "Token Savings." You'll see the raw output size (e.g., 15KB) vs. what was actually sent to the Brain (e.g., 100 bytes).

## Infrastructure & Security

- **Local Inference**: Powered by Ollama. No API keys or external costs required.
- **Isolation**: Commands run inside the Docker worker, protecting your host system.
- **Persistence**: Task state and summaries are stored in Redis for real-time monitoring.

## Performance Benchmarking

To measure how much context you're saving on your specific machine:
```bash
python scripts/benchmark.py
```

<!-- Documentation Refinement -->