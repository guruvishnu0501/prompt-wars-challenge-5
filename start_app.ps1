# EventWise AI - Launch Script
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "     Starting EventWise AI Stack        " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Start Backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$PSScriptRoot'; Write-Host 'Starting FastAPI Backend...' -ForegroundColor Green; .\venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000"

# Start Frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$PSScriptRoot\frontend'; Write-Host 'Starting Vite Frontend...' -ForegroundColor Green; npm run dev"

Write-Host "Backend launched at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Frontend launched at: http://localhost:5173" -ForegroundColor Green
