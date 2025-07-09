@echo off
echo ===============================================
echo AI E-Learning Platform - Frontend Only
echo ===============================================
echo.

echo Step 1: Stopping any existing processes on port 3001...
echo.

REM Kill processes on port 3001 (Frontend)
echo Checking port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo Killing process %%a on port 3001
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Step 2: Waiting for port to be released...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Starting Frontend...
echo.
echo Frontend will be available at: http://localhost:3001
echo.

REM Start Frontend
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Error: Node modules not found!
    echo Please run: npm install
    pause
    exit /b 1
)

echo Starting Frontend on port 3001...
npm run dev-frontend-only

pause