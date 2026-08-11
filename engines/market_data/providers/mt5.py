"""
engines/market_data/providers/mt5.py
MT5-native market data provider (when MT5 terminal is available).

This provider is only functional in environments where the MT5 Python
binding is installed (typically Windows). On Linux, it gracefully falls
back with a clear error.
"""

import logging
from typing import List, Tuple

from engines.market_data.interface import (
    MarketBar, Quote, DataFreshness, MarketDataError, MarketDataProvider
)

logger = logging.getLogger(__name__)


class MT5Provider(MarketDataProvider):
    """
    Live tick and OHLCV data directly from MetaTrader 5.
    Requires MT5 terminal to be running and connected.
    """

    @property
    def provider_name(self) -> str:
        return "mt5_native"

    def get_bars(
        self,
        symbol: str,
        period: str = "1y",
        interval: str = "1d",
    ) -> Tuple[List[MarketBar], DataFreshness]:
        raise MarketDataError(
            "MT5Provider.get_bars() is not yet fully implemented. "
            "Use YFinanceProvider for historical bars."
        )

    def get_quote(self, symbol: str) -> Quote:
        """
        Fetch the current bid/ask from the MT5 terminal.
        Only works when MetaTrader5 package is installed and connected.
        """
        try:
            import MetaTrader5 as mt5
        except ImportError:
            raise MarketDataError(
                "MetaTrader5 package not installed. "
                "MT5Provider is only available on Windows with MT5 terminal."
            )

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            raise MarketDataError(f"MT5 returned no tick for {symbol}")

        import pandas as pd
        from engines.market_data.normalizer import normalize_quote
        from datetime import datetime, timezone

        price = (tick.bid + tick.ask) / 2.0
        spread = round(tick.ask - tick.bid, 6)

        return Quote(
            symbol    = symbol.upper(),
            price     = round(price, 6),
            bid       = tick.bid,
            ask       = tick.ask,
            spread    = spread,
            freshness = DataFreshness.LIVE,
            source    = self.provider_name,
            as_of     = datetime.now(timezone.utc),
        )
