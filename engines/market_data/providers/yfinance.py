"""
engines/market_data/providers/yfinance.py
YFinance + Pyth + Finnhub market data provider.

Wraps the existing market_data module (which handles TTL caching, circuit
breakers, and Pyth cross-verification) and returns typed objects.
"""

import logging
from datetime import datetime, timezone
from typing import List, Tuple

from engines.market_data.interface import (
    MarketBar, Quote, DataFreshness, MarketDataError, MarketDataProvider
)
from engines.market_data.normalizer import normalize_bars, normalize_quote

logger = logging.getLogger(__name__)


class YFinanceProvider(MarketDataProvider):
    """
    Market data from yfinance with Pyth/Finnhub cross-verification.
    Uses market_data.get_history() and get_quote() which handle:
      - TTL caching (interval-aware)
      - Rate-limit circuit breaker
      - Stale-while-error fallback
    """

    @property
    def provider_name(self) -> str:
        return "yfinance+pyth"

    def get_bars(
        self,
        symbol: str,
        period: str = "1y",
        interval: str = "1d",
    ) -> Tuple[List[MarketBar], DataFreshness]:
        """
        Fetch historical bars for a symbol.

        Returns:
            (bars, freshness) — bars is a list of MarketBar, freshness indicates
            whether data is live, stale, or synthetic.

        Raises:
            MarketDataError: If no data is available from any source.
        """
        try:
            from market_data import get_history
            df, meta = get_history(symbol, period=period, interval=interval)
        except Exception as exc:
            raise MarketDataError(
                f"Failed to fetch bars for {symbol}/{interval}: {exc}"
            ) from exc

        # Map meta tags to DataFreshness enum
        source_str = meta.get("source", "unknown")
        synthetic  = meta.get("synthetic", False)
        stale      = meta.get("stale", False)
        freshness_str = meta.get("freshness", "")

        if freshness_str == "synthetic" or synthetic:
            freshness = DataFreshness.SYNTHETIC
        elif freshness_str == "stale" or stale:
            freshness = DataFreshness.STALE
        elif freshness_str == "live" or source_str == "live":
            freshness = DataFreshness.LIVE
        else:
            freshness = DataFreshness.STALE  # conservative default

        if df is None or df.empty:
            raise MarketDataError(f"Empty DataFrame returned for {symbol}/{interval}")

        bars = normalize_bars(df, symbol, interval, freshness, source=self.provider_name)
        if not bars:
            raise MarketDataError(f"All bars invalid after normalisation for {symbol}")

        return bars, freshness

    def get_quote(self, symbol: str) -> Quote:
        """
        Fetch a live quote, using Pyth/Finnhub for cross-verification.

        Raises:
            MarketDataError: If no quote is available.
        """
        try:
            from market_data import get_quotes_verified
            results = get_quotes_verified([symbol])
            raw = results.get(symbol.upper())
        except Exception as exc:
            raise MarketDataError(f"Quote fetch failed for {symbol}: {exc}") from exc

        if raw is None:
            raise MarketDataError(f"No quote data available for {symbol}")

        synthetic = raw.get("synthetic", False)
        freshness = DataFreshness.SYNTHETIC if synthetic else DataFreshness.LIVE

        return normalize_quote(raw, symbol, freshness, source=self.provider_name)
