"""
engines/signals/registry.py
In-memory signal registry with idempotency by signal_id.

For persistence, write to the Django TradingSignal ORM model
after creating the registry entry.
"""

import logging
import threading
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Optional, List

from engines.signals.models import TradingSignal, SignalStatus

logger = logging.getLogger(__name__)

_MAX_REGISTRY_SIZE = 10_000   # keep last N signals in memory


class SignalRegistry:
    """
    Thread-safe in-memory signal store.

    Usage:
        registry = SignalRegistry()   # one singleton per process
        registry.add(signal)
        signal = registry.get(signal_id)
        registry.update_status(signal_id, SignalStatus.APPROVED)
    """

    def __init__(self, max_size: int = _MAX_REGISTRY_SIZE) -> None:
        self._store: OrderedDict[str, TradingSignal] = OrderedDict()
        self._lock = threading.Lock()
        self._max_size = max_size

    def add(self, signal: TradingSignal) -> bool:
        """
        Add a signal. Returns True if added, False if already exists (idempotent).
        """
        with self._lock:
            if signal.signal_id in self._store:
                logger.debug("Signal %s already in registry — skipping", signal.signal_id)
                return False
            self._store[signal.signal_id] = signal
            if len(self._store) > self._max_size:
                oldest_id, _ = next(iter(self._store.items()))
                del self._store[oldest_id]
            return True

    def get(self, signal_id: str) -> Optional[TradingSignal]:
        with self._lock:
            return self._store.get(signal_id)

    def update_status(self, signal_id: str, new_status: SignalStatus, reason: str = "") -> bool:
        """Update signal status in-place. Returns False if signal not found."""
        with self._lock:
            signal = self._store.get(signal_id)
            if signal is None:
                return False
            signal.status = new_status
            return True

    def list_active(self) -> List[TradingSignal]:
        """Return all non-terminal signals."""
        terminal = {
            SignalStatus.EXECUTED, SignalStatus.REJECTED, SignalStatus.EXPIRED,
            SignalStatus.CANCELLED, SignalStatus.FAILED
        }
        with self._lock:
            return [s for s in self._store.values() if s.status not in terminal]

    def count(self) -> int:
        with self._lock:
            return len(self._store)

    def clear(self) -> None:
        """Clear registry (useful in tests)."""
        with self._lock:
            self._store.clear()


# Module-level singleton
_registry = SignalRegistry()


def get_registry() -> SignalRegistry:
    """Return the process-level SignalRegistry singleton."""
    return _registry
