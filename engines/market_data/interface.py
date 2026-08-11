"""
engines/market_data/interface.py
Abstract base class and typed data models for the market data layer.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Tuple


class DataFreshness(Enum):
    LIVE      = "live"       # fetched from provider within TTL
    STALE     = "stale"      # from cache, provider was down
    SYNTHETIC = "synthetic"  # randomly generated — NEVER use for trading
    UNAVAILABLE = "unavailable"  # no data at all


class MarketDataError(Exception):
    """Raised when market data cannot be obtained from any source."""


@dataclass
class MarketBar:
    """A single OHLCV candle, fully normalised."""
    timestamp: datetime          # always UTC, timezone-aware
    symbol: str
    interval: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    freshness: DataFreshness = DataFreshness.LIVE
    source: str = "unknown"

    def is_valid(self) -> bool:
        return (
            self.open > 0
            and self.high >= self.open
            and self.low <= self.open
            and self.close > 0
            and self.volume >= 0
        )


@dataclass
class Quote:
    """Live bid/ask/last quote for a symbol."""
    symbol: str
    price: float
    prev_close: Optional[float] = None
    change: Optional[float] = None
    change_pct: Optional[float] = None
    bid: Optional[float] = None
    ask: Optional[float] = None
    spread: Optional[float] = None
    volume: Optional[float] = None
    as_of: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    freshness: DataFreshness = DataFreshness.LIVE
    source: str = "unknown"
    verified: bool = False
    divergence_pct: Optional[float] = None

    def is_synthetic(self) -> bool:
        return self.freshness == DataFreshness.SYNTHETIC


class MarketDataProvider(ABC):
    """Abstract base for all market data providers."""

    @abstractmethod
    def get_bars(
        self,
        symbol: str,
        period: str = "1y",
        interval: str = "1d",
    ) -> Tuple[List[MarketBar], DataFreshness]:
        """Return (bars, freshness). Never returns synthetic data silently."""
        ...

    @abstractmethod
    def get_quote(self, symbol: str) -> Quote:
        """Return a live quote. Raises MarketDataError if unavailable."""
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...
