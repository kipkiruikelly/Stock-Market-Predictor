"""
engines/signals/
Canonical TradingSignal domain — generation, validation, state machine, registry.

Public API:
    from engines.signals import (
        TradingSignal, SignalStatus, generate_signal,
        validate_signal, transition, SignalRegistry
    )
"""

from engines.signals.models import TradingSignal, SignalStatus, ValidationResult, RiskDecision
from engines.signals.generator import generate_signal
from engines.signals.validator import validate_signal
from engines.signals.state_machine import transition, SignalTransitionError
from engines.signals.registry import SignalRegistry

__all__ = [
    "TradingSignal",
    "SignalStatus",
    "ValidationResult",
    "RiskDecision",
    "generate_signal",
    "validate_signal",
    "transition",
    "SignalTransitionError",
    "SignalRegistry",
]
