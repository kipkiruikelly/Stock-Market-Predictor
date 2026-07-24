"""
fastapi_service/routers/inference.py
FastAPI async endpoints for ML inference and trading signal generation.
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from fastapi_service.schemas import (
    PredictionRequest, PredictionResponse,
    SignalRequest, SignalResponse
)

# Ensure project root is on sys.path to import predictor
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

router = APIRouter(prefix="/api/v1", tags=["ML Inference"])

def _execute_prediction(ticker: str, interval: str) -> dict:
    import predictor
    return predictor.run_prediction(ticker, interval)

def _execute_signal(ticker: str, interval: str) -> dict:
    import predictor
    return predictor.ml_signal(ticker, interval)

@router.post("/predict", response_model=PredictionResponse)
async def predict(req: PredictionRequest):
    """Run full quantitative ML prediction for a given ticker & interval."""
    ticker = req.ticker.strip().upper()
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")
        
    try:
        # Offload CPU-heavy ML calculation to worker thread pool
        result = await asyncio.to_thread(_execute_prediction, ticker, req.interval)
        return PredictionResponse(ok=True, **result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error for {ticker}: {str(e)}"
        )

@router.post("/signal", response_model=SignalResponse)
async def signal(req: SignalRequest):
    """Generate compact institutional trading signal for automated bots & MT5."""
    ticker = req.ticker.strip().upper()
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")

    try:
        res = await asyncio.to_thread(_execute_signal, ticker, req.interval)
        return SignalResponse(
            ticker=ticker,
            action=res.get("action", "HOLD"),
            confidence=res.get("confidence", 50.0),
            entry_price=res.get("current_price", 0.0),
            stop_loss=res.get("stop_loss", 0.0),
            take_profit=res.get("take_profit", 0.0),
            interval=req.interval,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
    except Exception as e:
        return SignalResponse(
            ticker=ticker,
            action="HOLD",
            confidence=0.0,
            entry_price=0.0,
            stop_loss=0.0,
            take_profit=0.0,
            interval=req.interval,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
