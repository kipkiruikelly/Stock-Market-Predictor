#!/bin/bash

# Change directory to the directory where this script is located
cd "$(dirname "$0")"

# Initialize .env configuration file if missing
if [ ! -f ".env" ]; then
    echo "Initializing .env configuration file from .env.example..."
    cp .env.example .env
fi

# Kill any existing server processes on ports 8001 and 8002 to avoid conflicts
echo "Stopping any existing processes on ports 8001, 8002, and 3307..."
lsof -ti :8001 | xargs kill -9 2>/dev/null
lsof -ti :8002 | xargs kill -9 2>/dev/null
lsof -ti :3307 | xargs kill -9 2>/dev/null

# ── Cloud SQL Auth Proxy ───────────────────────────────────────────────────────
PROXY_BIN="./cloud-sql-proxy"
INSTANCE_CONNECTION="triple-fusion-engine-503215:europe-west1:triple-fusion-engine"

if [ ! -f "$PROXY_BIN" ]; then
    echo "Cloud SQL Auth Proxy not found. Downloading..."
    ARCH=$(uname -m)
    if [ "$ARCH" = "arm64" ]; then
        PROXY_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.3/cloud-sql-proxy.darwin.arm64"
    else
        PROXY_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.3/cloud-sql-proxy.darwin.amd64"
    fi
    curl -o "$PROXY_BIN" "$PROXY_URL"
    chmod +x "$PROXY_BIN"
    echo "Cloud SQL Auth Proxy downloaded."
fi

echo "Starting Cloud SQL Auth Proxy on port 3307..."
"$PROXY_BIN" \
    --credentials-file=./cloudsql-key.json \
    --port=3307 \
    "$INSTANCE_CONNECTION" \
    > logs/cloud-sql-proxy.log 2>&1 &

PROXY_PID=$!
echo "Cloud SQL Proxy started (PID: $PROXY_PID). Waiting for it to be ready..."

# Wait up to 15 seconds for proxy to be ready
for i in $(seq 1 15); do
    if lsof -ti :3307 > /dev/null 2>&1; then
        echo "Cloud SQL Proxy is ready on port 3307."
        break
    fi
    sleep 1
done

if ! lsof -ti :3307 > /dev/null 2>&1; then
    echo "WARNING: Cloud SQL Proxy may not have started. Check logs/cloud-sql-proxy.log"
    echo "Continuing anyway..."
fi

# ── Python Virtual Environment ─────────────────────────────────────────────────
if [ -d "venv" ]; then
    echo "Activating Python virtual environment..."
    source venv/bin/activate
else
    echo "Warning: 'venv' directory not found. Please set up your virtual environment."
fi

# ── Django Migrations & Server ─────────────────────────────────────────────────
echo "Verifying database migrations..."
./venv/bin/python django_backend/manage.py migrate --run-syncdb 2>&1 | tail -5

echo "Starting Django API backend on http://localhost:8001..."
./venv/bin/python django_backend/manage.py runserver 0.0.0.0:8001 &

# ── React/Vite Frontend ────────────────────────────────────────────────────────
echo "Starting React Vite frontend on http://localhost:8002..."
cd frontend
npm run dev -- --port 8002
