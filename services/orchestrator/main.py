from fastapi import FastAPI, HTTPException, BackgroundTasks
from shared.models.task import Task, TaskRequest, TaskResponse, TaskStatus
from shared.utils.logging import setup_logger
from fastapi.middleware.cors import CORSMiddleware
import redis
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Terminus-Lite Orchestrator")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = setup_logger("orchestrator")

# Redis Connection
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

@app.post("/task/run", response_model=TaskResponse)
    """Creates a new task and enqueues it for processing."""
async def run_task(request: TaskRequest):
    if not request.task.strip():
        raise HTTPException(status_code=400, detail="Task description cannot be empty")
    if len(request.task) > 500:
        raise HTTPException(status_code=400, detail="Task description too long (max 500 chars)")
        
    task = Task(request=request.task)
    
    # Store task state
    redis_client.set(f"task:{task.id}", task.model_dump_json())
    
    # Enqueue task
    redis_client.lpush("task_queue", task.id)
    
    logger.info(f"Task created and queued", extra={"service": "orchestrator", "request_id": task.id})
    
    return TaskResponse(task_id=task.id, status=task.status)

@app.get("/health")
async def health_check():
    try:
        redis_client.ping()
        return {"status": "healthy", "redis": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "redis": str(e)}

@app.get("/task/{task_id}", response_model=Task)
async def get_task(task_id: str):
    task_data = redis_client.get(f"task:{task_id}")
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return Task.parse_raw(task_data)

@app.get("/metrics")
async def get_metrics():
    import psutil
    # Get 1-minute load average if on Linux/Mac, or CPU percent on Windows
    try:
        load_avg = os.getloadavg()[0] if hasattr(os, "getloadavg") else psutil.cpu_percent() / 100
    except:
        load_avg = 0.0
        
    return {
        "queue_length": redis_client.llen("task_queue"),
        "system_load": round(load_avg, 2),
        "memory_usage": psutil.virtual_memory().percent,
        "service_status": "healthy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
