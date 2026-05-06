# Ensure Redis is running (This script assumes Redis is installed locally)
# If you don't have Redis, this will fail. You can install it via WSL or Memurai for Windows.

Write-Host "Starting Terminus-Lite Distributed Stack..." -ForegroundColor Cyan

# Start Orchestrator (Port 8001)
Write-Host "[1/4] Launching Orchestrator API..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$host.UI.RawUI.WindowTitle='Orchestrator'; $env:PYTHONPATH='.'; python services/orchestrator/main.py"

# Start SLM Inference Service (Port 8002)
Write-Host "[2/4] Launching SLM Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$host.UI.RawUI.WindowTitle='SLM Service'; $env:PYTHONPATH='.'; python services/slm/main.py"

# Start Worker Cluster (Node 1)
Write-Host "[3/4] Launching Worker Node..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$host.UI.RawUI.WindowTitle='Worker'; $env:PYTHONPATH='.'; python services/worker/main.py"

# Start Frontend (Port 5173)
Write-Host "[4/4] Launching Frontend Dashboard..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Stack initiated. Monitor individual windows for logs." -ForegroundColor Cyan
