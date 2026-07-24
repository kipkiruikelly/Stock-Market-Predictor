"""
django_backend/trading/scheduler.py
Nightly 00:00 (Midnight UTC) Automated Model Retraining Scheduler.

Downloads market data for all supported tickers across all timeframes
(1d, 1h, 4h, 1w, 30m, 15m, 5m) and retrains every individual model
for each individual asset.
"""

import os
import sys
import time
import logging
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path

logger = logging.getLogger("nightly_retrain")

_PARENT_DIR = str(Path(__file__).resolve().parent.parent.parent)
_TRAINING_DIR = os.path.join(_PARENT_DIR, "src", "training")
if _TRAINING_DIR not in sys.path:
    sys.path.insert(0, _TRAINING_DIR)
if _PARENT_DIR not in sys.path:
    sys.path.insert(0, _PARENT_DIR)

_SCHEDULER_STARTED = False
_SCHEDULER_LOCK = threading.Lock()


def run_universe_retraining(timeframes=None, tickers=None, workers=4):
    """Executes the full data fetch, feature engineering & model retraining pipeline."""
    logger.info("Starting nightly automated universe retraining at %s", datetime.now(timezone.utc).isoformat())
    start_time = time.time()
    
    try:
        import train_universe as tu
        
        tf_list = timeframes or tu.DEFAULT_TFS
        
        # Execute retraining run
        manifest = tu._load_manifest()
        
        if hasattr(tu, "run_retrain_job"):
            manifest = tu.run_retrain_job(timeframes=tf_list, tickers=tickers, workers=workers)
        else:
            # Import train_all_tickers orchestrator
            import train_all_tickers as T
            
            ticker_list = tickers or T.DEFAULT_TICKERS
            for tf in tf_list:
                logger.info("Retraining universe for timeframe: %s", tf)
                try:
                    T.run_pipeline_for_all(tickers=ticker_list, interval=tf, max_workers=workers)
                except Exception as e:
                    logger.error("Failed retraining for timeframe %s: %s", tf, e)

        duration = round(time.time() - start_time, 2)
        logger.info("Nightly universe retraining finished in %s seconds.", duration)
        return {"ok": True, "duration_seconds": duration}
    
    except Exception as exc:
        logger.exception("Error during nightly universe retraining: %s", exc)
        return {"ok": False, "error": str(exc)}


def _nightly_worker_loop():
    """Background loop that waits until 00:00:00 UTC every day to execute retraining."""
    logger.info("Nightly retraining background worker initialized.")
    
    while True:
        try:
            now = datetime.now(timezone.utc)
            # Calculate next midnight (00:00:00 UTC)
            tomorrow = now.date() + timedelta(days=1)
            next_midnight = datetime.combine(tomorrow, datetime.min.time(), tzinfo=timezone.utc)
            sleep_seconds = (next_midnight - now).total_seconds()
            
            logger.info("Next automated retraining scheduled in %.1f seconds (at %s UTC).", sleep_seconds, next_midnight.isoformat())
            time.sleep(max(sleep_seconds, 10))
            
            # Trigger nightly retraining
            run_universe_retraining()
            
        except Exception as e:
            logger.error("Nightly worker loop encountered error: %s. Retrying in 60s...", e)
            time.sleep(60)


def start_nightly_scheduler():
    """Starts the background thread if not already running."""
    global _SCHEDULER_STARTED
    with _SCHEDULER_LOCK:
        if _SCHEDULER_STARTED:
            return
        
        # Avoid running worker during manage.py commands (migrate, collectstatic, check)
        if any(cmd in sys.argv for cmd in ["migrate", "collectstatic", "check", "make_migrations", "test"]):
            return

        _SCHEDULER_STARTED = True
        thread = threading.Thread(target=_nightly_worker_loop, daemon=True, name="NightlyRetrainThread")
        thread.start()
        logger.info("Nightly retraining thread started successfully.")
