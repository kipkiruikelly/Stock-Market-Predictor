"""
ml_framework/trainers/evaluator.py
Out-of-sample Model Comparison, Directional Accuracy, and Metrics Leaderboard Engine.
"""

import logging
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

logger = logging.getLogger("ml_evaluator")

def evaluate_models(models_dict: Dict[str, Any], X_val: np.ndarray, y_val: np.ndarray) -> pd.DataFrame:
    """Evaluates multiple trained models on out-of-sample validation data and ranks them in a Leaderboard."""
    results = []
    for name, model in models_dict.items():
        try:
            preds = model.predict(X_val)
            rmse = float(np.sqrt(mean_squared_error(y_val, preds)))
            mae = float(mean_absolute_error(y_val, preds))
            r2 = float(r2_score(y_val, preds))

            # Directional Accuracy: % of candles where predicted sign matches actual return sign
            dir_correct = np.sign(preds) == np.sign(y_val)
            dir_acc = float(np.mean(dir_correct) * 100.0)

            results.append({
                "Model": name,
                "Directional Acc (%)": round(dir_acc, 2),
                "RMSE": round(rmse, 6),
                "MAE": round(mae, 6),
                "R2 Score": round(r2, 4)
            })
        except Exception as exc:
            logger.error("Failed evaluation for model %s: %s", name, exc)

    if not results:
        return pd.DataFrame()

    df_res = pd.DataFrame(results).sort_values(by=["Directional Acc (%)", "RMSE"], ascending=[False, True])
    return df_res
