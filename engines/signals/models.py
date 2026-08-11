"""
engines/signals/models.py
Pure-Python dataclass models for the signal domain.
These are the in-memory/inter-process signal objects.
Django ORM models (for persistence) are in django_backend/trading/trading_models.py.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any, List


class SignalStatus(Enum):
    GENERATED = "GENERATED"
    VALIDATING = "VALIDATING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    QUEUED = "QUEUED"
    EXECUTING = "EXECUTING"
    EXECUTED = "EXECUTED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"


class SignalSource(Enum):
    ML_ENGINE = "ml_engine"
    TRADINGVIEW = "tradingview"
    ICT_BOT = "ict_bot"
    MANUAL = "manual"
    API = "api"


class DataFreshness(Enum):
    LIVE = "live"
    STALE = "stale"
    SYNTHETIC = "synthetic"
    UNAVAILABLE = "unavailable"


@dataclass
class TradingSignal:
    # Identity
    signal_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    correlation_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    # Asset
    symbol: str = ""
    asset_class: str = "equity"
    timeframe: str = "1d"

    # Signal
    direction: str = "HOLD"          # BUY / SELL / HOLD
    confidence: float = 0.0          # 0.0 – 1.0
    entry_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_reward: Optional[float] = None

    # Model provenance
    model_name: str = "unknown"
    model_version: str = "unknown"
    model_family: str = "unknown"
    feature_version: str = "unknown"
    regime: Optional[str] = None
    feature_snapshot: Optional[Dict[str, Any]] = None

    # Data quality
    data_freshness: DataFreshness = DataFreshness.UNAVAILABLE

    # Timestamps
    prediction_timestamp: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    expiration_timestamp: Optional[datetime] = None

    # Source
    source: SignalSource = SignalSource.ML_ENGINE
    strategy_id: Optional[str] = None

    # State
    status: SignalStatus = SignalStatus.GENERATED
    validation_status: Optional[str] = None
    validation_reason: Optional[str] = None
    risk_status: Optional[str] = None
    execution_status: Optional[str] = None

    # Extra metadata
    raw_prediction: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "signal_id": self.signal_id,
            "correlation_id": self.correlation_id,
            "symbol": self.symbol,
            "asset_class": self.asset_class,
            "timeframe": self.timeframe,
            "direction": self.direction,
            "confidence": round(self.confidence * 100, 1),
            "entry_price": self.entry_price,
            "stop_loss": self.stop_loss,
            "take_profit": self.take_profit,
            "risk_reward": self.risk_reward,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "model_family": self.model_family,
            "feature_version": self.feature_version,
            "regime": self.regime,
            "data_freshness": self.data_freshness.value,
            "prediction_timestamp": self.prediction_timestamp.isoformat(),
            "expiration_timestamp": self.expiration_timestamp.isoformat() if self.expiration_timestamp else None,
            "source": self.source.value,
            "strategy_id": self.strategy_id,
            "status": self.status.value,
            "validation_status": self.validation_status,
            "validation_reason": self.validation_reason,
            "risk_status": self.risk_status,
            "execution_status": self.execution_status,
        }


@dataclass
class ValidationResult:
    passed: bool
    reason: str = ""
    checks_run: List[str] = field(default_factory=list)
    checks_failed: List[str] = field(default_factory=list)
    latency_ms: float = 0.0


@dataclass
class RiskDecision:
    approved: bool
    reason: str = ""
    position_size: Optional[float] = None
    max_loss_amount: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    kelly_fraction: Optional[float] = None
    portfolio_exposure_pct: Optional[float] = None
    daily_loss_used_pct: Optional[float] = None
    circuit_breaker_active: bool = False
    latency_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "approved": self.approved,
            "reason": self.reason,
            "position_size": self.position_size,
            "max_loss_amount": self.max_loss_amount,
            "stop_loss": self.stop_loss,
            "take_profit": self.take_profit,
            "kelly_fraction": self.kelly_fraction,
            "portfolio_exposure_pct": self.portfolio_exposure_pct,
            "daily_loss_used_pct": self.daily_loss_used_pct,
            "circuit_breaker_active": self.circuit_breaker_active,
            "latency_ms": self.latency_ms,
        }
