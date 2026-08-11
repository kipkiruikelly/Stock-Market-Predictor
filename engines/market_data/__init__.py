"""
engines/market_data/
Market data abstraction layer.

The prediction engine and signal generator must obtain data through this
package — they must NOT import yfinance, MT5, or finnhub directly.

Public API:
    from engines.market_data import (
        get_bars, get_quote, MarketBar, Quote, DataFreshness
    )
"""

from engines.market_data.interface import (
    MarketBar, Quote, DataFreshness, MarketDataError, MarketDataProvider
)
from engines.market_data.normalizer import normalize_bars, normalize_quote
from engines.market_data.providers.yfinance import YFinanceProvider

# Default provider
_default_provider = YFinanceProvider()


def get_bars(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
    provider: MarketDataProvider = None,
) -> tuple:  # (list[MarketBar], DataFreshness)
    p = provider or _default_provider
    return p.get_bars(symbol, period=period, interval=interval)


def get_quote(
    symbol: str,
    provider: MarketDataProvider = None,
) -> Quote:
    p = provider or _default_provider
    return p.get_quote(symbol)


__all__ = [
    "MarketBar", "Quote", "DataFreshness", "MarketDataError",
    "MarketDataProvider", "get_bars", "get_quote",
    "normalize_bars", "normalize_quote",
    "YFinanceProvider",
]
