import os
import sys
import logging
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from django.core.management.base import BaseCommand
from django.core.cache import cache

from core.utils import SCREENER_TICKERS, ASSET_CLASSES_TICKERS

_PARENT_DIR = str(Path(__file__).resolve().parent.parent.parent.parent.parent)
if _PARENT_DIR not in sys.path:
    sys.path.insert(0, _PARENT_DIR)

from predictor import ml_signal
from trading.extra_views import _get_ticker_asset_class

logger = logging.getLogger("screener_cache")

class Command(BaseCommand):
    help = 'Runs ML inference for all screener tickers and caches the results'

    def handle(self, *args, **options):
        self.stdout.write("Starting Screener ML inference caching...")
        
        tickers = SCREENER_TICKERS
        
        def _scan(ticker):
            try:
                # Use predictor.py to get actual ML signals
                # ml_signal runs the Random Forest / XGBoost models internally
                res = ml_signal(ticker, "1d")
                
                # Format to match the screener's expected output
                return {
                    "ticker":        ticker,
                    "asset_class":   _get_ticker_asset_class(ticker),
                    "action":        res.get("action", "HOLD"),
                    "price":         res.get("current_price", 100.0),
                    "ai_score":      res.get("ai_score", 5),
                    "alpha_signals": res.get("alpha_signals", []),
                    "lr_pred":       res.get("lr_pred", 100.0),
                    "confidence":    res.get("confidence", 50.0),
                    "rsi":           res.get("rsi", 50.0),
                    "macd_hist":     res.get("macd_hist", 0.0),
                    "atr":           res.get("atr", 1.5),
                }
            except Exception as e:
                logger.error(f"Failed to scan {ticker}: {e}")
                return {
                    "ticker": ticker, 
                    "asset_class": _get_ticker_asset_class(ticker), 
                    "action": "HOLD", 
                    "price": 100.0, 
                    "ai_score": 5,
                    "alpha_signals": ["Error Computing ML"], 
                    "lr_pred": 100.0, 
                    "confidence": 0.0,
                    "rsi": 50.0, 
                    "macd_hist": 0.0, 
                    "atr": 1.5
                }
                
        # Limit concurrency so we don't blow up the machine with XGBoost instances
        with ThreadPoolExecutor(max_workers=4) as ex:
            rows = list(ex.map(_scan, tickers))
            
        rows.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Save to Django Cache (expires in 1.5 hours)
        cache.set("screener_ml_results", rows, timeout=5400)
        self.stdout.write(self.style.SUCCESS(f"Successfully cached ML screener results for {len(rows)} tickers."))
