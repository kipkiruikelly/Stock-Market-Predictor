"""
predictor.py — Backward-compatibility shim.

All logic has been extracted to engines/prediction/.
This file re-exports the public API so existing callers continue to work
without any changes.

To use the new modular interface directly:
    from engines.prediction import run_prediction, ml_signal, build_features
"""

# Public API — re-exported from the new engine package
from engines.prediction.core import (          # noqa: F401
    run_prediction,
    ml_signal,
    build_features,
    available_models,
    get_news_sentiment,
    lw_time,
    _load_models,
    _infer_model,
    _build_pro_features,
    _compute_pro_features,
    _fetch_df,
    _fetch_aux,
)

# Symbol maps and constants — consumed by backtester.py, mt5_trading.py, etc.
from engines.prediction.symbol_map import (    # noqa: F401
    YF_SYMBOL_MAP,
    TICKER_SECTOR_MAP as _TICKER_SECTOR_MAP,
    EQUITY_TICKERS as _EQUITY_TICKERS,
    AUX_COLS as _AUX_COLS,
    FETCH_PERIOD as _FETCH_PERIOD,
    INTERVAL_ORDER as _INTERVAL_ORDER,
)

# Module-level constants kept for any code that reads them directly
import os
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "Saved Models")