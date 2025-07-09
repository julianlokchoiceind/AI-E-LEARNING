#!/bin/bash

echo "==============================================="
echo "AI E-Learning Platform - Clean Startup"
echo "==============================================="
echo

echo "Step 1: Stopping any existing processes..."
echo

# Kill processes on port 3001 (Frontend)
echo "Checking port 3001..."
if lsof -i :3001 >/dev/null 2>&1; then
    echo "Killing processes on port 3001..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
else
    echo "Port 3001 is available"
fi

# Kill processes on port 8001 (Backend)
echo "Checking port 8001..."
if lsof -i :8001 >/dev/null 2>&1; then
    echo "Killing processes on port 8001..."
    lsof -ti :8001 | xargs kill -9 2>/dev/null || true
else
    echo "Port 8001 is available"
fi

echo
echo "Step 2: Waiting for ports to be released..."
sleep 3

echo
echo "Step 3: Starting AI E-Learning Platform..."
echo
echo "Frontend will be available at: http://localhost:3001"
echo "Backend API will be available at: http://localhost:8001/api/v1"
echo

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if backend virtual environment exists
if [ ! -d "$SCRIPT_DIR/backend/venv" ]; then
    echo "Error: Python virtual environment not found!"
    echo "Please run: python -m venv backend/venv"
    echo "Then: source backend/venv/bin/activate"
    echo "Then: pip install -r backend/requirements.txt"
    exit 1
fi

# Check if frontend node_modules exists
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "Error: Node modules not found!"
    echo "Please run: cd frontend && npm install"
    exit 1
fi

echo "Starting Backend..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

echo "Starting Frontend..."
cd "$SCRIPT_DIR/frontend"
npm run dev-frontend-only &
FRONTEND_PID=$!

echo
echo "==============================================="
echo "✅ Both services started successfully!"
echo
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:8001/api/v1"
echo "📚 API Docs: http://localhost:8001/api/v1/docs"
echo
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo
echo "Press Ctrl+C to stop both services..."
echo "==============================================="

# Wait for user to stop
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait