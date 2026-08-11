"""
backtest.py — Backward-compatibility shim.

All logic has been extracted to engines/backtesting/.
This file preserves the CLI entry point so existing scripts that call
`python backtest.py --ticker QQQ --start 2022-01-01` continue to work.

To use the new modular interface directly:
    from engines.backtesting import run_backtest
"""

from engines.backtesting.engine import (       # noqa: F401
    run_cli_backtest,
    run_backtest,
    _build_features_standalone as _build_features,
    _ict_signal,
    _tech_signal,
    _ml_signal_bt as _ml_signal,
    _fuse,
    _Pos,
    WARMUP_BARS,
    MAX_HOLD,
    SL_ATR_MULT,
    TP_ATR_MULT,
    MAX_POSITIONS,
    DAILY_LOSS_LIMIT,
    MODELS_DIR,
)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="BullLogic walk-forward backtester")
    parser.add_argument("--ticker",       default="QQQ")
    parser.add_argument("--start",        default="2022-01-01")
    parser.add_argument("--end",          default="2024-12-31")
    parser.add_argument("--risk",         type=float, default=1.0)
    parser.add_argument("--signal",       default="fused",
                        choices=["fused", "ml", "tech", "ict"])
    parser.add_argument("--no-plot",      action="store_true")
    parser.add_argument("--save-trades",  default=None)
    parser.add_argument("--save-chart",   default=None)
    args = parser.parse_args()

    metrics = run_cli_backtest(
        ticker=args.ticker,
        start=args.start,
        end=args.end,
        risk_pct=args.risk,
        signal_mode=args.signal,
        no_plot=args.no_plot,
        save_trades=args.save_trades,
        save_chart=args.save_chart,
    )

    # Print terminal summary table
    print(f"\n{'='*60}")
    print(f"  BullLogic Backtest — {metrics['ticker']}  [{metrics['start']} → {metrics['end']}]")
    print(f"  Signal mode: {metrics['signal_mode']}")
    print(f"{'='*60}")
    print(f"  Initial capital : ${metrics['initial_capital']:>12,.2f}")
    print(f"  Final equity    : ${metrics['final_equity']:>12,.2f}")
    print(f"  Total return    : {metrics['total_return_pct']:>+.2f}%")
    print(f"  Max drawdown    : {metrics['max_drawdown_pct']:.2f}%")
    print(f"  Trades          : {metrics['n_trades']}")
    print(f"  Win rate        : {metrics['win_rate_pct']:.1f}%")
    pf = metrics.get("profit_factor")
    print(f"  Profit factor   : {pf:.3f}" if pf else "  Profit factor   : N/A")
    print(f"  Avg win         : ${metrics['avg_win']:,.2f}")
    print(f"  Avg loss        : ${metrics['avg_loss']:,.2f}")
    print(f"{'='*60}\n")
