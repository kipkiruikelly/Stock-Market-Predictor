"""
mt5_config.py — Backward-compatibility shim.

All logic has been extracted to engines/mt5/config.py.
This file re-exports the public API so existing callers continue to work
without any changes.

To use the new modular interface directly:
    from engines.mt5.config import load, save, reset, DEFAULTS
"""

from engines.mt5.config import load, save, reset, DEFAULTS, CONFIG_PATH  # noqa: F401

__all__ = ["load", "save", "reset", "DEFAULTS", "CONFIG_PATH"]
