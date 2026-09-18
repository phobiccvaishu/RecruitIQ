# RecruitIQ Startup Script
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "           STARTING RECRUITIQ HUB           " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check if database is initialized, run it if not
Write-Host "Checking database status..." -ForegroundColor Yellow
python -m app.database.init_db

# Start Backend FastAPI Server on Port 8000
Write-Host "Launching Backend API Server on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend React App (Vite Dev Server) on Port 5173
Write-Host "Launching Frontend React App on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Servers are starting in separate windows." -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend Dashboard: http://localhost:5173" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
