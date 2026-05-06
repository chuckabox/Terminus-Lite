from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import os
from dotenv import load_dotenv

load_dotenv()

class PrimaryAgent:
    """
    The Primary Agent handles high-level reasoning and decision making.
    It receives task requests and decides which commands to run.
    It never sees raw logs, only the summaries from the SLM.
    """
    def __init__(self, model_name: str = None):
        load_dotenv()
        self.model_type = os.getenv("PRIMARY_MODEL_TYPE", "openai").lower()
        
        if self.model_type == "ollama":
            from langchain_ollama import ChatOllama
            self.llm = ChatOllama(
                model=os.getenv("PRIMARY_MODEL_NAME", "llama3:8b"),
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
                temperature=0
            )
        else:
            self.llm = ChatOpenAI(
                model=model_name or os.getenv("PRIMARY_MODEL_NAME", "gpt-4o"),
                temperature=0
            )
        
        self.orchestrator_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are the Primary Orchestrator. 
Your goal is to solve the task with the LEAST number of steps possible.

RULES:
1. If the LATEST_EXECUTION_SUMMARY says 'Status: Success' and the intent is met, YOU MUST STOP.
2. To stop, output ONLY: TASK_COMPLETE: <final summary>
3. To continue, output ONLY: RUN: <command>
4. NEVER repeat a command.
5. NO conversation. NO explanations.

Current Situation:
- If the task is a simple greeting like 'hi' or 'hello', DO NOT run any commands. Just finish immediately.
- If you have already performed an action that satisfies the request, STOP.
- NEVER run the same command twice.
"""),
            ("user", "TASK: {task}\n\nPREVIOUS_ACTIONS: {history}\n\nLATEST_EXECUTION_SUMMARY: {summary}")
        ])

    async def decide_next_step(self, task: str, history: List[str], summary: str) -> str:
        chain = self.orchestrator_prompt | self.llm
        response = await chain.ainvoke({
            "task": task,
            "history": "\n".join(history),
            "summary": summary
        })
        return response.content
