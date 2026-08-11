"""
paper_engine.py — Backward-compatibility shim.

All logic has been extracted to engines/paper_trading/.
This file re-exports the public API so existing callers (Flask routes,
ops.py, tests) continue to work without any changes.

To use the new modular interface directly:
    from engines.paper_trading import run_cycle, try_open, compute_metrics
"""

from engines.paper_trading.config import (     # noqa: F401
    DEFAULT_CONFIG,
    SIM_CURRENCY,
    BUILTIN_STRATEGIES,
    MIN_TRADES,
)

from engines.paper_trading.engine import (     # noqa: F401
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
    digest_summary,
    alpha_signals,
    ml_signals,
    get_active_strategies,
    run_cycle,
)
