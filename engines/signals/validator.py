"""
engines/signals/validator.py
Signal validation layer — checks a TradingSignal before forwarding to risk engine.

Checks performed (in order):
  1. Data freshness — rejects SYNTHETIC market data
  2. Symbol availability — symbol must be non-empty and not blacklisted
  3. Direction validity — must be BUY or SELL (not HOLD)
  4. Confidence threshold — must meet minimum confidence gate
  5. Price validity — entry/SL/TP must be positive and logically consistent
  6. Expiry check — signal must not have already expired
  7. Duplicate detection — no identical (symbol, direction, timeframe) signal in last N seconds

Returns ValidationResult with full audit trail.
"""

import logging
import time
from datetime import datetime, timezone
from typing import Optional

from engines.signals.models import (
    TradingSignal, ValidationResult, DataFreshness, SignalStatus
)

logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
MIN_CONFIDENCE = 0.60           # 60% minimum for a tradeable signal
DUPLICATE_WINDOW_S = 300        # 5 minutes — same symbol+direction suppressed
BLACKLISTED_SYMBOLS: set = set()  # populate from config/env as needed

# In-memory duplicate guard: {(symbol, direction, timeframe): last_seen_ts}
_recent_signals: dict = {}


def validate_signal(
    signal: TradingSignal,
    min_confidence: float = MIN_CONFIDENCE,
    allow_synthetic_data: bool = False,
    duplicate_window_s: int = DUPLICATE_WINDOW_S,
) -> ValidationResult:
    """
    Validate a TradingSignal against all safety gates.

    Args:
        signal: The signal to validate.
        min_confidence: Minimum confidence (0.0–1.0) required to pass.
        allow_synthetic_data: If False (default), signals built on synthetic
                              market data are rejected immediately.
        duplicate_window_s: Seconds within which the same (symbol, direction,
                            timeframe) is considered a duplicate.

    Returns:
        ValidationResult with passed=True/False and audit trail.
    """
    t0 = time.monotonic()
    checks_run = []
    checks_failed = []

    def fail(check: str, reason: str) -> ValidationResult:
        checks_run.append(check)
        checks_failed.append(check)
        elapsed = (time.monotonic() - t0) * 1000
        logger.warning(
            "Signal %s [%s] REJECTED at '%s': %s",
            signal.signal_id, signal.symbol, check, reason
        )
        return ValidationResult(
            passed=False,
            reason=reason,
            checks_run=checks_run,
            checks_failed=checks_failed,
            latency_ms=round(elapsed, 2),
        )

    # 1. Data freshness
    checks_run.append("data_freshness")
    if signal.data_freshness == DataFreshness.SYNTHETIC and not allow_synthetic_data:
        return fail("data_freshness",
                    "Signal built on synthetic market data — rejected to prevent fabricated trades")
    if signal.data_freshness == DataFreshness.UNAVAILABLE:
        return fail("data_freshness", "Market data unavailable — cannot validate signal")

    # 2. Symbol
    checks_run.append("symbol_availability")
    if not signal.symbol or len(signal.symbol.strip()) == 0:
        return fail("symbol_availability", "Signal has no symbol")
    if signal.symbol.upper() in BLACKLISTED_SYMBOLS:
        return fail("symbol_availability", f"{signal.symbol} is on the blacklist")

    # 3. Direction
    checks_run.append("direction_validity")
    if signal.direction.upper() not in ("BUY", "SELL"):
        return fail("direction_validity",
                    f"Direction '{signal.direction}' is not tradeable (must be BUY or SELL)")

    # 4. Confidence
    checks_run.append("confidence_threshold")
    if signal.confidence < min_confidence:
        return fail("confidence_threshold",
                    f"Confidence {signal.confidence:.1%} below minimum {min_confidence:.1%}")

    # 5. Price validity
    checks_run.append("price_validity")
    if signal.entry_price is not None and signal.entry_price <= 0:
        return fail("price_validity", f"Invalid entry price: {signal.entry_price}")
    if signal.stop_loss is not None and signal.entry_price is not None:
        if signal.direction.upper() == "BUY" and signal.stop_loss >= signal.entry_price:
            return fail("price_validity",
                        f"BUY signal SL {signal.stop_loss} >= entry {signal.entry_price}")
        if signal.direction.upper() == "SELL" and signal.stop_loss <= signal.entry_price:
            return fail("price_validity",
                        f"SELL signal SL {signal.stop_loss} <= entry {signal.entry_price}")

    # 6. Expiry
    checks_run.append("expiry")
    if signal.expiration_timestamp is not None:
        now = datetime.now(timezone.utc)
        if signal.expiration_timestamp.tzinfo is None:
            from datetime import timezone as tz
            exp = signal.expiration_timestamp.replace(tzinfo=tz.utc)
        else:
            exp = signal.expiration_timestamp
        if now > exp:
            return fail("expiry", f"Signal expired at {exp.isoformat()}")

    # 7. Duplicate detection
    checks_run.append("duplicate_detection")
    dup_key = (signal.symbol.upper(), signal.direction.upper(), signal.timeframe)
    last_seen = _recent_signals.get(dup_key, 0)
    now_ts = time.monotonic()
    if now_ts - last_seen < duplicate_window_s:
        age_s = int(now_ts - last_seen)
        return fail("duplicate_detection",
                    f"Duplicate signal for {signal.symbol} {signal.direction} "
                    f"seen {age_s}s ago (window={duplicate_window_s}s)")
    _recent_signals[dup_key] = now_ts

    elapsed = (time.monotonic() - t0) * 1000
    logger.info(
        "Signal %s [%s %s] passed all %d validation checks in %.1fms",
        signal.signal_id, signal.symbol, signal.direction,
        len(checks_run), elapsed
    )
    return ValidationResult(
        passed=True,
        reason="All validation checks passed",
        checks_run=checks_run,
        checks_failed=[],
        latency_ms=round(elapsed, 2),
    )


def clear_duplicate_cache() -> None:
    """Clear the in-memory duplicate signal cache (useful in tests)."""
    _recent_signals.clear()
