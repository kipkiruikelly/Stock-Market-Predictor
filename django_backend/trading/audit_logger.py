"""
django_backend/trading/audit_logger.py
Structured Audit Trail & Database Logging for Autonomous Trading Workflows.
"""

import logging
from users.models import AdminAuditLog, User

logger = logging.getLogger("trading_audit")

def log_workflow_step(action: str, details: dict, user: User = None):
    """Persists a structured activity log entry into PostgreSQL / SQLite database."""
    try:
        system_user = user
        if system_user is None:
            system_user = User.objects.filter(role="admin").first() or User.objects.first()

        detail_str = f"[{details.get('ticker', 'SYS')}] State: {details.get('state', 'N/A')} | {details.get('reason', '')}"
        if "confidence" in details:
            detail_str += f" | Conf: {details['confidence']}%"

        AdminAuditLog.objects.create(
            admin=system_user,
            action=action[:50],
            target_type="workflow",
            target_id=str(details.get('ticker', 'SYS'))[:40],
            detail=detail_str[:400]
        )
        logger.info("AUDIT LOG PERSISTED: %s - %s", action, detail_str)
    except Exception as exc:
        logger.warning("Failed to persist audit log to DB: %s", exc)
