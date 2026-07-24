"""
ml_framework/recommender/content_recommender.py
Content-Based Cosine Similarity Recommender matching market asset feature vectors to trader preferences.
"""

import logging
from typing import List, Dict, Any
import numpy as np
import pandas as pd

logger = logging.getLogger("content_recommender")

def _pure_cosine_similarity(vec_a: np.ndarray, matrix_b: np.ndarray) -> np.ndarray:
    """Computes pure NumPy cosine similarity between 1D vector and 2D matrix."""
    dot_product = np.dot(matrix_b, vec_a.T).flatten()
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(matrix_b, axis=1)

    denom = norm_a * norm_b
    denom[denom == 0] = 1e-9
    return dot_product / denom

class ContentRecommender:
    """Computes Cosine Similarity between live asset technical vectors and a trader's preference profile."""

    def recommend(self, user_profile: Dict[str, Any], market_features_df: pd.DataFrame, top_n: int = 5) -> List[Dict[str, Any]]:
        if market_features_df.empty:
            return []

        # Target feature vector template (e.g. RSI, Volatility, Order Block strength)
        numeric_cols = [c for c in market_features_df.columns if pd.api.types.is_numeric_dtype(market_features_df[c])]
        if not numeric_cols:
            return []

        # Construct trader ideal setup vector based on trading style
        style = user_profile.get("trading_style", "algo_trader")
        ideal_vector = np.zeros((1, len(numeric_cols)))

        # Fill feature weights according to style (e.g. scalpers favor high volatility; swing traders favor order blocks)
        for idx, col in enumerate(numeric_cols):
            col_lower = col.lower()
            if "rsi" in col_lower:
                ideal_vector[0, idx] = 30.0 if style == "scalper" else 50.0
            elif "ob" in col_lower or "block" in col_lower:
                ideal_vector[0, idx] = 2.0
            elif "vol" in col_lower or "atr" in col_lower:
                ideal_vector[0, idx] = 1.5 if style == "scalper" else 0.8
            else:
                ideal_vector[0, idx] = float(market_features_df[col].mean() or 0.0)

        # Normalize matrix & calculate Cosine Similarity
        matrix = market_features_df[numeric_cols].fillna(0.0).values
        sim_scores = _pure_cosine_similarity(ideal_vector, matrix)

        results = []
        for idx, score in enumerate(sim_scores):
            ticker = str(market_features_df.index[idx]).upper()
            match_pct = float(np.clip(score * 100.0, 40.0, 98.5))
            results.append({
                "ticker": ticker,
                "match_score_pct": round(match_pct, 1),
                "reason": f"Matches {style} technical setup & volatility profile.",
                "recommendation_type": "content_match"
            })

        results = sorted(results, key=lambda x: x["match_score_pct"], reverse=True)
        return results[:top_n]
