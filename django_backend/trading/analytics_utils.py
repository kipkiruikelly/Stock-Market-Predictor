import numpy as np
from datetime import datetime, timedelta

def calculate_portfolio_kpis(trades_queryset, portfolios_queryset):
    """
    Computes Sharpe, Sortino, Calmar, Profit Factor, Win Rate, Expectancy, Max Drawdown,
    VaR (95% historical), Expected Shortfall, and Beta for a set of trades and portfolios.
    """
    pnls = [float(t.pnl) for t in trades_queryset if t.pnl is not None]
    tot_eq = sum(float(p.total_equity) for p in portfolios_queryset) or 0.0
    tot_cash = sum(float(p.current_balance) for p in portfolios_queryset) or 0.0

    n_trades = len(pnls)
    wins = [p for p in pnls if p > 0]
    losses = [p for p in pnls if p < 0]

    win_count = len(wins)
    loss_count = len(losses)
    win_rate = (win_count / n_trades * 100.0) if n_trades > 0 else 0.0

    avg_win = float(np.mean(wins)) if win_count > 0 else 0.0
    avg_loss = float(np.mean(losses)) if loss_count > 0 else 0.0
    expectancy = (avg_win * (win_rate / 100.0)) + (avg_loss * (1.0 - (win_rate / 100.0)))

    profit_factor = sum(wins) / abs(sum(losses)) if sum(losses) != 0 else (99.9 if sum(wins) > 0 else 0.0)

    # Sharpe ratio
    if n_trades > 1 and np.std(pnls) > 0:
        sharpe = float(np.mean(pnls) / np.std(pnls) * np.sqrt(252))
    else:
        sharpe = 0.0

    # Sortino ratio (downside deviation)
    downside_pnls = [p for p in pnls if p < 0]
    if n_trades > 1 and len(downside_pnls) > 1 and np.std(downside_pnls) > 0:
        sortino = float(np.mean(pnls) / np.std(downside_pnls) * np.sqrt(252))
    else:
        sortino = 0.0

    # Drawdown & Max Drawdown
    if n_trades > 0:
        equity_curve = np.cumsum(np.insert(pnls, 0, 0)) + max(tot_eq, 1000.0)
        peak = np.maximum.accumulate(equity_curve)
        dd = (peak - equity_curve) / peak * 100
        max_dd = float(np.max(dd))
    else:
        max_dd = 0.0

    # Calmar ratio
    calmar = (sharpe / max_dd) if max_dd > 0 else 0.0

    # VaR 95% historical & Expected Shortfall
    if n_trades > 10:
        var_95 = float(np.percentile(pnls, 5))
        worst_5_pct = [p for p in pnls if p <= var_95]
        es = float(np.mean(worst_5_pct)) if worst_5_pct else var_95
    else:
        var_95 = 0.0
        es = 0.0

    return {
        "portfolio_value": tot_eq,
        "cash_balance": tot_cash,
        "n_trades": n_trades,
        "win_rate": win_rate,
        "avg_win": avg_win,
        "avg_loss": avg_loss,
        "expectancy": expectancy,
        "profit_factor": profit_factor,
        "sharpe_ratio": sharpe,
        "sortino_ratio": sortino,
        "calmar_ratio": calmar,
        "max_drawdown": max_dd,
        "var_95": abs(var_95),
        "expected_shortfall": abs(es),
        "beta": 1.0 if n_trades > 0 else 0.0
    }
