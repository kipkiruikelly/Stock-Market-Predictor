"""
engines/signals/state_machine.py
Enum-validated state machine for TradingSignal lifecycle.

Only legal state transitions are permitted. Attempting an illegal
transition raises SignalTransitionError. This prevents signals from
jumping from GENERATED directly to EXECUTED.
"""

import logging
from datetime import datetime, timezone
from typing import Set

from engines.signals.models import TradingSignal, SignalStatus

logger = logging.getLogger(__name__)

# Legal transitions: {from_state: {allowed_to_states}}
_TRANSITIONS: dict[SignalStatus, Set[SignalStatus]] = {
    SignalStatus.GENERATED:        {SignalStatus.VALIDATING, SignalStatus.EXPIRED, SignalStatus.CANCELLED},
    SignalStatus.VALIDATING:       {SignalStatus.APPROVED, SignalStatus.REJECTED, SignalStatus.EXPIRED, SignalStatus.FAILED},
    SignalStatus.APPROVED:         {SignalStatus.QUEUED, SignalStatus.EXPIRED, SignalStatus.CANCELLED},
    SignalStatus.REJECTED:         set(),  # terminal
    SignalStatus.EXPIRED:          set(),  # terminal
    SignalStatus.QUEUED:           {SignalStatus.EXECUTING, SignalStatus.CANCELLED, SignalStatus.EXPIRED},
    SignalStatus.EXECUTING:        {SignalStatus.EXECUTED, SignalStatus.PARTIALLY_FILLED, SignalStatus.FAILED, SignalStatus.CANCELLED},
    SignalStatus.EXECUTED:         set(),  # terminal
    SignalStatus.PARTIALLY_FILLED: {SignalStatus.EXECUTED, SignalStatus.CANCELLED, SignalStatus.FAILED},
    SignalStatus.CANCELLED:        set(),  # terminal
    SignalStatus.FAILED:           set(),  # terminal
}


class SignalTransitionError(Exception):
    """Raised when an illegal state transition is attempted."""


def transition(
    signal: TradingSignal,
    new_status: SignalStatus,
    reason: str = "",
) -> TradingSignal:
    """
    Transition a signal to a new status.

    Args:
        signal: The signal to transition.
        new_status: The target status.
        reason: Human-readable reason for the transition.

    Returns:
        The mutated signal (same object, status updated in-place).

    Raises:
        SignalTransitionError: If the transition is not legal.
    """
    current = signal.status
    allowed = _TRANSITIONS.get(current, set())

    if new_status not in allowed:
        raise SignalTransitionError(
            f"Illegal signal transition: {current.value} → {new_status.value} "
            f"(signal_id={signal.signal_id}, symbol={signal.symbol}). "
            f"Allowed from {current.value}: {[s.value for s in allowed] or 'none (terminal state)'}"
        )

    old_status = signal.status
    signal.status = new_status

    logger.info(
        "Signal %s [%s] %s → %s | %s",
        signal.signal_id, signal.symbol, old_status.value, new_status.value, reason
    )

    return signal


def is_terminal(status: SignalStatus) -> bool:
    return len(_TRANSITIONS.get(status, set())) == 0


def allowed_transitions(status: SignalStatus) -> Set[SignalStatus]:
    return _TRANSITIONS.get(status, set())
