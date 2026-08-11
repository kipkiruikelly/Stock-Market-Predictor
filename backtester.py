"""
backtester.py — Backward-compatibility shim.

All logic has been extracted to engines/backtesting/.
This file re-exports the public API so existing Flask routes that call
backtester.run_backtest() continue to work without any changes.

To use the new modular interface directly:
    from engines.backtesting import run_backtest
"""

from engines.backtesting.engine import run_backtest  # noqa: F401

__all__ = ["run_backtest"]
