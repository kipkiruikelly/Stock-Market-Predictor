"""
engines/backtesting/__init__.py
Public API for the backtesting engine.

Usage:
    from engines.backtesting import run_backtest, WalkForwardBacktester
"""

from engines.backtesting.engine import run_backtest

__all__ = [
    "run_backtest",
]
