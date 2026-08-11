"""
engines/orchestration/emergency_stop.py
Global trading kill-switch.

When activated:
  - All new orders are immediately blocked.
  - Existing positions are NOT auto-closed unless close_positions=True.
  - Activation is logged to Django EmergencyStop table (if available).
  - An in-memory flag is also set for sub-millisecond checks in the pipeline.

Usage:
    stop = EmergencyStopManager()
    stop.activate(actor="admin_user", reason="Flash crash detected")
    stop.is_active()   # -> True
    stop.deactivate(actor="admin_user")
"""

import logging
import threading
from datetime import datetime, timezone
from typing import List, Optional

logger = logging.getLogger(__name__)

# In-memory flag — set atomically on activate/deactivate
_active = False
_active_lock = threading.Lock()
_activation_reason: Optional[str] = None
_activated_by: Optional[str] = None
_activated_at: Optional[datetime] = None


class EmergencyStopManager:
    """
    Thread-safe emergency stop manager.

    The in-memory flag is the primary gate (sub-millisecond check).
    The Django ORM record is for audit persistence.
    """

    def is_active(self) -> bool:
        """Return True if the emergency stop is currently active."""
        with _active_lock:
            return _active

    def activate(
        self,
        actor: str,
        reason: str,
        close_positions: bool = False,
        affected_accounts: Optional[List[str]] = None,
    ) -> dict:
        """
        Activate the global trading kill-switch.

        Args:
            actor: Username or system identifier activating the stop.
            reason: Human-readable reason for activation.
            close_positions: If True, downstream code should close open positions.
                             Defaults to False — this is an explicit, dangerous action.
            affected_accounts: Optional list of account IDs affected.

        Returns:
            dict with activation details.
        """
        global _active, _activation_reason, _activated_by, _activated_at

        now = datetime.now(timezone.utc)

        with _active_lock:
            _active = True
            _activation_reason = reason
            _activated_by = actor
            _activated_at = now

        logger.critical(
            "EMERGENCY STOP ACTIVATED by '%s' at %s | Reason: %s | close_positions=%s",
            actor, now.isoformat(), reason, close_positions
        )

        # Persist to Django ORM if available
        record_id = None
        try:
            from django_backend.trading.trading_models import EmergencyStop
            record = EmergencyStop.objects.create(
                activated_by=actor,
                reason=reason,
                close_positions=close_positions,
                affected_accounts=affected_accounts or [],
                is_active=True,
            )
            record_id = record.id
            logger.info("EmergencyStop persisted to DB: id=%s", record_id)
        except Exception as db_exc:
            logger.warning("Could not persist EmergencyStop to DB: %s", db_exc)

        return {
            "active": True,
            "activated_by": actor,
            "activated_at": now.isoformat(),
            "reason": reason,
            "close_positions": close_positions,
            "db_record_id": record_id,
        }

    def deactivate(self, actor: str, notes: str = "") -> dict:
        """
        Deactivate the emergency stop and allow new orders.

        Args:
            actor: Username or system identifier deactivating the stop.
            notes: Optional notes about the deactivation.

        Returns:
            dict with deactivation details.
        """
        global _active

        now = datetime.now(timezone.utc)

        with _active_lock:
            was_active = _active
            _active = False

        if not was_active:
            logger.warning("Emergency stop deactivate called but stop was not active")
            return {"active": False, "note": "Stop was not active"}

        logger.warning(
            "EMERGENCY STOP DEACTIVATED by '%s' at %s | Notes: %s",
            actor, now.isoformat(), notes
        )

        # Update DB record if available
        try:
            from django_backend.trading.trading_models import EmergencyStop
            active_stops = EmergencyStop.objects.filter(is_active=True)
            active_stops.update(
                is_active=False,
                deactivated_at=now,
                deactivated_by=actor,
                notes=notes,
            )
        except Exception as db_exc:
            logger.warning("Could not update EmergencyStop in DB: %s", db_exc)

        return {
            "active": False,
            "deactivated_by": actor,
            "deactivated_at": now.isoformat(),
        }

    def status(self) -> dict:
        """Return current emergency stop status."""
        with _active_lock:
            return {
                "active": _active,
                "reason": _activation_reason,
                "activated_by": _activated_by,
                "activated_at": _activated_at.isoformat() if _activated_at else None,
            }


# Module-level singleton
_manager = EmergencyStopManager()


def get_emergency_stop() -> EmergencyStopManager:
    """Return the process-level EmergencyStopManager singleton."""
    return _manager
