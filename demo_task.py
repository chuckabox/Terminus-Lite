import httpx
import asyncio
import json

async def run_demo():
    url = "http://localhost:8000/execute"
    task = "List the contents of the current directory and explain what this project is about."
    
    print(f"Sending task: {task}")
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json={"task": task})
            if response.status_code == 200:
                data = response.json()
                print("\n--- TASK COMPLETE ---")
                print(f"Final Result: {data['final_result']}")
                print(f"Total Tokens Saved: {data['total_tokens_saved']}")
                print("\nSteps:")
                for i, step in enumerate(data['steps']):
                    print(f"\n[Step {i+1}] Command: {step.command}")
                    print(f"Summary: {step.summary}")
                    print(f"Savings: {step.tokens_saved} characters")
            else:
                print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_demo())
