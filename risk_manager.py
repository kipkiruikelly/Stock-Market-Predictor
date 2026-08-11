"""
risk_manager.py — Backward-compatibility shim.

All logic has been extracted to engines/risk/.
This file re-exports the public API so existing callers continue to work
without any changes.

To use the new modular interface directly:
    from engines.risk import RiskManager, TradeRecord, RiskState
"""

from engines.risk import RiskManager, TradeRecord, RiskState  # noqa: F401

__all__ = ["RiskManager", "TradeRecord", "RiskState"]
