import asyncio
from backend.executor.terminal import TerminalExecutor

async def test_executor():
    executor = TerminalExecutor()
    
    # Test simple echo
    result = await executor.execute("echo 'test'")
    assert result["stdout"] == "test"
    assert result["exit_code"] == 0
    
    # Test error
    result = await executor.execute("non_existent_command")
    assert result["exit_code"] != 0
    
    print("TerminalExecutor tests passed!")

if __name__ == "__main__":
    asyncio.run(test_executor())
