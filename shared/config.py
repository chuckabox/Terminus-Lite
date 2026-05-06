import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    
    ORCHESTRATOR_PORT = int(os.getenv("ORCHESTRATOR_PORT", 8001))
    SLM_SERVICE_PORT = int(os.getenv("SLM_SERVICE_PORT", 8002))
    
    SLM_SERVICE_URL = os.getenv("SLM_SERVICE_URL", f"http://localhost:{SLM_SERVICE_PORT}")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    PRIMARY_MODEL_NAME = os.getenv("PRIMARY_MODEL_NAME", "llama3:8b")
    SLM_MODEL_NAME = os.getenv("SLM_MODEL_NAME", "qwen2.5:3b")
    
    PRIMARY_MODEL_TYPE = os.getenv("PRIMARY_MODEL_TYPE", "ollama")
    SLM_MODEL_TYPE = os.getenv("SLM_MODEL_TYPE", "ollama")
