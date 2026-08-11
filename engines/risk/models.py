"""
engines/risk/models.py
Data model dataclasses for the risk management engine.
"""

from dataclasses import dataclass, field
from typing import List


@dataclass
class TradeRecord:
    """Historical trade for Kelly criterion and performance tracking."""
    entry_date: str
    exit_date: str
    action: str
    pnl: float
    r_multiple: float = 0.0  # P&L / initial risk


@dataclass
class RiskState:
    """Current risk state snapshot for dynamic position sizing decisions."""
    account_equity: float
    account_balance: float
    daily_pnl: float
    daily_start_equity: float
    peak_equity: float
    current_drawdown_pct: float
    max_drawdown_pct: float
    open_positions: int
    volatility_regime: str = "normal"  # low / normal / high / extreme
