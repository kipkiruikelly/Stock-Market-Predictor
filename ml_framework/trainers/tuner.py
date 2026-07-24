"""
ml_framework/trainers/tuner.py
Automated Hyperparameter Tuning via RandomizedSearchCV and TimeSeriesSplit Cross-Validation.
"""

import logging
from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV
from sklearn.linear_model import Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor

logger = logging.getLogger("ml_tuner")

def get_param_grid(model_type: str) -> Dict[str, Any]:
    """Returns hyperparameter search spaces for supported regression models."""
    if model_type in ["ridge", "linear_regression"]:
        return {
            "alpha": [0.01, 0.1, 1.0, 10.0, 100.0]
        }
    elif model_type == "lasso":
        return {
            "alpha": [0.001, 0.01, 0.1, 1.0]
        }
    elif model_type == "random_forest":
        return {
            "n_estimators": [50, 100, 150],
            "max_depth": [5, 10, 15, None],
            "min_samples_split": [2, 5, 10],
            "min_samples_leaf": [1, 2, 4],
            "max_features": ["sqrt", "log2", None]
        }
    elif model_type == "xgboost":
        return {
            "n_estimators": [50, 100, 150],
            "max_depth": [3, 5, 7],
            "learning_rate": [0.01, 0.05, 0.1],
            "subsample": [0.7, 0.8, 1.0],
            "colsample_bytree": [0.7, 0.8, 1.0]
        }
    return {}

def tune_hyperparameters(model_type: str, X: np.ndarray, y: np.ndarray, cv_splits: int = 5, n_iter: int = 6) -> Tuple[Any, Dict[str, Any]]:
    """Executes RandomizedSearchCV with TimeSeriesSplit cross-validation."""
    param_grid = get_param_grid(model_type)
    tscv = TimeSeriesSplit(n_splits=min(cv_splits, max(2, len(X) // 100)))

    # Instantiate base model
    if model_type in ["ridge", "linear_regression"]:
        base_model = Ridge()
    elif model_type == "lasso":
        base_model = Lasso()
    elif model_type == "random_forest":
        base_model = RandomForestRegressor(random_state=42, n_jobs=-1)
    elif model_type == "xgboost":
        try:
            from xgboost import XGBRegressor
            base_model = XGBRegressor(random_state=42, n_jobs=-1)
        except ImportError:
            base_model = RandomForestRegressor(random_state=42, n_jobs=-1)
    else:
        base_model = RandomForestRegressor(random_state=42, n_jobs=-1)

    if not param_grid:
        base_model.fit(X, y)
        return base_model, {}

    try:
        search = RandomizedSearchCV(
            estimator=base_model,
            param_distributions=param_grid,
            n_iter=min(n_iter, max(1, len(param_grid))),
            cv=tscv,
            scoring="neg_root_mean_squared_error",
            random_state=42,
            n_jobs=-1
        )
        search.fit(X, y)
        logger.info("Tuned hyperparameters for %s: %s", model_type, search.best_params_)
        return search.best_estimator_, search.best_params_
    except Exception as exc:
        logger.warning("Hyperparameter tuning fallback for %s: %s", model_type, exc)
        base_model.fit(X, y)
        return base_model, {}
