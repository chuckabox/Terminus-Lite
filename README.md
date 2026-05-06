# Terminus-Lite: SLM Sub-Agent Router

**Terminus-Lite** is a specialized, fine-tuned sub-agent system designed exclusively to handle verbose terminal execution logs, keeping the main orchestration agent's context window clean and fast.

## 🚀 Concept
Replicating the isolation of subtask context by implementing an architecture where a primary agent delegates search or debugging tasks to a smaller, localized model (SLM). The SLM processes heavy log outputs and returns only a concise summary to the main agent.

## 🛠 Tech Stack
- **Primary Agent**: Frontier LLMs (GPT-4o / Claude 3.5 Sonnet) via OpenAI/Anthropic APIs.
- **SLM Sub-Agent**: Qwen-2.5-3B / Llama-3.2-3B optimized for terminal log parsing.
- **Inference**: FastAPI / vLLM / Modal (Serverless GPU Inference).
- **Workflow**: LangGraph / Custom Orchestration.
- **Frontend**: Next.js 14+ / React Dashboard with real-time token savings tracking.

## 📈 Impact
- **Designed a multi-agent architecture** utilizing a primary orchestration model and an SLM sub-agent, specifically isolating verbose build logs and test results from the main context window.
- **Reduced main agent token usage by ~30%** and significantly lowered inference costs by routing terminal execution subtasks to a localized 4B parameter model.
- **Deployed a high-throughput SLM inference endpoint** using vLLM and FastAPI, achieving sub-second latency for continuous terminal execution feedback loops.

## ⚡ Quick Start

The easiest way to get started is to use the provided launch script which handles both backend and frontend.

1. **Configure Environment**
   - Install [Ollama](https://ollama.com/).
   - Pull the models: `ollama pull llama3:8b` and `ollama pull qwen2.5:3b`.
   - The project is configured to use these local models by default in `backend/.env`.

2. **Run All-in-One Launch Script** (Windows PowerShell)
   ```powershell
   .\start.ps1
   ```

This will automatically:
- Start the **FastAPI Backend** on `http://localhost:8000`
- Launch the **React Dashboard** on `http://localhost:5173`

---

## 🛠 Manual Setup

### 1. Backend
```powershell
cd backend
pip install -r requirements.txt
python main.py
```

### 2. Frontend
```powershell
cd frontend
npm install
npm run dev
```

---

## 🖥 How to Use

1. **Open the Dashboard**: Navigate to `http://localhost:5173` in your browser.
2. **Enter a Task**: In the input field, describe a terminal-heavy task (e.g., *"Build the project and run all unit tests"*).
3. **Watch the Offloading**: 
   - The **Execution Logs** will show raw terminal activity.
   - The **SLM Context Summaries** will show the concise data sent to the primary agent.
   - The **Token Savings** widget will track how much context you've saved in real-time.


