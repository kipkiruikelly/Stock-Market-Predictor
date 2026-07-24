"""
fastapi_service/schemas.py
Pydantic schemas for request validation & OpenAPI type definitions.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class PredictionRequest(BaseModel):
    ticker: str = Field(..., example="AAPL", description="Asset ticker symbol")
    interval: str = Field("1d", example="1d", description="Timeframe interval (1d, 1h, 4h, 15m, etc.)")
    risk_pct: Optional[float] = Field(1.0, example=1.0, description="Risk percentage per trade")

class PredictionResponse(BaseModel):
    ok: bool = True
    ticker: str
    interval: str
    direction: str
    confidence: float
    current_price: float
    lr_pred: float
    rf_pred: float
    action: str
    rsi: Optional[float] = None
    macd_signal: Optional[str] = None
    ict_bias: Optional[str] = None
    model_votes: Optional[Dict[str, bool]] = None

class SignalRequest(BaseModel):
    ticker: str = Field(..., example="BTC", description="Asset ticker symbol")
    interval: str = Field("1d", example="1d", description="Timeframe interval")

class SignalResponse(BaseModel):
    ticker: str
    action: str
    confidence: float
    entry_price: float
    stop_loss: float
    take_profit: float
    interval: str
    timestamp: str

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "fastapi-inference-service"
    version: str = "1.0.0"
    ml_available: bool = True
