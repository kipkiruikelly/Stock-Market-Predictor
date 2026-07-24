"""
ml_framework/features/importance.py
Permutation Feature Importance Engine identifying key technical indicators driving predictions.
"""

import logging
from typing import List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.inspection import permutation_importance

logger = logging.getLogger("feature_importance")

def compute_feature_importance(model: Any, X_val: np.ndarray, y_val: np.ndarray, feature_names: List[str], top_n: int = 10) -> pd.DataFrame:
    """Computes Permutation Feature Importance on validation set to identify top predictive indicators."""
    try:
        perm_res = permutation_importance(
            model, X_val, y_val,
            scoring="neg_mean_squared_error",
            n_repeats=5,
            random_state=42,
            n_jobs=-1
        )
        
        importance_df = pd.DataFrame({
            "Feature": feature_names,
            "Importance Score": perm_res.importances_mean,
            "Std Dev": perm_res.importances_std
        }).sort_values(by="Importance Score", ascending=False).head(top_n)

        # Normalize importance scores for clear visualization
        total_imp = importance_df["Importance Score"].sum()
        if total_imp > 0:
            importance_df["Relative Weight (%)"] = (importance_df["Importance Score"] / total_imp * 100.0).round(2)
        else:
            importance_df["Relative Weight (%)"] = 0.0

        return importance_df
    except Exception as exc:
        logger.warning("Permutation feature importance calculation fallback: %s", exc)
        return pd.DataFrame()
