param (
    [switch]$Stop
)

$RootDir = $PSScriptRoot

function Stop-All {
    Write-Host "[X] Stopping all services..." -ForegroundColor Yellow
    # Stop processes on our ports
    foreach ($port in 8000, 4000, 3000, 5555) {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $conns) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped process $($conn.OwningProcess) on port $port" -ForegroundColor Red
        }
    }
    Write-Host "[OK] All services stopped" -ForegroundColor Green
}

if ($Stop) {
    Stop-All
    exit
}

# Ensure we start fresh
Stop-All

Write-Host "[1/4] Starting UEBA Engine (Python/FastAPI) on port 8000..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory "$RootDir\engine" -WindowStyle Normal

Write-Host "[2/4] Starting Orchestrator (Node.js/Express + WS) on port 4000..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx tsx src/server.ts" -WorkingDirectory "$RootDir\orchestrator" -WindowStyle Normal

Write-Host "[3/4] Starting Dashboard (Next.js) on port 3000..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx next dev --port 3000" -WorkingDirectory "$RootDir\dashboard" -WindowStyle Normal

Write-Host "[4/4] Starting Telemetry Simulator (Python) on port 5555..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "simulator.py" -WorkingDirectory "$RootDir\simulator" -WindowStyle Normal

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  ALL SERVICES RUNNING" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  Engine:       http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Orchestrator: http://localhost:4000" -ForegroundColor Cyan
Write-Host "  Dashboard:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Simulator:    http://localhost:5555" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Write-Host "4 new windows have been opened for the services." -ForegroundColor Yellow
Write-Host "Run '.\runall.ps1 -Stop' to terminate them." -ForegroundColor Yellow
