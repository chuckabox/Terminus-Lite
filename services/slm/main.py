from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any
import os
from shared.utils.logging import setup_logger
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Terminus-Lite SLM Service")
logger = setup_logger("slm_service")

# Initialize LLM
model_name = os.getenv("SLM_MODEL_NAME", "qwen2.5:3b")
ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

llm = ChatOllama(model=model_name, base_url=ollama_url, temperature=0)

summary_prompt = ChatPromptTemplate.from_messages([
    ("system", "Summarize these terminal logs concisely. Extract only errors and key results."),
    ("user", "STDOUT:\n{stdout}\n\nSTDERR:\n{stderr}")
])

class SummaryRequest(BaseModel):
    stdout: str
    stderr: str

@app.post("/summarize")
async def summarize(request: SummaryRequest):
    logger.info("Summarizing logs", extra={"service": "slm_service"})
    try:
        chain = summary_prompt | llm
        response = await chain.ainvoke({"stdout": request.stdout, "stderr": request.stderr})
        return {"summary": response.content}
    except Exception as e:
        logger.error(f"Inference failed: {str(e)}", extra={"service": "slm_service"})
        raise HTTPException(status_code=500, detail="Inference failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
