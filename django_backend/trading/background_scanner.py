"""
django_backend/trading/background_scanner.py
Scheduled 15-Minute Background Market Scanner (Option B).

Automatically scans market tickers every 15 minutes, runs stateful FSM
workflows, and executes risk-approved trades into user portfolios.
"""

import sys
import time
import logging
import threading
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("background_scanner")

_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

_SCANNER_RUNNING = False
_SCANNER_ENABLED = True
_SCANNER_LOCK = threading.Lock()

TARGET_TICKERS = ["QQQ", "SPY", "AAPL", "NVDA", "BTC", "EURUSD", "GOLD"]

def run_market_scan_cycle() -> dict:
    """Executes a single market scan cycle across all target tickers."""
    logger.info("Starting 15-minute autonomous market scan cycle at %s", datetime.now(timezone.utc).isoformat())
    start_time = time.time()
    
    from users.models import User
    from trading.state_machine import TradingWorkflow

    system_user = User.objects.filter(role="admin").first() or User.objects.first()
    results = []

    for ticker in TARGET_TICKERS:
        try:
            logger.info("Autonomous Scanner -> Executing stateful workflow for %s", ticker)
            workflow = TradingWorkflow(ticker=ticker, interval="1d", account_balance=10000.0, user=system_user)
            res = workflow.execute()
            results.append({"ticker": ticker, "state": res.get("state"), "reason": res.get("reason")})
        except Exception as err:
            logger.error("Scanner failed for ticker %s: %s", ticker, err)
            results.append({"ticker": ticker, "state": "FAILED", "error": str(err)})

    elapsed = round(time.time() - start_time, 2)
    logger.info("Market scan cycle finished in %s seconds. Total tickers processed: %d", elapsed, len(results))
    return {"ok": True, "elapsed": elapsed, "results": results}


def _scanner_worker_loop(interval_seconds: int = 900):
    """Background loop that runs every 15 minutes (900s)."""
    logger.info("Background 15-minute market scanner thread initialized.")
    
    while True:
        try:
            if _SCANNER_ENABLED:
                run_market_scan_cycle()
            else:
                logger.info("Background market scanner is currently paused.")
                
            time.sleep(interval_seconds)
        except Exception as e:
            logger.error("Scanner worker loop encountered error: %s. Retrying in 60s...", e)
            time.sleep(60)


def start_background_scanner(interval_seconds: int = 900):
    """Starts the 15-minute background market scanner thread."""
    global _SCANNER_RUNNING
    with _SCANNER_LOCK:
        if _SCANNER_RUNNING:
            return
        
        # Avoid starting scanner during manage.py commands like migrate, check, collectstatic
        if any(cmd in sys.argv for cmd in ["migrate", "collectstatic", "check", "make_migrations", "test"]):
            return

        _SCANNER_RUNNING = True
        t = threading.Thread(
            target=_scanner_worker_loop,
            args=(interval_seconds,),
            daemon=True,
            name="15MinMarketScannerThread"
        )
        t.start()
        logger.info("Background 15-minute market scanner thread started successfully.")


def set_scanner_enabled(enabled: bool):
    """Dynamically enables or pauses the background scanner."""
    global _SCANNER_ENABLED
    _SCANNER_ENABLED = enabled
    logger.info("Background scanner status changed to: %s", "ENABLED" if enabled else "PAUSED")
    return _SCANNER_ENABLED
