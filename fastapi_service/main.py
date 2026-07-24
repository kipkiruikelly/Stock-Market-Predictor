"""
fastapi_service/main.py
Main entrypoint for the BullLogic FastAPI Async Inference & Real-Time Microservice.
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_service.schemas import HealthResponse
from fastapi_service.routers import inference, websockets

# Ensure project root is on sys.path
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

app = FastAPI(
    title="BullLogic High-Performance Async Inference & Real-Time Engine",
    description="FastAPI Microservice providing sub-millisecond ML predictions, trade signals, and real-time WebSockets.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(inference.router)
app.include_router(websockets.router)

@app.get("/health", response_model=HealthResponse, tags=["Health Probe"])
async def health_check():
    """Liveness probe for Cloud Run, Docker, and Kubernetes."""
    return HealthResponse(
        status="ok",
        service="fastapi-inference-service",
        version="1.0.0",
        ml_available=True
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8002))
    uvicorn.run("fastapi_service.main:app", host="0.0.0.0", port=port, reload=True)
