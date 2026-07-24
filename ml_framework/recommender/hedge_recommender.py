"""
ml_framework/recommender/hedge_recommender.py
Risk-Hedging Recommender identifying negatively correlated assets to balance active portfolio exposure.
"""

import logging
from typing import List, Dict, Any
import numpy as np
import pandas as pd

logger = logging.getLogger("hedge_recommender")

# Negative correlation mapping matrix (e.g. Gold & USD, Equities & Gold)
_CORRELATION_MAP = {
    "SPY": {"GOLD": -0.65, "EURUSD": -0.45, "TLT": -0.70},
    "QQQ": {"GOLD": -0.60, "EURUSD": -0.40, "BTC": 0.55},
    "AAPL": {"GOLD": -0.55, "EURUSD": -0.35},
    "NVDA": {"GOLD": -0.50, "EURUSD": -0.30},
    "BTC": {"GOLD": -0.35, "EURUSD": 0.20},
    "EURUSD": {"GOLD": 0.45, "SPY": -0.45},
    "GOLD": {"SPY": -0.65, "QQQ": -0.60, "USD": -0.85}
}

class HedgeRecommender:
    """Identifies negatively correlated assets to hedge concentration risk in active portfolio positions."""

    def recommend_hedges(self, open_positions: List[Dict[str, Any]], top_n: int = 2) -> List[Dict[str, Any]]:
        if not open_positions:
            return []

        active_tickers = [p.get("ticker", "").upper() for p in open_positions if p.get("status") == "open"]
        if not active_tickers:
            return []

        hedge_scores = {}
        for ticker in active_tickers:
            corrs = _CORRELATION_MAP.get(ticker, {"GOLD": -0.60, "EURUSD": -0.40})
            for hedge_asset, corr in corrs.items():
                if hedge_asset not in active_tickers:
                    if corr < 0: # Inverse correlation
                        weight = abs(corr) * 100.0
                        hedge_scores[hedge_asset] = max(hedge_scores.get(hedge_asset, 0), weight)

        results = []
        for hedge_asset, score in hedge_scores.items():
            results.append({
                "ticker": hedge_asset,
                "match_score_pct": round(score, 1),
                "reason": f"Risk Hedge: Negatively correlated to your active positions ({', '.join(active_tickers)}).",
                "recommendation_type": "portfolio_hedge"
            })

        results = sorted(results, key=lambda x: x["match_score_pct"], reverse=True)
        return results[:top_n]
