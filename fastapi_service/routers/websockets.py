"""
fastapi_service/routers/websockets.py
FastAPI WebSockets for real-time tick streaming and live OHLCV chart data.

Endpoints:
  /ws/prices/{ticker}           — live price tick stream (uses market_data.get_quote)
  /ws/candles/{ticker}          — live OHLCV candle stream (init history + ticks)
"""

import asyncio
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

router = APIRouter(prefix="/ws", tags=["Real-time WebSockets"])

# Ensure project root is on sys.path for market_data import
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


# ---------------------------------------------------------------------------
# Connection manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    """Manages active WebSocket client connections, keyed by ticker+channel."""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, key: str, websocket: WebSocket):
        await websocket.accept()
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)

    def disconnect(self, key: str, websocket: WebSocket):
        if key in self.active_connections:
            try:
                self.active_connections[key].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[key]:
                del self.active_connections[key]

    async def broadcast(self, key: str, message: dict):
        if key in self.active_connections:
            dead: List[WebSocket] = []
            for connection in self.active_connections[key]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead.append(connection)
            for conn in dead:
                try:
                    self.active_connections[key].remove(conn)
                except ValueError:
                    pass


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Data providers
# ---------------------------------------------------------------------------

def _get_live_quote(ticker: str) -> Optional[dict]:
    """Fetch a live quote using market_data. Returns None on failure."""
    try:
        from market_data import get_quote
        quote = get_quote(ticker)
        if quote and quote.get("price") is not None:
            return quote
        return None
    except Exception:
        return None


def _get_history_candles(ticker: str, interval: str, period: str = "2d") -> List[dict]:
    """Fetch OHLCV history from market_data. Returns list of candle dicts."""
    try:
        from market_data import get_history
        import pandas as pd
        df, meta = get_history(ticker, period=period, interval=interval)
        if df is None or df.empty:
            return []

        candles = []
        for idx, row in df.iterrows():
            ts = int(idx.timestamp()) if hasattr(idx, 'timestamp') else int(time.time())
            candles.append({
                "time": ts,
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
            })
        return candles
    except Exception:
        return []


def _interval_to_seconds(interval: str) -> int:
    """Convert a timeframe string to seconds."""
    mapping = {
        "1m": 60, "5m": 300, "15m": 900, "30m": 1800,
        "1h": 3600, "4h": 14400, "1d": 86400, "1wk": 604800,
    }
    return mapping.get(interval, 86400)


# ---------------------------------------------------------------------------
# WebSocket endpoints
# ---------------------------------------------------------------------------

@router.websocket("/prices/{ticker}")
async def websocket_price_stream(websocket: WebSocket, ticker: str):
    """
    Stream real-time price ticks for a given ticker.
    Uses market_data.get_quote() for actual prices with fallback to
    a lightweight simulation when quotes are unavailable.
    """
    ticker_upper = ticker.upper()
    channel_key = f"price:{ticker_upper}"
    await manager.connect(channel_key, websocket)

    # Fetch base price for reference
    base_price = None
    quote = _get_live_quote(ticker_upper)
    if quote and quote.get("price"):
        base_price = float(quote["price"])

    # Fallback: try yfinance
    if base_price is None:
        try:
            import yfinance as yf
            base_price = float(yf.Ticker(ticker_upper).fast_info.last_price or 0.0)
        except Exception:
            base_price = None

    # Last resort fallback
    if base_price is None or base_price <= 0:
        base_price = 100.0

    cur_price = base_price

    try:
        while True:
            # Try to get a real quote
            quote = _get_live_quote(ticker_upper)
            if quote and quote.get("price"):
                cur_price = float(quote["price"])
            else:
                # Micro-drift as fallback
                import random
                cur_price = round(cur_price + random.uniform(-0.02, 0.02) * (cur_price * 0.001), 4)

            payload = {
                "type": "price_tick",
                "ticker": ticker_upper,
                "price": cur_price,
                "change_pct": round(((cur_price - base_price) / base_price) * 100, 3) if base_price else 0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            await websocket.send_json(payload)
            await asyncio.sleep(1.5)  # 1.5s tick interval

    except WebSocketDisconnect:
        manager.disconnect(channel_key, websocket)
    except Exception:
        manager.disconnect(channel_key, websocket)


@router.websocket("/candles/{ticker}")
async def websocket_candle_stream(
    websocket: WebSocket,
    ticker: str,
    interval: str = Query("1d", description="Timeframe: 1m, 5m, 15m, 1h, 4h, 1d"),
):
    """
    Stream live OHLCV candlestick data for real-time charting.

    Protocol:
      1. Server sends { "type": "init", "candles": [...], "symbol": "...", "interval": "..." }
         with the last ~50 candles of history.
      2. Server sends periodic { "type": "tick", "time": ..., "price": ... } for the
         current open candle, allowing the frontend to update the latest bar in-place.
      3. When a candle period closes, server sends
         { "type": "candle", "candle": { "time", "open", "high", "low", "close" } }
         and starts a new candle.
    """
    ticker_upper = ticker.upper()
    interval_lower = interval.lower()
    channel_key = f"candle:{ticker_upper}:{interval_lower}"
    await manager.connect(channel_key, websocket)

    interval_secs = _interval_to_seconds(interval_lower)

    try:
        # --- Phase 1: Send initial history ---
        history = _get_history_candles(ticker_upper, interval_lower, period="5d")
        # Trim to last 50 candles
        if len(history) > 50:
            history = history[-50:]

        await websocket.send_json({
            "type": "init",
            "symbol": ticker_upper,
            "interval": interval_lower,
            "candles": history,
        })

        # --- Phase 2: Enter live tick loop ---
        current_candle_time: Optional[int] = None

        while True:
            quote = _get_live_quote(ticker_upper)

            if quote and quote.get("price"):
                price = float(quote["price"])
                now_ts = int(time.time())
                # Determine candle start time by flooring to the interval
                candle_start = (now_ts // interval_secs) * interval_secs

                if current_candle_time is None:
                    current_candle_time = candle_start

                if candle_start == current_candle_time:
                    # Same candle — send tick update
                    await websocket.send_json({
                        "type": "tick",
                        "time": now_ts,
                        "price": price,
                        "candle_time": candle_start,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                elif candle_start > current_candle_time:
                    # New candle period started — finalize previous, start new
                    # We don't have the full OHLC for the completed candle here;
                    # the frontend already has it from accumulated ticks.
                    # Signal the new candle time.
                    current_candle_time = candle_start
                    await websocket.send_json({
                        "type": "candle_new_period",
                        "candle_time": candle_start,
                        "price": price,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                # If candle_start < current_candle_time, it's a delayed quote — skip

            # Tick interval scales with timeframe
            if interval_secs <= 60:        # 1m
                tick_delay = 2.0
            elif interval_secs <= 300:     # 5m
                tick_delay = 5.0
            elif interval_secs <= 3600:    # 1h
                tick_delay = 15.0
            else:                           # 1d+
                tick_delay = 30.0

            await asyncio.sleep(tick_delay)

    except WebSocketDisconnect:
        manager.disconnect(channel_key, websocket)
    except Exception:
        manager.disconnect(channel_key, websocket)
