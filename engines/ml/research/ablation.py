import numpy as np
import pandas as pd
from typing import Dict, List, Any

class FeatureAblator:
    FEATURE_GROUPS = {
        "price_action": ["returns_1", "returns_5", "gk_vol", "atr_ratio"],
        "technical": ["rsi_z_score", "vwap_dist", "macd_hist_slope"],
        "market_structure": ["fvg_distance", "order_block_proximity"],
        "volume_flow": ["rvol", "obv_slope"],
        "macro": ["vix_chg", "dxy_chg"],
        "cross_asset": ["spy_corr", "qqq_corr"],
        "news_sentiment": ["sentiment_score"],
        "microstructure": ["effective_spread", "tick_intensity"],
        "all": []
    }

    def run_ablation_suite(self, X: pd.DataFrame, y: np.ndarray, trainer_fn) -> Dict[str, Any]:
        results = {}
        for group_name, cols in self.FEATURE_GROUPS.items():
            if group_name == "all":
                eval_cols = [c for c in X.columns if c in cols or len(cols) == 0]
            else:
                eval_cols = [c for c in cols if c in X.columns]
            
            if not eval_cols:
                results[group_name] = {"status": "SKIPPED_NO_COLS", "precision": 0.0}
                continue
                
            X_sub = X[eval_cols]
            metrics = trainer_fn(X_sub, y)
            results[group_name] = metrics
            
        return results
