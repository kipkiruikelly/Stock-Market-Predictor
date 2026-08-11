"""
engines/signals/generator.py
Generates a structured TradingSignal from the ML prediction engine.

This is the ONLY place in the codebase that should convert a raw
ml_signal() dict into a canonical TradingSignal dataclass.
"""

import logging
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from engines.signals.models import (
    TradingSignal, SignalSource, DataFreshness, SignalStatus
)

logger = logging.getLogger(__name__)

# Default signal expiry per timeframe
_EXPIRY_MAP = {
    "1m": timedelta(minutes=3),
    "5m": timedelta(minutes=15),
    "15m": timedelta(minutes=45),
    "30m": timedelta(hours=2),
    "1h": timedelta(hours=4),
    "4h": timedelta(hours=12),
    "1d": timedelta(hours=36),
}


def generate_signal(
    symbol: str,
    timeframe: str = "1d",
    source: SignalSource = SignalSource.ML_ENGINE,
    strategy_id: Optional[str] = None,
    user_id: Optional[str] = None,
    correlation_id: Optional[str] = None,
) -> TradingSignal:
    """
    Run the ML prediction engine and wrap the result in a TradingSignal.

    Args:
        symbol: Ticker symbol (e.g. 'AAPL', 'EURUSD').
        timeframe: Candle interval (e.g. '1d', '1h', '15m').
        source: Origin of this signal request.
        strategy_id: Optional strategy identifier.
        user_id: Optional user context.
        correlation_id: Optional correlation ID (generated if not provided).

    Returns:
        TradingSignal with status=GENERATED.

    Raises:
        RuntimeError: If the prediction engine fails or returns invalid data.
    """
    t0 = time.monotonic()
    corr_id = correlation_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # --- Call the real ML engine ---
    try:
        from engines.prediction import ml_signal
        raw = ml_signal(symbol.upper(), timeframe)
    except ImportError as e:
        raise RuntimeError(f"Prediction engine not available: {e}") from e
    except Exception as e:
        raise RuntimeError(f"Prediction engine error for {symbol}/{timeframe}: {e}") from e

    if not isinstance(raw, dict):
        raise RuntimeError(f"ml_signal returned unexpected type: {type(raw)}")

    # --- Map raw dict → TradingSignal ---
    direction = str(raw.get("direction", "HOLD")).upper()
    confidence_raw = raw.get("confidence", 0)
    # ml_signal may return 0–1 float or 0–100 float depending on version
    confidence = float(confidence_raw)
    if confidence > 1.0:
        confidence = confidence / 100.0  # normalise to 0–1

    entry_price = raw.get("current_price") or raw.get("entry_price")
    stop_loss   = raw.get("stop_loss")
    take_profit = raw.get("target_price") or raw.get("take_profit")

    risk_reward: Optional[float] = None
    if entry_price and stop_loss and take_profit and stop_loss != entry_price:
        risk_reward = round(
            abs(take_profit - entry_price) / abs(entry_price - stop_loss), 2
        )

    # Data freshness
    freshness_str = raw.get("data_freshness", "unknown")
    try:
        data_freshness = DataFreshness(freshness_str)
    except ValueError:
        data_freshness = DataFreshness.LIVE  # assume live if not tagged

    expiry = _EXPIRY_MAP.get(timeframe, timedelta(hours=24))

    signal = TradingSignal(
        signal_id      = str(uuid.uuid4()),
        correlation_id = corr_id,
        symbol         = symbol.upper(),
        timeframe      = timeframe,
        direction      = direction,
        confidence     = round(confidence, 4),
        entry_price    = float(entry_price) if entry_price else None,
        stop_loss      = float(stop_loss)   if stop_loss   else None,
        take_profit    = float(take_profit) if take_profit else None,
        risk_reward    = risk_reward,
        model_name     = raw.get("model_name", "triple_fusion"),
        model_version  = raw.get("model_version", "unknown"),
        model_family   = raw.get("model_family", "ensemble"),
        feature_version= raw.get("feature_version", "unknown"),
        regime         = raw.get("regime"),
        data_freshness = data_freshness,
        prediction_timestamp  = now,
        expiration_timestamp  = now + expiry,
        source         = source,
        strategy_id    = strategy_id,
        status         = SignalStatus.GENERATED,
        raw_prediction = raw,
        user_id        = user_id,
    )

    elapsed_ms = (time.monotonic() - t0) * 1000
    logger.info(
        "Signal generated [%s] %s %s conf=%.1f%% freshness=%s in %.1fms",
        signal.signal_id, symbol, direction,
        confidence * 100, data_freshness.value, elapsed_ms
    )
    return signal


def signal_from_tradingview(
    payload: dict,
    correlation_id: Optional[str] = None,
) -> TradingSignal:
    """
    Create a TradingSignal from a validated TradingView webhook payload.

    The TV payload is treated as an INPUT EVENT, not as execution authority.
    The signal is created with status=GENERATED and must pass validation
    + risk evaluation before any execution happens.
    """
    corr_id = correlation_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    symbol    = str(payload.get("ticker", "")).upper().strip()
    direction = str(payload.get("action", "HOLD")).upper().strip()
    timeframe = str(payload.get("interval", "1d")).strip()

    # TV payloads do not come with ML confidence — set to 0 initially;
    # the pipeline will run ml_signal() to validate the TV trigger.
    confidence_raw = payload.get("confidence", 0)
    confidence = float(confidence_raw)
    if confidence > 1.0:
        confidence /= 100.0

    expiry = _EXPIRY_MAP.get(timeframe, timedelta(hours=24))

    signal = TradingSignal(
        signal_id      = str(uuid.uuid4()),
        correlation_id = corr_id,
        symbol         = symbol,
        timeframe      = timeframe,
        direction      = direction if direction in ("BUY", "SELL") else "HOLD",
        confidence     = confidence,
        entry_price    = payload.get("price") or payload.get("entry_price"),
        stop_loss      = payload.get("stop_loss") or payload.get("sl"),
        take_profit    = payload.get("take_profit") or payload.get("tp"),
        strategy_id    = payload.get("strategy_id") or payload.get("strategy"),
        source         = SignalSource.TRADINGVIEW,
        data_freshness = DataFreshness.UNAVAILABLE,  # TV does not send OHLCV
        prediction_timestamp = now,
        expiration_timestamp = now + expiry,
        status         = SignalStatus.GENERATED,
        raw_prediction = payload,
    )
    logger.info(
        "TradingView signal created [%s] %s %s timeframe=%s",
        signal.signal_id, symbol, direction, timeframe
    )
    return signal
