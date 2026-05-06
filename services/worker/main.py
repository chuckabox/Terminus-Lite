import asyncio
import redis
import json
import os
import httpx
from shared.models.task import Task, TaskStatus, ExecutionStep
from shared.utils.logging import setup_logger
from backend.executor.terminal import TerminalExecutor
from backend.agents.primary import PrimaryAgent
from dotenv import load_dotenv
import time

load_dotenv()

logger = setup_logger("worker")
executor = TerminalExecutor()
primary_agent = PrimaryAgent()

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

SLM_SERVICE_URL = os.getenv("SLM_SERVICE_URL", "http://localhost:8002")

async def process_task(task_id: str):
    task_data = redis_client.get(f"task:{task_id}")
    if not task_data:
        return
    
    task = Task.parse_raw(task_data)
    task.status = TaskStatus.RUNNING
    redis_client.set(f"task:{task.id}", task.json())
    
    start_time = time.perf_counter()
    history = []
    current_summary = "No previous execution."
    
    try:
        for i in range(3): # Max steps
            # 1. Primary Agent decision
            decision = await primary_agent.decide_next_step(task.request, history, current_summary)
            
            if "TASK_COMPLETE" in decision:
                task.final_result = decision
                break
            
            command = decision.split("RUN:")[1].strip().split("\n")[0] if "RUN:" in decision else decision
            
            # 2. Execution
            result = await executor.execute(command)
            
            # 3. SLM Summarization with Retries and Fallback
            summary = await summarize_with_retry(result["stdout"], result["stderr"])
            
            # Update task
            raw_size = len(result["stdout"]) + len(result["stderr"])
            summary_size = len(summary)
            savings = max(0, raw_size - summary_size)
            
            step = ExecutionStep(
                command=command,
                summary=summary,
                raw_log_size=raw_size,
                summary_size=summary_size,
                tokens_saved=savings
            )
            task.steps.append(step)
            task.total_tokens_saved += savings
            
            history.append(f"Command: {command} -> Summary: {summary}")
            current_summary = summary
            
            # Save progress
            redis_client.set(f"task:{task.id}", task.json())

        task.status = TaskStatus.COMPLETED
        duration = time.perf_counter() - start_time
        logger.info(f"Task {task_id} completed in {duration:.2f}s", extra={"service": "worker", "request_id": task_id, "duration": duration})
    except Exception as e:
        logger.error(f"Task failed: {str(e)}", extra={"service": "worker", "request_id": task_id})
        task.status = TaskStatus.FAILED
        task.error = str(e)
    
    redis_client.set(f"task:{task.id}", task.json())

async def summarize_with_retry(stdout: str, stderr: str, retries: int = 3):
    """Summarizes logs using the SLM service with exponential backoff and fallback."""
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{SLM_SERVICE_URL}/summarize",
                    json={"stdout": stdout, "stderr": stderr}
                )
                if response.status_code == 200:
                    return response.json()["summary"]
        except Exception as e:
            wait_time = 2 ** attempt
            logger.warning(f"SLM failure (attempt {attempt+1}): {str(e)}. Retrying in {wait_time}s...")
            await asyncio.sleep(wait_time)
            
    # Fallback to simple truncation if SLM is down
    logger.error("SLM service unavailable. Falling back to truncation.")
    return (stdout + stderr)[:500] + "... [TRUNCATED]"

async def worker_loop():
    logger.info("Worker started, waiting for tasks...", extra={"service": "worker"})
    while True:
        task_id = redis_client.brpop("task_queue", timeout=1)
        if task_id:
            logger.info(f"Picked up task {task_id[1]}", extra={"service": "worker", "request_id": task_id[1]})
            await process_task(task_id[1])
        await asyncio.sleep(0.1)

if __name__ == "__main__":
    asyncio.run(worker_loop())
