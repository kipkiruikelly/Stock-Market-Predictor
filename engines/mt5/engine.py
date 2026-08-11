"""
engines/mt5/engine.py
MT5 Engine public facade. Extracted from mt5_trading.py.

Imports the full MT5Trader class from mt5_trading.py and re-exports it as
MT5Engine, so callers can use:

    from engines.mt5 import MT5Engine

instead of:

    from mt5_trading import MT5Trader

This avoids duplicating the heavy 70KB mt5_trading.py module during the
extraction phase. The full extraction of MT5Trader into this package is
a follow-up task once the outer shims are stable.

Additionally exports the live-trading flag helpers.
"""

# Re-export MT5Trader as MT5Engine from the original module.
# This gives the engines/ package a stable public interface immediately,
# while preserving backward compatibility with any existing code that
# imports directly from mt5_trading.
try:
    from mt5_trading import (
        MT5Trader as MT5Engine,
        live_trading_enabled,
        set_live_trading_enabled,
    )
except ImportError:
    # Graceful degradation: MT5 dependencies may not be installed
    MT5Engine = None
    live_trading_enabled = lambda: False
    set_live_trading_enabled = lambda enabled: None

from engines.mt5.config import load as load_config, save as save_config, reset as reset_config

__all__ = [
    "MT5Engine",
    "live_trading_enabled",
    "set_live_trading_enabled",
    "load_config",
    "save_config",
    "reset_config",
]
