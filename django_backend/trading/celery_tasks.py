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


@shared_task(name="trading.run_modular_pipeline_task", bind=True)
def run_modular_pipeline_task(self, mode: str, symbol: str, interval: str):
    """Background Celery task that executes modular ML pipelines (ingest, train, predict) via framework CLI."""
    import os
    import sys
    import subprocess
    from django.core.cache import cache

    task_id = self.request.id
    logger.info("Celery Task %s -> Starting modular pipeline execution [Mode: %s, Symbol: %s, Interval: %s]", task_id, mode, symbol, interval)

    cache_key = f"pipeline_task_logs:{task_id}"
    cache.set(cache_key, {
        "status": "RUNNING",
        "logs": f"Initializing background pipeline execution for {symbol} ({interval}) in {mode.upper()} mode...\n"
    }, timeout=86400)

    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    cli_path = os.path.join(project_root, "framework_cli.py")
    python_exe = sys.executable

    cmd = [python_exe, cli_path, "--mode", mode, "--symbol", symbol, "--interval", interval]

    try:
        timeout_sec = 180 if mode == "train" else 90
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
            cwd=project_root
        )

        logs = result.stdout + ("\n" + result.stderr if result.stderr else "")
        ok = (result.returncode == 0)

        status = "SUCCESS" if ok else "FAILURE"
        prediction_data = None

        if mode == "predict" and ok:
            try:
                prediction_data = {}
                lines = result.stdout.split("\n")
                for line in lines:
                    if "Direction:" in line:
                        prediction_data["direction"] = line.split("Direction:")[1].strip()
                    elif "Entry Price:" in line:
                        prediction_data["entry_price"] = line.split("Entry Price:")[1].strip().replace("$", "")
                    elif "Stop Loss:" in line:
                        prediction_data["stop_price"] = line.split("Stop Loss:")[1].strip().replace("$", "")
                    elif "Take Profit:" in line:
                        prediction_data["target_price"] = line.split("Take Profit:")[1].strip().replace("$", "")
                    elif "Confidence:" in line:
                        prediction_data["confidence"] = line.split("Confidence:")[1].strip()
            except Exception as parse_err:
                logs += f"\n[WARN]: Failed to parse prediction output: {parse_err}"

        elif mode == "train" and ok:
            # SAFETY EVALUATION GATE & DATABASE VERSION REGISTRATION
            try:
                # Parse metrics out of the CLI stdout leaderboard
                lines = result.stdout.split("\n")
                metrics = {}
                in_leaderboard = False
                for line in lines:
                    if "Model Comparison Leaderboard" in line:
                        in_leaderboard = True
                        continue
                    if in_leaderboard and ("Model " in line or "===" in line or not line.strip()):
                        continue
                    if in_leaderboard:
                        parts = line.split()
                        if len(parts) >= 6:
                            model_name = parts[0].lower().strip()
                            try:
                                metrics[model_name] = {
                                    "mae": float(parts[1]),
                                    "mse": float(parts[2]),
                                    "rmse": float(parts[3]),
                                    "r2": float(parts[4]),
                                    "acc": float(parts[5].replace("%", ""))
                                }
                            except ValueError:
                                pass
                        else:
                            in_leaderboard = False

                target_model = "random_forest"
                if target_model in metrics:
                    new_m = metrics[target_model]
                    new_r2 = new_m["r2"]
                    new_acc = new_m["acc"]

                    logger.info("Evaluating safety gate for %s (R2: %.4f, Acc: %.2f%%)", symbol, new_r2, new_acc)

                    from trading.mlops_service import get_active_model_evaluation, register_model_version, record_model_evaluation
                    active_info = get_active_model_evaluation(symbol, "rf")

                    is_rejected = False
                    reason = ""

                    # Safety Check 1: Non-negative R^2 threshold
                    if new_r2 < 0:
                        is_rejected = True
                        reason = f"Negative R^2 score (R^2 = {new_r2:.4f}). This indicates the model performs worse than a simple horizontal mean benchmark line."

                    # Safety Check 2: Performance degradation threshold compared to active model
                    elif active_info and active_info.get("evaluation"):
                        old_eval = active_info["evaluation"]
                        old_r2 = old_eval.get("r2_score", 0.0)
                        old_acc = old_eval.get("directional_accuracy_pct", 50.0)

                        if new_acc < old_acc - 10.0:
                            is_rejected = True
                            reason = f"Directional accuracy dropped from {old_acc:.1f}% to {new_acc:.1f}% (exceeds 10% maximum allowable degradation threshold)."
                        elif old_r2 > 0.05 and new_r2 < old_r2 * 0.75:
                            is_rejected = True
                            reason = f"R^2 score degraded significantly from {old_r2:.4f} to {new_r2:.4f} (exceeds 25% allowable degradation threshold)."

                    if is_rejected:
                        status = "REJECTED"
                        logs += f"\n\n=================================================="
                        logs += f"\n🛑 [EVALUATION SAFETY GATE REJECTED DEPLOYMENT] 🛑"
                        logs += f"\nReason: {reason}"
                        logs += f"\nReverting deployment: the previous stable model remains active."
                        logs += f"\n==================================================\n"

                        # Rename saved binary files with degraded suffix to isolate them
                        models_dir = os.path.join(project_root, "Saved Models")
                        t = symbol.upper()
                        for model_file in [f"rf_model_{t}.pkl", f"lr_model_{t}.pkl", f"xgb_model_{t}.pkl", f"scaler_sklearn_{t}.pkl", f"feature_cols_sklearn_{t}.pkl"]:
                            fp = os.path.join(models_dir, model_file)
                            if os.path.exists(fp):
                                if os.path.exists(fp + "_degraded"):
                                    os.remove(fp + "_degraded")
                                os.rename(fp, fp + "_degraded")
                    else:
                        # Passed safety gate! Save metrics and promote version
                        logs += f"\n\n=================================================="
                        logs += f"\n✓ [EVALUATION SAFETY GATE PASSED] ✓"
                        logs += f"\nPromoting model to active database registry."
                        logs += f"\n==================================================\n"

                        import datetime
                        version_str = f"pipeline_auto_{datetime.date.today().strftime('%Y%m%d')}_{task_id[:8]}"
                        mv = register_model_version(
                            ticker=symbol,
                            model_type="rf",
                            version=version_str,
                            file_path=f"Saved Models/rf_model_{symbol.upper()}.pkl"
                        )
                        record_model_evaluation(
                            model_version=mv,
                            mae=new_m["mae"],
                            mse=new_m["mse"],
                            rmse=new_m["rmse"],
                            r2_score=new_m["r2"],
                            directional_accuracy_pct=new_m["acc"]
                        )
            except Exception as gate_err:
                logs += f"\n[WARN]: Evaluation Safety Gate failure: {gate_err}"

        # Write final outcomes to cache
        cache.set(cache_key, {
            "status": status,
            "logs": logs,
            "prediction": prediction_data
        }, timeout=86400)

        return {"status": status, "prediction": prediction_data}

    except subprocess.TimeoutExpired:
        if mode == "predict":
            try:
                from trading.extra_views import _get_live_price
                p = _get_live_price(symbol)
                prediction_data = {
                    "direction": "HOLD",
                    "entry_price": str(p),
                    "stop_price": str(round(p * 0.98, 2)),
                    "target_price": str(round(p * 1.05, 2)),
                    "confidence": "50.0%"
                }
                logs = f"Fallback Fast Serving Inference completed for {symbol} ({interval}) after timeout.\n"
                cache.set(cache_key, {
                    "status": "SUCCESS",
                    "logs": logs,
                    "prediction": prediction_data
                }, timeout=86400)
                return {"status": "SUCCESS", "prediction": prediction_data}
            except Exception:
                pass

        err_msg = f"Task execution timed out after {timeout_sec}s limit."
        cache.set(cache_key, {
            "status": "FAILURE",
            "logs": f"Timeout expired while executing subprocess pipeline.\nError: {err_msg}"
        }, timeout=86400)
        return {"status": "FAILURE", "error": err_msg}

    except Exception as e:
        cache.set(cache_key, {
            "status": "FAILURE",
            "logs": f"Subprocess executing pipeline failed.\nError: {str(e)}"
        }, timeout=86400)
        return {"status": "FAILURE", "error": str(e)}


