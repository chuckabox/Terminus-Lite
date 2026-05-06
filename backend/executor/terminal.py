import subprocess
import os
import asyncio
from typing import Dict, Any

class TerminalExecutor:
    def __init__(self, cwd: str = None):
        self.cwd = cwd or os.getcwd()

    async def execute(self, command: str) -> Dict[str, Any]:
        """
        Executes a command and returns the output, error, and exit code.
        """
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.cwd
            )

            stdout, stderr = await process.communicate()
            
            return {
                "stdout": stdout.decode().strip(),
                "stderr": stderr.decode().strip(),
                "exit_code": process.returncode,
                "command": command
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1,
                "command": command
            }

if __name__ == "__main__":
    # Test execution
    executor = TerminalExecutor()
    result = asyncio.run(executor.execute("echo 'Hello Terminus'"))
    print(result)
