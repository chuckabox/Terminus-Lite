import subprocess
import time
import sys
import os
from pathlib import Path

def start_service(name, command, cwd=None):
    print(f"[SYSTEM] Launching {name}...")
    return subprocess.Popen(command, shell=True, cwd=cwd)

def main():
    root = Path(__file__).parent
    
    # 1. Start Redis check
    try:
        import redis
        r = redis.Redis(host='127.0.0.1', port=6379)
        r.ping()
        print("[SYSTEM] Redis is active.")
    except Exception:
        print("[ERROR] Redis not found. Please ensure redis-server is running on port 6379.")
        sys.exit(1)

    processes = []
    
    try:
        # 2. Launch Backend Services
        processes.append(start_service("Orchestrator", [sys.executable, "services/orchestrator/main.py"]))
        processes.append(start_service("SLM Service", [sys.executable, "services/slm/main.py"]))
        processes.append(start_service("Worker Node", [sys.executable, "services/worker/main.py"]))
        
        # 3. Launch Frontend
        frontend_dir = root / "frontend"
        if frontend_dir.exists():
            processes.append(start_service("Frontend", "npm run dev", cwd=str(frontend_dir)))

        print("\n[SUCCESS] Terminus-Lite stack is operational.")
        print("[INFO] Dashboard: http://localhost:5173 (or 5174)")
        print("[INFO] Press Ctrl+C to shutdown all services.\n")

        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n[SYSTEM] Shutting down services...")
        for p in processes:
            p.terminate()
        print("[SYSTEM] Done.")

if __name__ == "__main__":
    main()
