"""
engines/paper_trading/__init__.py
Public API for the paper trading engine.

Usage:
    from engines.paper_trading import PaperEngine, DEFAULT_CONFIG, SIM_CURRENCY
"""

from engines.paper_trading.config import (
    DEFAULT_CONFIG,
    SIM_CURRENCY,
    BUILTIN_STRATEGIES,
    MIN_TRADES,
)
from engines.paper_trading.engine import (
    asset_class,
    market_open,
    load_config,
    save_config,
    engine_enabled,
    set_engine_enabled,
    strategy_enabled,
    apply_entry_friction,
    apply_exit_friction,
    commission,
    position_size,
    trade_pnl,
    realized_equity,
    open_positions,
    mark_to_market,
    class_exposure,
    breaker_tripped,
    try_open,
    close_trade,
    check_exit,
    compute_metrics,
    strategy_report,
    snapshot_equity,
    run_cycle,
)

__all__ = [
    "DEFAULT_CONFIG",
    "SIM_CURRENCY",
    "BUILTIN_STRATEGIES",
    "MIN_TRADES",
    "asset_class",
    "market_open",
    "load_config",
    "save_config",
    "engine_enabled",
    "set_engine_enabled",
    "strategy_enabled",
    "apply_entry_friction",
    "apply_exit_friction",
    "commission",
    "position_size",
    "trade_pnl",
    "realized_equity",
    "open_positions",
    "mark_to_market",
    "class_exposure",
    "breaker_tripped",
    "try_open",
    "close_trade",
    "check_exit",
    "compute_metrics",
    "strategy_report",
    "snapshot_equity",
    "run_cycle",
]
