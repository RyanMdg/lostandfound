#!/bin/bash

echo "======================================"
echo "Lost and Found System - Quick Start"
echo "======================================"
echo ""

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✓ Backend environment created"
else
    echo "✓ Backend environment exists"
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✓ Frontend dependencies installed"
else
    echo "✓ Frontend dependencies installed"
fi

echo ""
echo "Starting servers..."
echo ""

# Start backend in background
echo "Starting backend server on http://localhost:5000..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend server on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "======================================"
echo "Both servers are running!"
echo "======================================"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:5000"
echo "API Docs: http://localhost:5000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "======================================"

# Wait for Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
