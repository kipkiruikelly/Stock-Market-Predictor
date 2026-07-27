"""
django_backend/trading/celery_tasks.py
Celery Background Tasks for 15-Minute Market Scanner and Midnight Universe Retraining.
"""

import sys
import logging
from pathlib import Path
from celery import shared_task

logger = logging.getLogger("celery_tasks")

_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

@shared_task(name="trading.run_celery_market_scanner")
def run_celery_market_scanner():
    """Background Celery task that executes 15-minute stateful market scan."""
    logger.info("Celery Worker -> Triggering 15-minute stateful market scan...")
    from trading.background_scanner import run_market_scan_cycle
    return run_market_scan_cycle()

@shared_task(name="trading.run_celery_midnight_retraining")
def run_celery_midnight_retraining():
    """Background Celery task that executes midnight universe model retraining."""
    logger.info("Celery Worker -> Triggering midnight universe model retraining...")
    from src.training.train_universe import main as train_universe_main
    train_universe_main()
    return {"status": "SUCCESS", "message": "Universe retraining completed via Celery worker."}


@shared_task(name="trading.run_celery_walk_forward_retraining")
def run_celery_walk_forward_retraining():
    """Background Celery task that executes walk-forward retraining and registers the version metrics."""
    logger.info("Celery Worker -> Triggering automated walk-forward retraining loop...")
    from walk_forward import walk_forward_analysis
    from trading.mlops_service import register_model_version, record_model_evaluation
    import datetime

    tickers = ["QQQ", "SPY", "AAPL"]
    results = {}

    for ticker in tickers:
        try:
            logger.info("Running walk-forward analysis for %s...", ticker)
            wf_res = walk_forward_analysis(ticker=ticker, n_folds=5)

            # Register version and evaluation metrics
            version_str = f"wf_auto_{datetime.date.today().strftime('%Y%m%d')}"
            mv = register_model_version(
                ticker=ticker,
                model_type="walk_forward",
                version=version_str,
                file_path=f"Saved Models/{ticker}_wf_robust.pkl"
            )

            # Record aggregate walk-forward metrics mapped to evaluation fields
            record_model_evaluation(
                model_version=mv,
                mae=0.0,
                mse=float(wf_res.avg_max_dd),
                rmse=float(wf_res.avg_sortino),
                r2_score=float(wf_res.avg_sharpe),
                directional_accuracy_pct=float(wf_res.avg_win_rate * 100.0)
            )

            results[ticker] = {
                "status": "SUCCESS",
                "avg_return": float(wf_res.avg_return),
                "avg_sharpe": float(wf_res.avg_sharpe),
                "is_robust": bool(wf_res.is_robust)
            }
        except Exception as e:
            logger.error("Failed walk-forward retraining for %s: %s", ticker, str(e))
            results[ticker] = {"status": "FAILED", "error": str(e)}

    return {"status": "COMPLETED", "results": results}

