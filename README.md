# Terminus-Lite: The Context-Saving Agent Router

**Terminus-Lite** is a distributed sub-agent system designed to prevent "context-window bloat" in AI agent workflows. It allows high-level agents to execute complex terminal tasks without ever seeing a single line of raw log output.

---

## 🚀 The Problem: "Log Bloat"
When an AI agent runs a command like `npm install` or `grep -r "error" .`, the terminal might return thousands of lines of output. 
- **The Cost:** These logs consume the agent's limited context window (RAM).
- **The Result:** The agent "forgets" the original goal or becomes expensive and slow.

## ✨ The Solution: Log Distillation
Terminus-Lite uses a **Split-Brain Architecture**:
1. **The Primary Agent (Llama 3)**: The "Manager." It decides what to do (e.g., "Fix the bug in main.py").
2. **The SLM Service (Qwen 2.5)**: The "Filter." It reads the raw terminal logs and summarizes them into 1-2 sentences (e.g., "The test failed on line 42 due to a NullPointer").
3. **The Worker**: The "Hands." It executes the actual commands on the system.

**The Result:** The Primary Agent only sees high-level signals, allowing it to solve massive tasks using 90% fewer tokens.

---

## 🛠️ Getting Started

### 1. Launch the Stack
The entire environment is self-contained via Docker.
```powershell
docker compose up --build -d
```

### 2. Access the Dashboard
Open your browser to:
👉 **[http://localhost:5173](http://localhost:5173)**

### 3. Running Your First Task
From the dashboard, send a task like:
- `Find all python files in the current directory.`
- `Tell me what version of python is installed.`
- `Check the contents of the backend folder.`

---

## 🏗️ Architecture
- **Orchestrator (FastAPI)**: Manages the API and task queue.
- **Worker Cluster**: Executes terminal commands and manages the agent loop.
- **SLM Service**: Dedicated inference endpoint for log summarization.
- **Redis**: Handles state management and task routing.
- **Ollama (Internal)**: Hosts the local AI models (`llama3:8b` for logic, `qwen2.5:3b` for summaries).

---

## 📈 Performance Benchmarking
Measure how many tokens you're saving:
```powershell
python scripts/benchmark.py
```
This script runs a series of complex tasks and calculates the "Distillation Ratio" (Raw Logs vs. Summarized Context).

---

## 🔒 Security Note
This application executes commands directly on the host (within the Docker environment). Use caution when giving it tasks that could delete or modify important files.
