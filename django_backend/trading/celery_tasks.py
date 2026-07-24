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
