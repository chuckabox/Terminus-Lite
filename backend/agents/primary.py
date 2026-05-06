from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

class PrimaryAgent:
    """
    The Primary Agent handles high-level reasoning and decision making.
    It receives task requests and decides which commands to run.
    It never sees raw logs, only the summaries from the SLM.
    """
    def __init__(self, model_name: str = "gpt-4o"):
        self.llm = ChatOpenAI(model=model_name, temperature=0)
        
        self.orchestrator_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are the Primary Orchestrator for Terminus-Lite.
Your job is to solve user tasks by executing terminal commands.
You delegate the execution and log analysis to an SLM Sub-Agent.
You will receive a concise summary of the execution results.
Based on the summary, decide if the task is complete or if further actions are needed."""),
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
