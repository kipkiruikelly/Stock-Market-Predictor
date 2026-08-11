"""
engines/mt5/__init__.py
Public API for the MT5 trading engine.

Usage:
    from engines.mt5 import MT5Engine
    from engines.mt5.config import load as load_mt5_config, save as save_mt5_config
"""

from engines.mt5.engine import MT5Engine

__all__ = ["MT5Engine"]
