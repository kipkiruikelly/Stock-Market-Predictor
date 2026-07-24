import pandas as pd
import yfinance as yf
from ml_framework.base import BaseConnector
from market_data import get_history

class YFinanceConnector(BaseConnector):
    """Yahoo Finance modular data ingestion connector."""
    
    def fetch_data(self, symbol: str, interval: str, **kwargs) -> pd.DataFrame:
        intraday_limits = {
            "1m": "7d",
            "5m": "60d",
            "15m": "60d",
            "30m": "60d",
            "1h": "730d",
            "4h": "730d",
        }
        period = kwargs.get("period")
        if not period or (interval in intraday_limits and period in ["1y", "18mo", "2y", "5y", "10y", "max", "ytd"]):
            period = intraday_limits.get(interval, "18mo" if interval == "1d" else "60d")
            
        # Clean symbol logic (handled inside database mapping/predictor files)
        clean_symbol = symbol.split(':').pop() if ':' in symbol else symbol
        
        # Call legacy safe downloader
        df, _ = get_history(clean_symbol, period=period, interval=interval)
        return df
