"""
django_backend/trading/mlops_service.py
MLOps Service for Model Versioning, Metric Logging (MAE, MSE, RMSE, R^2), and Active Model Resolution.
"""

import logging
from typing import Optional, Dict, Any
from users.models import ModelVersion, ModelEvaluation, UploadedDataset, DatasetProperty

logger = logging.getLogger("mlops_service")

def register_model_version(ticker: str, model_type: str, version: str, file_path: str) -> ModelVersion:
    """Registers or updates a ModelVersion in the database model registry."""
    mv, created = ModelVersion.objects.get_or_create(
        ticker=ticker.upper().strip(),
        model_type=model_type.lower().strip(),
        version=version.strip(),
        defaults={
            "file_path": file_path,
            "is_active": True,
        }
    )
    if not created:
        mv.file_path = file_path
        mv.is_active = True
        mv.save(update_fields=["file_path", "is_active"])

    logger.info("Registered ModelVersion %s for %s (%s)", version, ticker, model_type)
    return mv

def record_model_evaluation(model_version: ModelVersion, mae: float, mse: float, rmse: float, r2_score: float, directional_accuracy_pct: float) -> ModelEvaluation:
    """Logs model performance metrics (MAE, MSE, RMSE, R^2, Directional Accuracy %)."""
    eval_obj = ModelEvaluation.objects.create(
        model_version=model_version,
        mae=float(mae),
        mse=float(mse),
        rmse=float(rmse),
        r2_score=float(r2_score),
        directional_accuracy_pct=float(directional_accuracy_pct)
    )
    logger.info("Recorded evaluation for %s: R2=%.4f, RMSE=%.6f, Acc=%.2f%%", model_version.version, r2_score, rmse, directional_accuracy_pct)
    return eval_obj

def get_active_model_evaluation(ticker: str, model_type: str = "rf") -> Optional[Dict[str, Any]]:
    """Retrieves the active ModelVersion and its latest ModelEvaluation metrics."""
    mv = ModelVersion.objects.filter(ticker=ticker.upper().strip(), model_type=model_type, is_active=True).order_by("-trained_at").first()
    if not mv:
        return None

    latest_eval = mv.evaluations.order_by("-evaluated_at").first()
    return {
        "model_version": mv.version,
        "ticker": mv.ticker,
        "model_type": mv.model_type,
        "file_path": mv.file_path,
        "evaluation": {
            "mae": latest_eval.mae if latest_eval else 0.0,
            "mse": latest_eval.mse if latest_eval else 0.0,
            "rmse": latest_eval.rmse if latest_eval else 0.0,
            "r2_score": latest_eval.r2_score if latest_eval else 0.0,
            "directional_accuracy_pct": latest_eval.directional_accuracy_pct if latest_eval else 50.0,
        } if latest_eval else None
    }
