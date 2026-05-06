# Terminus-Lite Distributed Launcher
Write-Host "Starting Terminus-Lite Distributed Stack..." -ForegroundColor Cyan

# 1. Start Redis if not already running
$redisPath = "C:\Program Files\Redis\redis-server.exe"
if (Get-Process "redis-server" -ErrorAction SilentlyContinue) {
    Write-Host "Redis is already running." -ForegroundColor Gray
} elseif (Test-Path $redisPath) {
    Write-Host "Starting Redis Server..." -ForegroundColor Yellow
    Start-Process $redisPath -WindowStyle Hidden
}

# 2. Start Orchestrator (Port 8001)
Write-Host "[1/3] Launching Orchestrator API..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONPATH='.'; python services/orchestrator/main.py"

# 3. Start SLM Service (Port 8002)
Write-Host "[2/3] Launching SLM Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONPATH='.'; python services/slm/main.py"

# 4. Start Worker Node
Write-Host "[3/3] Launching Worker Node..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONPATH='.'; python services/worker/main.py"

# 5. Start Frontend
Write-Host "Launching Frontend Dashboard..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "System initiated. Access the dashboard at http://localhost:5173" -ForegroundColor Cyan
