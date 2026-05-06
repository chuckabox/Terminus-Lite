from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend.executor.terminal import TerminalExecutor
from backend.agents.slm import SLMSubAgent
from backend.agents.primary import PrimaryAgent
import uvicorn
import time

app = FastAPI(title="Terminus-Lite API")

executor = TerminalExecutor()
slm_agent = SLMSubAgent()
primary_agent = PrimaryAgent()

class TaskRequest(BaseModel):
    task: str

class ExecutionStep(BaseModel):
    command: str
    summary: str
    raw_log_size: int
    summary_size: int
    tokens_saved: int

class TaskResponse(BaseModel):
    task: str
    steps: List[ExecutionStep]
    final_result: str
    total_tokens_saved: int

@app.post("/execute", response_model=TaskResponse)
async def run_task(request: TaskRequest):
    history = []
    steps = []
    current_summary = "No previous execution."
    total_tokens_saved = 0
    
    # Simple loop for demonstration - in production this would be a proper state machine
    for i in range(3): # Max 3 steps for safety in this demo
        # 1. Primary Agent decides what to do
        decision = await primary_agent.decide_next_step(request.task, history, current_summary)
        
        if "TASK_COMPLETE" in decision:
            return TaskResponse(
                task=request.task,
                steps=steps,
                final_result=decision,
                total_tokens_saved=total_tokens_saved
            )
        
        # Extract command (assuming Primary Agent returns something like "RUN: npm install")
        # In a real app, we'd use Structured Output
        command = decision.split("RUN:")[1].strip().split("\n")[0] if "RUN:" in decision else decision
        
        # 2. Execute command
        result = await executor.execute(command)
        
        # 3. SLM summarizes
        summary = await slm_agent.summarize_logs(result)
        
        # Calculate savings (approximate characters as proxy for tokens in this demo)
        raw_size = len(result["stdout"]) + len(result["stderr"])
        summary_size = len(summary)
        savings = max(0, raw_size - summary_size)
        total_tokens_saved += savings
        
        step = ExecutionStep(
            command=command,
            summary=summary,
            raw_log_size=raw_size,
            summary_size=summary_size,
            tokens_saved=savings
        )
        steps.append(step)
        
        history.append(f"Command: {command} -> Summary: {summary}")
        current_summary = summary

    return TaskResponse(
        task=request.task,
        steps=steps,
        final_result="Task ended after maximum steps.",
        total_tokens_saved=total_tokens_saved
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
