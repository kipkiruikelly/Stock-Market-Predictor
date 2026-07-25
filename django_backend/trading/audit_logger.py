"""
django_backend/trading/audit_logger.py
Structured Audit Trail & Database Logging for Autonomous Trading Workflows.
"""

import logging
from users.models import AdminAuditLog, User

logger = logging.getLogger("trading_audit")


def log_workflow_step(action: str, details: dict, user=None):
    """
    Persists a structured FSM activity log entry to the database.

    action  — bare state name (ANALYZING / RISK_EVALUATION / APPROVED / EXECUTED / REJECTED / FAILED)
    details — workflow context dict
    user    — Django User instance or None
    """
    try:
        # Resolve user: prefer passed-in user, fall back to first admin, then any user
        system_user = user
        if system_user is None:
            system_user = (
                User.objects.filter(role="admin").first()
                or User.objects.first()
            )

        if system_user is None:
            # No users exist yet — skip DB write, just log to console
            logger.info("AUDIT (no user): %s — %s", action, details.get("reason", ""))
            return

        # Build detail string
        ticker    = details.get("ticker", "SYS")
        state     = details.get("state", action)
        reason    = details.get("reason", "")
        conf      = details.get("confidence", None)

        detail_str = f"[{ticker}] State: {state} | {reason}"
        if conf is not None:
            detail_str += f" | Conf: {conf:.1f}%"

        # Prefix action so WorkflowStatusView filter (action__startswith="WORKFLOW_") still works
        db_action = f"WORKFLOW_{action}" if not action.startswith("WORKFLOW_") else action

        AdminAuditLog.objects.create(
            admin       = system_user,
            action      = db_action[:50],
            target_type = "workflow",
            target_id   = str(ticker)[:40],
            detail      = detail_str[:400],
        )
        logger.info("AUDIT LOG: %s — %s", db_action, detail_str[:120])

        # Polyglot Stream Indexer (Elasticsearch Layer)
        from trading.search_engine import index_audit_event
        index_audit_event(action=db_action, ticker=str(ticker), details=detail_str)

    except Exception as exc:
        logger.warning("Failed to persist audit log to DB: %s", exc)
