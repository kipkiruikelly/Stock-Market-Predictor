"""
engines/market_data/normalizer.py
Normalization utilities for raw market data.

- Ensures all timestamps are UTC timezone-aware datetime objects.
- Validates OHLCV field constraints.
- Classifies data freshness.
- Computes bid-ask spread.
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional

import pandas as pd

from engines.market_data.interface import MarketBar, Quote, DataFreshness

logger = logging.getLogger(__name__)


def _ensure_utc(dt: datetime) -> datetime:
    """Return a UTC-aware datetime regardless of input timezone."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def normalize_bars(
    df: pd.DataFrame,
    symbol: str,
    interval: str,
    freshness: DataFreshness,
    source: str = "unknown",
) -> List[MarketBar]:
    """
    Convert a yfinance-style DataFrame into a list of validated MarketBar objects.

    Args:
        df: DataFrame with columns Open/High/Low/Close/Volume and DatetimeIndex.
        symbol: Ticker symbol.
        interval: Candle interval string.
        freshness: Data freshness tag.
        source: Provider name.

    Returns:
        List of valid MarketBar objects (invalid rows are dropped with a warning).
    """
    bars: List[MarketBar] = []
    for ts, row in df.iterrows():
        try:
            dt = ts.to_pydatetime() if hasattr(ts, "to_pydatetime") else ts
            dt = _ensure_utc(dt)

            bar = MarketBar(
                timestamp = dt,
                symbol    = symbol.upper(),
                interval  = interval,
                open      = float(row.get("Open",  row.get("open",  0))),
                high      = float(row.get("High",  row.get("high",  0))),
                low       = float(row.get("Low",   row.get("low",   0))),
                close     = float(row.get("Close", row.get("close", 0))),
                volume    = float(row.get("Volume",row.get("volume",0))),
                freshness = freshness,
                source    = source,
            )
            if not bar.is_valid():
                logger.warning("Dropping invalid bar for %s at %s", symbol, dt)
                continue
            bars.append(bar)
        except Exception as exc:
            logger.warning("Failed to normalise row for %s: %s", symbol, exc)
    return bars


def normalize_quote(
    raw: dict,
    symbol: str,
    freshness: DataFreshness,
    source: str = "unknown",
) -> Quote:
    """
    Convert a raw quote dict (from yfinance or Finnhub) into a typed Quote.

    Args:
        raw: Dict with keys: price, prev, chg, pct (yfinance get_quote format).
        symbol: Ticker.
        freshness: Data freshness tag.
        source: Provider name.

    Returns:
        Typed Quote object.
    """
    price = float(raw.get("price", 0) or 0)
    prev  = raw.get("prev") or raw.get("prev_close")
    chg   = raw.get("chg")  or raw.get("change")
    pct   = raw.get("pct")  or raw.get("change_pct")

    return Quote(
        symbol      = symbol.upper(),
        price       = price,
        prev_close  = float(prev) if prev is not None else None,
        change      = float(chg)  if chg  is not None else None,
        change_pct  = float(pct)  if pct  is not None else None,
        freshness   = freshness,
        source      = source,
        verified    = raw.get("verified", False),
        divergence_pct = raw.get("divergence_pct"),
        as_of       = datetime.now(timezone.utc),
    )
