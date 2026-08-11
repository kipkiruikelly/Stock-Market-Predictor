"""
engines/paper_trading/config.py
Configuration constants and defaults for the paper trading engine.
"""

# Simulated currency for all virtual portfolios
SIM_CURRENCY = "KES"

# Built-in strategy slugs
BUILTIN_STRATEGIES = ("ml_ensemble", "alpha_rules")

# Minimum closed trades before ratio metrics are reported (honesty gate)
MIN_TRADES = 10

# Default engine configuration. Every value here is visible on the
# public Strategy Rules page so users can audit exactly how trades fire.
DEFAULT_CONFIG = {
    "starting_balance":       1_000_000.0,  # VIRTUAL KES
    "risk_pct":               1.0,          # % of virtual equity risked per trade
    "max_positions":          5,            # per strategy
    "max_class_exposure_pct": 40.0,         # max % of equity notional in one asset class
    "daily_loss_breaker_pct": 5.0,          # pause new entries after this daily drawdown
    "spread_bps":             5.0,          # simulated half-spread+slippage per side, bps
    "commission_bps":         10.0,         # simulated commission per side, bps of notional
    "stop_atr_mult":          1.5,
    "target_atr_mult":        2.5,
    "max_hold_hours":         240,           # 10 days
    "min_confidence":         55.0,          # ML strategy entry floor
    "alpha_entry_threshold":  0.5,           # composite+rank blend needed to enter
    "alpha_rank_weight":      0.5,           # blend: score*(1-w) + rank*w
    "pyth_wide_conf_pct":     0.30,          # confidence filter kicks in above this
    "tickers": [
        "QQQ", "SPY", "DIA", "AAPL", "MSFT", "TSLA", "NVDA",
        "GOOGL", "AMZN", "META", "BTC", "ETH",
    ],
}

# Asset class sets for market-hours gating
CRYPTO = {
    "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "AVAX", "DOGE", "DOT",
    "LINK", "LTC", "MATIC", "SHIB", "UNI", "ATOM",
}
FOREX = {
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF",
    "NZDUSD", "EURGBP", "EURJPY", "GBPJPY", "USDMXN", "USDZAR",
    "XAUUSD", "XAGUSD",
}
COMMODITY = {
    "GOLD", "SILVER", "OIL", "BRENT", "NATGAS", "COPPER",
    "PLATINUM", "PALLADIUM", "WHEAT", "CORN", "SOYBEAN",
    "COTTON", "SUGAR", "COCOA", "COFFEE",
}
INDEX = {"NDX", "SPX", "DJI", "VIX", "RUT", "FTSE", "DAX", "NIKKEI", "HSI"}
ETF = {
    "QQQ", "SPY", "DIA", "IWM", "GLD", "XLK", "XLV", "XLF", "XLY",
    "XLI", "XLE", "XLP", "XLRE", "XLB", "XLU", "XLC",
}

# Config bounds used by save_config for clamping
CONFIG_BOUNDS = {
    "starting_balance":       (10_000.0, 1e9),
    "risk_pct":               (0.1, 5.0),
    "max_positions":          (1, 20),
    "max_class_exposure_pct": (5.0, 100.0),
    "daily_loss_breaker_pct": (1.0, 20.0),
    "spread_bps":             (0.0, 100.0),
    "commission_bps":         (0.0, 100.0),
    "stop_atr_mult":          (0.5, 5.0),
    "target_atr_mult":        (0.5, 10.0),
    "max_hold_hours":         (1, 24 * 60),
    "min_confidence":         (50.0, 95.0),
    "alpha_entry_threshold":  (0.1, 2.0),
    "alpha_rank_weight":      (0.0, 1.0),
    "pyth_wide_conf_pct":     (0.05, 5.0),
}
