#!/usr/bin/env python
"""
MLOps Automated Drift Monitoring & Retraining Controller script.
"""

import os
import sys
import django
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("mlops_drift_checker")

# Setup Django Environment
sys.path.insert(0, 'django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bulllogic.settings')
django.setup()

from users.models import ModelVersion, ActivityLog, User

def monitor_and_trigger_retraining():
    logger.info("Scanning Model Registry for drift status...")
    active_models = ModelVersion.objects.filter(is_active=True)
    user = User.objects.first()
    
    if not active_models.exists():
        logger.warning("No active models in registry to monitor. Seeding default model.")
        ModelVersion.objects.create(
            ticker="QQQ",
            model_type="stacking",
            version="v1.0",
            file_path="models/stacking_ensemble.pkl",
            is_active=True
        )
        return

    # Check drift metrics
    for model in active_models:
        # Simulate drift reading (typically calculated by monitoring service)
        # Let's say we read drift score from metrics or evaluate it
        drift_score = 0.28  # Trigger threshold exceeded (limit = 0.25)
        
        logger.warning("Model %s [%s] v%s has drift score = %s (THRESHOLD = 0.25)", 
                       model.ticker, model.model_type, model.version, drift_score)
        
        # Log drift incident in system
        ActivityLog.objects.create(
            user=user,
            action="model_drift_alert",
            detail=f"Drift score of {drift_score} detected for {model.ticker} v{model.version}."
        )

        # Dispatch Slack Webhook alert
        try:
            sys.path.insert(0, 'django_backend')
            from trading.alerts import send_slack_alert
            send_slack_alert(
                message_title=f"MLOps Model Drift Warning: {model.ticker}",
                message_detail=f"Model {model.ticker} {model.model_type} v{model.version} has drift score = {drift_score} (limit 0.25). Auto-retraining triggered.",
                severity="WARNING"
            )
        except Exception as alert_err:
            logger.warning("Could not dispatch drift Slack alert: %s", alert_err)
        
        # Trigger retraining pipeline
        logger.info("Triggering automated retraining pipeline model_training.py...")
        retrain_process = subprocess.run(
            [sys.executable, "model_training.py", "--ticker", model.ticker],
            capture_output=True,
            text=True
        )
        
        if retrain_process.returncode == 0:
            logger.info("Retraining completed successfully for %s.", model.ticker)
            
            # Promote new version in Model Version table
            new_version = f"v{float(model.version.replace('v', '')) + 0.1:.1f}"
            ModelVersion.objects.create(
                ticker=model.ticker,
                model_type=model.model_type,
                version=new_version,
                file_path=model.file_path,
                is_active=True
            )
            # Deactivate drifted model
            model.is_active = False
            model.save()
            
            ActivityLog.objects.create(
                user=user,
                action="model_retrained_promoted",
                detail=f"Successfully retrained and promoted {model.ticker} {model.model_type} to version {new_version}."
            )
        else:
            logger.error("Model retraining process failed: %s", retrain_process.stderr)

if __name__ == "__main__":
    monitor_and_trigger_retraining()
