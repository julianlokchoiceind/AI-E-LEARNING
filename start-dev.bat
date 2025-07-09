@echo off
echo Starting AI E-Learning Platform...
echo.
echo Frontend: http://localhost:3001
echo Backend: http://localhost:8001/api/v1
echo.

cd backend
call venv\Scripts\activate
start "Backend" python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

cd ..\frontend
start "Frontend" npm run dev-frontend-only

echo Both services started!
echo Press any key to close...
pause > nul