#!/bin/bash

cleanup() {
    echo "Cleaning up..."
    if [ -n "$SERVER_PID" ]; then
        echo "Killing server process $SERVER_PID"
        # Try graceful shutdown first
        kill $SERVER_PID 2>/dev/null || true
        sleep 5
        # Force kill if still running
        kill -9 $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi

    if [ -n "$PORT" ]; then
        echo "Checking for processes using port $PORT"
        local pids=$(lsof -ti:$PORT 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "Killing processes using port $PORT: $pids"
            echo $pids | xargs kill -9 2>/dev/null || true
        fi
    fi

    rm -f server.log
    echo "Cleanup complete"
    exit
}

trap cleanup EXIT INT TERM

# Generate a random port
PORT=$(shuf -i 8000-9000 -n 1)
echo "Using port: $PORT"

MAX_SERVE_PORT=$PORT max-pipelines serve --model-path sentence-transformers/all-mpnet-base-v2 > server.log 2>&1 &
SERVER_PID=$!

echo "Starting server with PID $SERVER_PID..."

while true; do
    if grep -q "Server ready on http://0.0.0.0:$PORT (Press CTRL+C to quit)" server.log; then
        SERVER_URL="http://0.0.0.0:$PORT/v1"
        break
    fi
    sleep 10
    echo "Waiting for server to be ready..."
    # Check if server is still running
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "Server process died unexpectedly"
        cat server.log
        exit 1
    fi
done

echo "Server is ready at $SERVER_URL, running main.py..."
BASE_URL=$SERVER_URL python main.py

