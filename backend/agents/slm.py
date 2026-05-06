from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import os
from dotenv import load_dotenv

load_dotenv()

class SLMSubAgent:
    """
    The SLM Sub-Agent is responsible for processing verbose terminal logs.
    It identifies errors, warnings, and key success indicators, providing 
    a concise summary to the Primary Agent.
    """
    def __init__(self, model_name: str = None):
        load_dotenv()
        self.model_type = os.getenv("SLM_MODEL_TYPE", "openai").lower()
        
        if self.model_type == "ollama":
            from langchain_ollama import ChatOllama
            self.llm = ChatOllama(
                model=os.getenv("SLM_MODEL_NAME", "qwen2.5:3b"),
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
                temperature=0
            )
        else:
            self.llm = ChatOpenAI(
                model=model_name or os.getenv("SLM_MODEL_NAME", "gpt-3.5-turbo"),
                temperature=0
            )
        
        self.summary_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a specialized Terminal Log Analyzer (SLM Sub-Agent). 
Your goal is to parse verbose terminal logs and extract ONLY the most relevant information for a Primary Agent.
Focus on:
1. Compilation errors or runtime crashes.
2. Failed test cases and their specific error messages.
3. Key performance metrics (if any).
4. Whether the command succeeded or failed.

Be extremely concise. If there are no errors, just say 'Success: [Brief description of what happened]'.
If there are errors, provide the exact lines of code or stack traces that caused the failure."""),
            ("user", "COMMAND: {command}\n\nSTDOUT:\n{stdout}\n\nSTDERR:\n{stderr}\n\nEXIT_CODE: {exit_code}")
        ])

    async def summarize_logs(self, execution_result: Dict) -> str:
        chain = self.summary_prompt | self.llm
        response = await chain.ainvoke(execution_result)
        return response.content

if __name__ == "__main__":
    import asyncio
    agent = SLMSubAgent()
    test_result = {
        "command": "npm run build",
        "stdout": "Building... Done. Optimization complete.",
        "stderr": "Error: Unexpected token at line 45 in App.js",
        "exit_code": 1
    }
    summary = asyncio.run(agent.summarize_logs(test_result))
    print(f"Summary: {summary}")
