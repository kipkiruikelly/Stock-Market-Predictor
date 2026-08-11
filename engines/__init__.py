"""
engines/__init__.py
BullLogic modular engine package.

Sub-packages:
    engines.prediction      — ML inference layer (run_prediction, ml_signal)
    engines.paper_trading   — Paper trading simulation engine (PaperEngine)
    engines.backtesting     — Walk-forward backtesting engine
    engines.mt5             — MetaTrader 5 live/paper trading engine
    engines.risk            — Advanced risk management (RiskManager)
"""

__version__ = "1.0.0"
__all__ = [
    "prediction",
    "paper_trading",
    "backtesting",
    "mt5",
    "risk",
]
