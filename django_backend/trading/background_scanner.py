"""
django_backend/trading/background_scanner.py
15-Minute Background Market Scanner — single-instance, multi-ticker FSM engine.

Fix: uses a process-level file lock so only ONE Gunicorn worker runs the scanner
thread, eliminating duplicate audit log entries from multi-worker deployments.
"""

import os
import sys
import time
try:
    import fcntl
except ImportError:
    fcntl = None
import logging
import threading
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("background_scanner")

_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

# ── Global state ──────────────────────────────────────────────────────────────
_SCANNER_RUNNING = False
_SCANNER_ENABLED = True
_SCANNER_LOCK    = threading.Lock()
_LOCK_FILE_PATH  = "/tmp/bulllogic_scanner.lock"
_LOCK_FD         = None   # file descriptor for the process-level flock

# Default tickers — can be overridden by user configuration
DEFAULT_TICKERS = ["SPY", "QQQ", "AAPL", "NVDA", "BTC", "EURUSD", "GOLD"]
_active_tickers = list(DEFAULT_TICKERS)


def set_scanner_tickers(tickers: list):
    """Update the list of tickers the scanner watches."""
    global _active_tickers
    _active_tickers = [t.upper().strip() for t in tickers if t.strip()]
    logger.info("Scanner tickers updated: %s", _active_tickers)


def get_scanner_tickers() -> list:
    return list(_active_tickers)


def _acquire_process_lock() -> bool:
    """
    Try to acquire an exclusive flock on a temp file.
    Returns True if this process won the lock (should run the scanner).
    Returns False if another Gunicorn worker already holds it.
    """
    global _LOCK_FD
    if fcntl is None:
        return True  # Windows fallback: allow local single-process run
    try:
        _LOCK_FD = open(_LOCK_FILE_PATH, "w")
        fcntl.flock(_LOCK_FD, fcntl.LOCK_EX | fcntl.LOCK_NB)
        return True
    except (IOError, OSError):
        # Another worker already holds the lock
        if _LOCK_FD:
            _LOCK_FD.close()
            _LOCK_FD = None
        return False


def run_market_scan_cycle() -> dict:
    """Executes a single market scan cycle across all active tickers."""
    logger.info(
        "Starting 15-minute autonomous market scan cycle at %s",
        datetime.now(timezone.utc).isoformat()
    )
    start_time = time.time()

    from users.models import User
    from trading.state_machine import TradingWorkflow

    system_user = User.objects.filter(role="admin").first() or User.objects.first()
    results = []

    for ticker in _active_tickers:
        try:
            logger.info("Autonomous Scanner → Executing FSM workflow for %s", ticker)
            workflow = TradingWorkflow(
                ticker          = ticker,
                interval        = "1d",
                account_balance = 10000.0,
                user            = system_user,
            )
            res = workflow.execute()
            results.append({
                "ticker": ticker,
                "state":  res.get("state"),
                "reason": res.get("reason"),
            })
        except Exception as err:
            logger.error("Scanner failed for ticker %s: %s", ticker, err)
            results.append({"ticker": ticker, "state": "FAILED", "error": str(err)})

    # Also refresh the global screener cache
    try:
        from django.core.management import call_command
        logger.info("Autonomous Scanner → Refreshing ML Screener Cache...")
        call_command('cache_screener')
    except Exception as e:
        logger.error("Failed to run cache_screener during scan cycle: %s", e)

    elapsed = round(time.time() - start_time, 2)
    logger.info(
        "Market scan cycle finished in %ss. Tickers: %d",
        elapsed, len(results)
    )
    return {"ok": True, "elapsed": elapsed, "results": results}


def _scanner_worker_loop(interval_seconds: int = 900):
    """Background loop that runs every 15 minutes (900s)."""
    logger.info("Background 15-minute market scanner thread initialized. Delaying first run by 30s to allow clean boot.")
    
    # Delay first execution cycle to prevent blocking Gunicorn binding during Cloud Run startup
    time.sleep(30)

    while True:
        try:
            if _SCANNER_ENABLED:
                run_market_scan_cycle()
            else:
                logger.info("Background market scanner is currently paused.")

            time.sleep(interval_seconds)

        except Exception as e:
            logger.error("Scanner worker loop encountered error: %s. Retrying in 60s…", e)
            time.sleep(60)


def start_background_scanner(interval_seconds: int = 900):
    """
    Starts the 15-minute background market scanner thread.
    Uses a process-level flock to ensure only one Gunicorn worker runs it.
    """
    global _SCANNER_RUNNING

    # Skip during Django management commands
    if any(cmd in sys.argv for cmd in [
        "migrate", "collectstatic", "check", "makemigrations", "test", "shell"
    ]):
        return

    with _SCANNER_LOCK:
        if _SCANNER_RUNNING:
            return

        # Try to acquire the process-level lock — only one worker wins
        if not _acquire_process_lock():
            logger.info(
                "Scanner lock held by another worker — this worker will NOT start scanner thread."
            )
            return

        _SCANNER_RUNNING = True
        t = threading.Thread(
            target = _scanner_worker_loop,
            args   = (interval_seconds,),
            daemon = True,
            name   = "15MinMarketScannerThread",
        )
        t.start()
        logger.info(
            "Background 15-minute market scanner thread started (PID %d, lock acquired).",
            os.getpid()
        )


def set_scanner_enabled(enabled: bool) -> bool:
    """Dynamically enables or pauses the background scanner."""
    global _SCANNER_ENABLED
    _SCANNER_ENABLED = enabled
    logger.info(
        "Background scanner status changed to: %s",
        "ENABLED" if enabled else "PAUSED"
    )
    return _SCANNER_ENABLED
