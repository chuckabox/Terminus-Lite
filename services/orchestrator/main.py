from fastapi import FastAPI, HTTPException, BackgroundTasks
from shared.models.task import Task, TaskRequest, TaskResponse, TaskStatus
from shared.utils.logging import setup_logger
import redis
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Terminus-Lite Orchestrator")
logger = setup_logger("orchestrator")

# Redis Connection
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

@app.post("/task/run", response_model=TaskResponse)
async def run_task(request: TaskRequest):
    task = Task(request=request.task)
    
    # Store task state
    redis_client.set(f"task:{task.id}", task.json())
    
    # Push to queue
    redis_client.lpush("task_queue", task.id)
    
    logger.info(f"Task created and queued", extra={"service": "orchestrator", "request_id": task.id})
    
    return TaskResponse(task_id=task.id, status=task.status)

@app.get("/task/{task_id}", response_model=Task)
async def get_task(task_id: str):
    task_data = redis_client.get(f"task:{task_id}")
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return Task.parse_raw(task_data)

@app.get("/metrics")
async def get_metrics():
    # Basic metrics from Redis
    queue_length = redis_client.llen("task_queue")
    # In a real system, we'd pull p95 etc from Prometheus
    return {
        "queue_length": queue_length,
        "active_workers": 1, # Placeholder
        "service_status": "healthy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
