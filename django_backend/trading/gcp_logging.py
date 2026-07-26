"""
django_backend/trading/gcp_logging.py
Unified Google Cloud Logging and Exception Reporting Bridge for Triple Fusion Engine v2.1.
"""

import os
import logging
import traceback

logger = logging.getLogger("triple_fusion_engine")

try:
    if os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GAE_ENV") or os.getenv("K_SERVICE"):
        # We are running on Google Cloud Platform
        import google.cloud.logging
        from google.cloud import error_reporting
        
        # Initialize Google Cloud Logging Client
        client = google.cloud.logging.Client()
        client.setup_logging()
        
        # Initialize Google Cloud Error Reporting Client
        error_client = error_reporting.Client()
        logger.info("Successfully connected Unified Google Cloud Logging & Error Reporting.")
    else:
        error_client = None
        logger.info("Local environment detected. Gracefully falling back to standard console logging.")
except ImportError:
    error_client = None
    logger.warning("Google Cloud SDK packages not installed. Running under standard fallback logs.")


class GCPErrorReporter:
    """Enterprise Error Reporting utility to record exceptions to GCloud Error Reporting."""
    
    @staticmethod
    def report_exception(exception: Exception, context_info: str = None):
        """Log Python exceptions and auto-report to Google Cloud Error Reporting in prod."""
        tb = traceback.format_exc()
        msg = f"Exception Caught: {str(exception)}\nContext: {context_info or 'N/A'}\nTraceback:\n{tb}"
        logger.error(msg)
        
        if error_client:
            try:
                error_client.report_exception()
            except Exception as e:
                logger.error(f"Failed to submit to Google Cloud Error Reporting: {str(e)}")


def log_audit(action: str, status: str, user: str = "System", details: str = ""):
    """Structured audit trail log utility."""
    logger.info(f"[AUDIT] Action: {action} | Status: {status} | User: {user} | Details: {details}")
