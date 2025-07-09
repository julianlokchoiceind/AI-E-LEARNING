@echo off
echo ===============================================
echo AI E-Learning Platform - Clean Startup
echo ===============================================
echo.

echo Step 1: Stopping any existing processes...
echo.

REM Kill processes on port 3001 (Frontend)
echo Checking port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo Killing process %%a on port 3001
    taskkill /f /pid %%a >nul 2>&1
)

REM Kill processes on port 8001 (Backend)
echo Checking port 8001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do (
    echo Killing process %%a on port 8001
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Step 2: Waiting for ports to be released...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Starting AI E-Learning Platform...
echo.
echo Frontend will be available at: http://localhost:3001
echo Backend API will be available at: http://localhost:8001/api/v1
echo.

REM Start Backend
echo Starting Backend...
cd /d "%~dp0backend"
if not exist "venv" (
    echo Error: Python virtual environment not found!
    echo Please run: python -m venv venv
    echo Then: venv\Scripts\activate
    echo Then: pip install -r requirements.txt
    pause
    exit /b 1
)

start "AI E-Learning Backend" cmd /c "venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start Frontend
echo Starting Frontend...
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Error: Node modules not found!
    echo Please run: npm install
    pause
    exit /b 1
)

start "AI E-Learning Frontend" cmd /c "npm run dev-frontend-only"

echo.
echo ===============================================
echo ✅ Both services started successfully!
echo.
echo 🌐 Frontend: http://localhost:3001
echo 🔧 Backend API: http://localhost:8001/api/v1
echo 📚 API Docs: http://localhost:8001/api/v1/docs
echo.
echo Press any key to close this window...
echo ===============================================
pause >nul