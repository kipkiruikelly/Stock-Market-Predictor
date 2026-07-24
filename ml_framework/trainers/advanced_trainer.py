"""
ml_framework/trainers/advanced_trainer.py
Integrated Trainer Orchestrating Multi-Model Regression, Hyperparameter Tuning, CV, Leaderboards, and Importance.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from ml_framework.base import BaseModelTrainer
from ml_framework.trainers.tuner import tune_hyperparameters
from ml_framework.trainers.evaluator import evaluate_models
from ml_framework.features.importance import compute_feature_importance

class AdvancedModelTrainer(BaseModelTrainer):
    """Advanced trainer supporting multi-model regression, hyper-tuning, CV, leaderboards, and feature importance."""

    def train(self, df: pd.DataFrame, features: List[str], target_col: str, **kwargs) -> Dict[str, Any]:
        available_features = [f for f in features if f in df.columns]
        if not available_features:
            raise ValueError("No matching feature columns found in dataset.")

        # Clean non-finite target rows
        clean_df = df.dropna(subset=[target_col] + available_features)
        X = clean_df[available_features].values
        y = clean_df[target_col].values

        # Chronological Time-Series Split (80% Train, 20% Out-of-Sample Validation)
        split_idx = int(len(X) * 0.8)
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]

        models = {}
        best_params = {}

        # 1. Ridge Regression (Linear Regularized)
        ridge_model, ridge_params = tune_hyperparameters("ridge", X_train, y_train)
        models["ridge"] = ridge_model
        best_params["ridge"] = ridge_params

        # 2. Random Forest Regressor
        rf_model, rf_params = tune_hyperparameters("random_forest", X_train, y_train)
        models["random_forest"] = rf_model
        best_params["random_forest"] = rf_params

        # 3. XGBoost Regressor (Gradient Boosting)
        xgb_model, xgb_params = tune_hyperparameters("xgboost", X_train, y_train)
        models["xgboost"] = xgb_model
        best_params["xgboost"] = xgb_params

        # 4. Out-of-sample Leaderboard Evaluation
        leaderboard_df = evaluate_models(models, X_val, y_val)

        # 5. Top Model Feature Importance Analysis
        best_model_name = leaderboard_df.iloc[0]["Model"] if not leaderboard_df.empty else "random_forest"
        top_model = models.get(best_model_name, rf_model)
        importance_df = compute_feature_importance(top_model, X_val, y_val, available_features)

        return {
            "models": models,
            "best_params": best_params,
            "leaderboard": leaderboard_df,
            "feature_importance": importance_df,
            "best_model_name": best_model_name
        }
