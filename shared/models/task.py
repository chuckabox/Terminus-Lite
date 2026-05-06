from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
import uuid

class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class ExecutionStep(BaseModel):
    command: str
    summary: str
    raw_log_size: int
    summary_size: int
    tokens_saved: int
    timestamp: datetime = Field(default_factory=datetime.now)

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request: str
    status: TaskStatus = TaskStatus.PENDING
    current_node: Optional[str] = None
    steps: List[ExecutionStep] = []
    final_result: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    total_tokens_saved: int = 0

class TaskRequest(BaseModel):
    task: str

class TaskResponse(BaseModel):
    task_id: str
    status: TaskStatus
