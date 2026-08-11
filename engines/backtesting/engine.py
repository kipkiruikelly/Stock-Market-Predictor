"""
engines/backtesting/engine.py
Walk-forward backtesting engine. Consolidates backtest.py and backtester.py.

Two entry points:
  run_backtest(ticker, ...)       → Web/API result dict (from backtester.py)
  run_cli_backtest(ticker, ...)   → Terminal summary + optional chart (from backtest.py)

Signal architecture (ICT has highest priority):
  1. ICT gate  — directional bias (200 SMA + market structure) required to trade
  2. ICT score — OBs, FVGs, liquidity sweeps, PD zone (max weight)
  3. ML score  — LR + RF directional agreement (confirmation)
  4. Tech score — RSI, MACD, EMA (confirmation)
  Entry when: ICT bias present AND ICT score >= 3 AND total score >= 5
"""

import os
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import joblib
import yfinance as yf
import ta

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "Saved Models")

# ── Constants ──────────────────────────────────────────────────────────────────
WARMUP_BARS      = 100
MAX_HOLD         = 10
SL_ATR_MULT      = 1.5
TP_ATR_MULT      = 2.5
MAX_POSITIONS    = 2
DAILY_LOSS_LIMIT = 0.05

_SL_ATR_MULT = 1.0   # backtester.py tighter stops
_TP_ATR_MULT = 3.0
_COOLDOWN    = 3


# ── Shared model loading ───────────────────────────────────────────────────────

def _load_models_backtest(ticker: str):
    """Load LR, RF, scaler, feature_cols for backtesting (no suffix → daily)."""
    t = ticker.upper()
    lr_path   = os.path.join(MODELS_DIR, f"lr_model_{t}.pkl")
    rf_path   = os.path.join(MODELS_DIR, f"rf_model_{t}.pkl")
    sc_path   = os.path.join(MODELS_DIR, f"scaler_sklearn_{t}.pkl")
    feat_path = os.path.join(MODELS_DIR, f"feature_cols_sklearn_{t}.pkl")

    lr   = joblib.load(lr_path)   if os.path.exists(lr_path)   else None
    rf   = joblib.load(rf_path)   if os.path.exists(rf_path)   else None
    sc   = joblib.load(sc_path)   if os.path.exists(sc_path)   else None
    feat = joblib.load(feat_path) if os.path.exists(feat_path) else []
    return lr, rf, sc, feat


# ── Standalone feature builder (no external imports from predictor) ────────────

def _build_features_standalone(df: pd.DataFrame) -> pd.DataFrame:
    """Self-contained feature engineering for CLI backtest (mirrors predictor)."""
    df = df.copy()
    c, h, l, v = df["Close"], df["High"], df["Low"], df["Volume"]

    atr14 = ta.volatility.AverageTrueRange(h, l, c, window=14).average_true_range()
    df["ATR_14"] = atr14.fillna(c * 0.01)

    for p in [5, 10, 20, 50, 200]:
        df[f"SMA_{p}"] = ta.trend.sma_indicator(c, window=p)
    df["SMA_7"]  = ta.trend.sma_indicator(c, window=7)
    df["SMA_21"] = ta.trend.sma_indicator(c, window=21)
    df["EMA_9"]  = ta.trend.ema_indicator(c, window=9)
    df["EMA_21"] = ta.trend.ema_indicator(c, window=21)

    df["RSI_14"]    = ta.momentum.rsi(c, window=14)
    macd_ind        = ta.trend.MACD(c, window_fast=12, window_slow=26, window_sign=9)
    df["MACD"]      = macd_ind.macd()
    df["MACD_Sig"]  = macd_ind.macd_signal()
    df["MACD_Diff"] = macd_ind.macd_diff()
    df["MACD_Hist"] = df["MACD_Diff"]

    bb = ta.volatility.BollingerBands(c, window=20, window_dev=2)
    df["BB_Upper"] = bb.bollinger_hband()
    df["BB_Lower"] = bb.bollinger_lband()
    df["BB_Pos"]   = (c - df["BB_Lower"]) / (df["BB_Upper"] - df["BB_Lower"] + 1e-8)

    vma20          = v.rolling(20, min_periods=1).mean()
    df["Volume_r"] = v / (vma20 + 1)
    df["OBV"]      = ta.volume.on_balance_volume(c, v)
    df["Returns"]  = c.pct_change()

    sh20 = h.rolling(20).max();  sl20 = l.rolling(20).min()
    sh60 = h.rolling(60).max();  sl60 = l.rolling(60).min()
    df["Structure_Bullish"] = (sh20 > sh60.shift(20)).astype(int)
    df["Above_200SMA"]      = (c > df["SMA_200"]).astype(int)

    rng60 = (sh60 - sl60).replace(0, np.nan)
    df["PD_Position"] = ((c - sl60) / rng60).fillna(0.5).clip(0, 1)

    bull_fvg = (l > h.shift(2)).astype(int)
    bear_fvg = (h < l.shift(2)).astype(int)
    df["Bull_FVG_Count"] = bull_fvg.rolling(10, min_periods=1).sum()
    df["Bear_FVG_Count"] = bear_fvg.rolling(10, min_periods=1).sum()

    body = (c - df["Open"]).abs();  rng = (h - l).replace(0, np.nan)
    df["Body_Ratio"]   = (body / rng).fillna(0).clip(0, 1)
    df["Displacement"] = ((rng.fillna(0) > atr14 * 1.5) & (df["Body_Ratio"] > 0.6)).astype(int)
    bear_c = (c < df["Open"]);  bull_c = (c > df["Open"])
    bull_ob = (bear_c.shift(1).fillna(False)) & (df["Displacement"] == 1) & bull_c
    bear_ob = (bull_c.shift(1).fillna(False)) & (df["Displacement"] == 1) & bear_c
    df["Bull_OB_Count"] = bull_ob.astype(int).rolling(10, min_periods=1).sum()
    df["Bear_OB_Count"] = bear_ob.astype(int).rolling(10, min_periods=1).sum()

    tol  = c * 0.001
    r10h = h.rolling(10).max().shift(1)
    r10l = l.rolling(10).min().shift(1)
    df["Swept_High"] = ((h > sh20.shift(1)) & (c < sh20.shift(1))).astype(int)
    df["Swept_Low"]  = ((l < sl20.shift(1)) & (c > sl20.shift(1))).astype(int)
    df["Equal_Highs"] = ((h - r10h).abs() < tol).astype(int)
    df["Equal_Lows"]  = ((l - r10l).abs() < tol).astype(int)

    rng20 = (sh20 - sl20).replace(0, np.nan)
    df["In_OTE_Buy"]  = ((c >= sh20 - rng20 * 0.79) & (c <= sh20 - rng20 * 0.62)).astype(int)
    df["In_OTE_Sell"] = ((c >= sl20 + rng20 * 0.62) & (c <= sl20 + rng20 * 0.79)).astype(int)

    df["Daily_Return"] = df["Returns"] * 100
    df.dropna(inplace=True)
    return df


# ── Signal generators ──────────────────────────────────────────────────────────

def _tech_signal(row) -> int:
    """RSI + MACD + EMA technical score: +1 bull, -1 bear, 0 neutral."""
    score = 0
    rsi = row.get("RSI_14", 50)
    if rsi < 40:   score += 1
    elif rsi > 60: score -= 1
    if row.get("MACD_Hist", 0) > 0: score += 1
    else:                            score -= 1
    if row.get("Close", 0) > row.get("EMA_21", 0): score += 1
    else:                                            score -= 1
    return score


def _ml_signal_bt(row, lr, rf, scaler, feat_cols) -> int:
    """LR + RF directional agreement: +2 both up, -2 both down, 0 disagree."""
    if lr is None or rf is None or scaler is None or not feat_cols:
        return 0
    try:
        vals = [row.get(f, 0) for f in feat_cols]
        X = scaler.transform([vals])
        lr_pred = float(lr.predict(X)[0])
        rf_pred = float(rf.predict(X)[0])
        price   = float(row.get("Close", 1))
        lr_up = lr_pred > price if lr_pred > 10 else lr_pred > 0
        rf_up = rf_pred > 0
        if lr_up and rf_up:   return 2
        if not lr_up and not rf_up: return -2
        return 0
    except Exception:
        return 0


def _ict_signal(row) -> tuple:
    """ICT confluence scoring. Returns (bias, score) where bias is 1/0/-1
    and score is 0-6."""
    above_200   = int(row.get("Above_200SMA", 0))
    struct_bull = int(row.get("Structure_Bullish", 0))

    if above_200 and struct_bull:
        bias = 1
    elif not above_200 and not struct_bull:
        bias = -1
    else:
        bias = 0

    if bias == 0:
        return bias, 0

    score = 0
    pd_pos = float(row.get("PD_Position", 0.5))

    if bias == 1:
        if pd_pos <= 0.4:              score += 2   # discount zone
        if row.get("Bull_OB_Count", 0) > 0: score += 2
        if row.get("Bull_FVG_Count", 0) > 0: score += 1
        if row.get("Swept_Low", 0):    score += 2
        if row.get("Displacement", 0) and row.get("Close", 0) > row.get("Open", 0): score += 1
        if row.get("In_OTE_Buy", 0):   score += 1
    else:
        if pd_pos >= 0.6:              score += 2   # premium zone
        if row.get("Bear_OB_Count", 0) > 0: score += 2
        if row.get("Bear_FVG_Count", 0) > 0: score += 1
        if row.get("Swept_High", 0):   score += 2
        if row.get("Displacement", 0) and row.get("Close", 0) < row.get("Open", 0): score += 1
        if row.get("In_OTE_Sell", 0):  score += 1

    return bias, score


def _fuse(ict_bias, ict_score, ml_score, tech_score,
          ict_thresh=3, total_thresh=5) -> str:
    """Triple-layer signal fusion. ICT acts as gate."""
    if ict_bias == 0:
        return "HOLD"
    total = ict_score + ml_score + tech_score
    if ict_score < ict_thresh or total < total_thresh:
        return "HOLD"
    return "BUY" if ict_bias == 1 else "SELL"


# ── Position tracker ───────────────────────────────────────────────────────────

class _Pos:
    """Lightweight walk-forward position."""
    def __init__(self, side, entry, sl, tp, qty, date):
        self.side    = side
        self.entry   = entry
        self.sl      = sl
        self.tp      = tp
        self.qty     = qty
        self.date    = date
        self.bars    = 0

    def try_close(self, high, low, close, max_hold):
        """Returns (reason, exit_price) or (None, None)."""
        self.bars += 1
        if self.side == "BUY":
            if low <= self.sl:
                return "SL", self.sl
            if high >= self.tp:
                return "TP", self.tp
        else:
            if high >= self.sl:
                return "SL", self.sl
            if low <= self.tp:
                return "TP", self.tp
        if self.bars >= max_hold:
            return "TIMEOUT", close
        return None, None


# ── CLI walk-forward backtest (from backtest.py) ───────────────────────────────

def run_cli_backtest(
    ticker: str = "QQQ",
    start:  str = "2022-01-01",
    end:    str = "2024-12-31",
    initial_capital: float = 100_000,
    risk_pct: float = 1.0,
    signal_mode: str = "fused",
    no_plot: bool = False,
    save_trades: str = None,
    save_chart:  str = None,
) -> dict:
    """Walk-forward backtest with CLI-style output. Returns metrics dict."""
    t = ticker.upper()
    df_raw = yf.download(t, start=start, end=end, progress=False, auto_adjust=True)
    if df_raw.empty:
        raise ValueError(f"No data for {ticker} between {start}–{end}")
    df = _build_features_standalone(df_raw)

    lr, rf, sc, feat_cols = _load_models_backtest(t)

    equity      = initial_capital
    positions   = []
    trades      = []
    equity_log  = [(df.index[0], equity)]
    daily_start = equity

    for i in range(WARMUP_BARS, len(df)):
        row   = df.iloc[i]
        dt    = df.index[i]
        atr   = float(row["ATR_14"]) if float(row["ATR_14"]) > 0 else float(row["Close"]) * 0.01

        # Reset daily loss counter at new day
        if i > WARMUP_BARS and df.index[i].date() != df.index[i - 1].date():
            daily_start = equity

        # --- Exits ---
        new_positions = []
        for p in positions:
            reason, exit_px = p.try_close(
                float(row["High"]), float(row["Low"]), float(row["Close"]), MAX_HOLD)
            if reason:
                pnl = p.qty * ((exit_px - p.entry) if p.side == "BUY" else (p.entry - exit_px))
                equity += pnl
                trades.append({"date": dt, "side": p.side, "entry": p.entry,
                               "exit": exit_px, "pnl": pnl, "reason": reason})
            else:
                new_positions.append(p)
        positions = new_positions

        equity_log.append((dt, equity))

        # --- Daily loss breaker ---
        if daily_start > 0 and (daily_start - equity) / daily_start >= DAILY_LOSS_LIMIT:
            continue

        # --- Signal ---
        if signal_mode == "ict":
            bias, ict_sc = _ict_signal(row)
            action = ("BUY" if bias == 1 else "SELL") if ict_sc >= 3 and bias != 0 else "HOLD"
        elif signal_mode == "ml":
            bias, ict_sc = _ict_signal(row)
            ml_sc = _ml_signal_bt(row, lr, rf, sc, feat_cols)
            action = _fuse(bias, ict_sc, ml_sc, 0, ict_thresh=3, total_thresh=4)
        elif signal_mode == "tech":
            bias, ict_sc = _ict_signal(row)
            tech_sc = _tech_signal(row)
            action = _fuse(bias, ict_sc, 0, tech_sc, ict_thresh=3, total_thresh=4)
        else:  # fused (default)
            bias, ict_sc = _ict_signal(row)
            ml_sc   = _ml_signal_bt(row, lr, rf, sc, feat_cols)
            tech_sc = _tech_signal(row)
            action  = _fuse(bias, ict_sc, ml_sc, tech_sc)

        if action == "HOLD" or len(positions) >= MAX_POSITIONS:
            continue

        # --- Entry ---
        entry_px = float(row["Close"])
        sl = entry_px - SL_ATR_MULT * atr if action == "BUY" else entry_px + SL_ATR_MULT * atr
        tp = entry_px + TP_ATR_MULT * atr if action == "BUY" else entry_px - TP_ATR_MULT * atr
        risk_amt = equity * risk_pct / 100.0
        qty = risk_amt / (SL_ATR_MULT * atr) if atr > 0 else 0
        if qty <= 0:
            continue

        positions.append(_Pos(action, entry_px, sl, tp, qty, dt))

    # Force-close remaining positions at last bar
    last = df.iloc[-1]
    for p in positions:
        exit_px = float(last["Close"])
        pnl = p.qty * ((exit_px - p.entry) if p.side == "BUY" else (p.entry - exit_px))
        equity += pnl
        trades.append({"date": df.index[-1], "side": p.side, "entry": p.entry,
                       "exit": exit_px, "pnl": pnl, "reason": "EOD"})

    equity_arr = np.array([e for _, e in equity_log])
    peak        = np.maximum.accumulate(equity_arr)
    drawdown    = (equity_arr - peak) / (peak + 1e-8)
    max_dd      = float(drawdown.min()) * 100

    pnls     = [t["pnl"] for t in trades]
    wins     = [p for p in pnls if p > 0]
    losses   = [p for p in pnls if p < 0]
    gross_w  = sum(wins)
    gross_l  = abs(sum(losses))

    metrics = {
        "ticker":           ticker,
        "start":            start,
        "end":              end,
        "signal_mode":      signal_mode,
        "initial_capital":  initial_capital,
        "final_equity":     round(equity, 2),
        "total_return_pct": round((equity / initial_capital - 1) * 100, 2),
        "max_drawdown_pct": round(max_dd, 2),
        "n_trades":         len(trades),
        "win_rate_pct":     round(len(wins) / len(trades) * 100, 1) if trades else 0.0,
        "profit_factor":    round(gross_w / gross_l, 3) if gross_l > 0 else None,
        "avg_win":          round(gross_w / len(wins), 2) if wins else 0.0,
        "avg_loss":         round(-gross_l / len(losses), 2) if losses else 0.0,
    }

    if save_trades:
        pd.DataFrame(trades).to_csv(save_trades, index=False)

    return metrics


# ── Web/API backtest (from backtester.py) ─────────────────────────────────────

def _ict_score_web(row, direction: str) -> int:
    """Score 6 ICT confluences for the web backtester (stricter OTE/CE scoring)."""
    score = 0
    pd_pos = float(row.get("PD_Position", 0.5))
    if direction == "BUY":
        if row.get("In_OTE_Buy", 0):    score += 2
        if row.get("Bull_FVG_Count", 0) > 0: score += 1
        if row.get("Bull_OB_Count", 0) > 0:  score += 2
        if row.get("Swept_Low", 0):          score += 1
        if row.get("CE_Bull_Dist", 0) > 0:   score += 1
        ipda = row.get("IPDA_20_L", 0)
        if ipda and ipda < 2:                score += 1
    else:
        if row.get("In_OTE_Sell", 0):        score += 2
        if row.get("Bear_FVG_Count", 0) > 0: score += 1
        if row.get("Bear_OB_Count", 0) > 0:  score += 2
        if row.get("Swept_High", 0):         score += 1
        if row.get("CE_Bear_Dist", 0) > 0:   score += 1
        ipda = row.get("IPDA_20_H", 0)
        if ipda and ipda < 2:                score += 1
    return score


def _generate_signals(df, lr, rf, scaler, feat_cols):
    """Bar-by-bar signal generation for the web backtester."""
    signals = []
    cooldown = 0
    for i in range(WARMUP_BARS, len(df)):
        row = df.iloc[i]
        if cooldown > 0:
            signals.append("HOLD")
            cooldown -= 1
            continue

        above_200   = int(row.get("Above_200SMA", 0))
        struct_bull = int(row.get("Structure_Bullish", 0))
        bias = None
        if above_200 and struct_bull:
            bias = "BUY"
        elif not above_200 and not struct_bull:
            bias = "SELL"

        if bias is None:
            signals.append("HOLD")
            continue

        ict_sc = _ict_score_web(row, bias)
        if ict_sc < 3:
            signals.append("HOLD")
            continue

        ml_sc = _ml_signal_bt(row, lr, rf, scaler, feat_cols)
        if (bias == "BUY" and ml_sc < 0) or (bias == "SELL" and ml_sc > 0):
            cooldown = _COOLDOWN
            signals.append("HOLD")
            continue

        signals.append(bias)

    # Pad start with HOLDs
    pad = len(df) - len(signals)
    return ["HOLD"] * pad + signals


def _simulate(df, signals, initial_capital, risk_pct):
    """Walk-forward simulation for the web backtester."""
    equity    = initial_capital
    positions = []
    trades    = []
    equity_log = []

    for i, action in enumerate(signals):
        row   = df.iloc[i]
        dt    = df.index[i]
        price = float(row["Close"])
        high  = float(row["High"])
        low   = float(row["Low"])
        atr   = float(row.get("ATR_14", price * 0.01))

        # Exits
        new_pos = []
        for p in positions:
            reason, exit_px = p.try_close(high, low, price, MAX_HOLD)
            if reason:
                pnl = p.qty * ((exit_px - p.entry) if p.side == "BUY" else (p.entry - exit_px))
                equity += pnl
                trades.append({"date": str(dt.date()), "side": p.side,
                               "entry": round(p.entry, 4), "exit": round(exit_px, 4),
                               "pnl": round(pnl, 2), "reason": reason})
            else:
                new_pos.append(p)
        positions = new_pos

        equity_log.append(round(equity, 2))

        if action == "HOLD" or len(positions) >= MAX_POSITIONS:
            continue

        sl = price - _SL_ATR_MULT * atr if action == "BUY" else price + _SL_ATR_MULT * atr
        tp = price + _TP_ATR_MULT * atr if action == "BUY" else price - _TP_ATR_MULT * atr
        qty = (equity * risk_pct / 100.0) / (_SL_ATR_MULT * atr) if atr > 0 else 0
        if qty > 0:
            positions.append(_Pos(action, price, sl, tp, qty, dt))

    # Close remaining
    if df is not None and len(df) > 0:
        last_price = float(df.iloc[-1]["Close"])
        for p in positions:
            pnl = p.qty * ((last_price - p.entry) if p.side == "BUY" else (p.entry - last_price))
            equity += pnl
            trades.append({"date": str(df.index[-1].date()), "side": p.side,
                           "entry": round(p.entry, 4), "exit": round(last_price, 4),
                           "pnl": round(pnl, 2), "reason": "EOD"})
        equity_log.append(round(equity, 2))

    return equity, trades, equity_log


def _max_drawdown(equity_series):
    eq   = np.array(equity_series)
    peak = np.maximum.accumulate(eq)
    dd   = (eq - peak) / (peak + 1e-8)
    return float(dd.min()) * 100


def _sharpe(equity_series):
    eq   = np.array(equity_series, dtype=float)
    rets = np.diff(eq) / (eq[:-1] + 1e-8)
    if len(rets) < 2 or rets.std() == 0:
        return None
    return round(float(rets.mean() / rets.std() * np.sqrt(252)), 3)


def _monthly_returns(df_idx, equity_log):
    if len(df_idx) != len(equity_log):
        return {}
    s = pd.Series(equity_log, index=df_idx[:len(equity_log)])
    monthly = s.resample("ME").last().pct_change().dropna()
    return {str(d.date()): round(float(v) * 100, 2) for d, v in monthly.items()}


def _bh_curve(df, initial_capital):
    prices = df["Close"].values
    if len(prices) == 0:
        return []
    qty = initial_capital / prices[0]
    return [round(float(qty * p), 2) for p in prices]


def run_backtest(
    ticker: str,
    interval: str = "1d",
    period: str = "2y",
    initial_capital: float = 100_000,
    risk_pct: float = 1.0,
) -> dict:
    """Web/API backtester. Returns JSON-friendly dict with equity curve,
    monthly returns, trade log, and performance metrics."""
    from engines.prediction.core import build_features, _load_models

    ticker = ticker.upper()
    try:
        lr, rf, scaler, feature_cols, *_ = _load_models(ticker, interval)
    except Exception:
        lr = rf = scaler = None
        feature_cols = []

    # Fetch data via yfinance (period/interval already validated by caller)
    raw = yf.download(ticker, period=period, interval=interval,
                      progress=False, auto_adjust=True)
    if raw.empty or len(raw) < WARMUP_BARS + 10:
        return {"error": f"Insufficient data for {ticker} at {interval}"}

    try:
        df = build_features(raw, interval=interval, ticker=ticker)
    except Exception:
        df = _build_features_standalone(raw)

    signals     = _generate_signals(df, lr, rf, scaler, feature_cols)
    final_eq, trades, equity_log = _simulate(df, signals, initial_capital, risk_pct)

    pnls    = [t["pnl"] for t in trades]
    wins    = [p for p in pnls if p > 0]
    losses  = [p for p in pnls if p < 0]
    gross_w = sum(wins)
    gross_l = abs(sum(losses))

    return {
        "ticker":            ticker,
        "interval":          interval,
        "period":            period,
        "initial_capital":   initial_capital,
        "final_equity":      round(final_eq, 2),
        "total_return_pct":  round((final_eq / initial_capital - 1) * 100, 2),
        "max_drawdown_pct":  round(_max_drawdown(equity_log), 2),
        "sharpe":            _sharpe(equity_log),
        "n_trades":          len(trades),
        "win_rate_pct":      round(len(wins) / len(trades) * 100, 1) if trades else 0.0,
        "profit_factor":     round(gross_w / gross_l, 3) if gross_l > 0 else None,
        "avg_win":           round(gross_w / len(wins), 2) if wins else 0.0,
        "avg_loss":          round(-gross_l / len(losses), 2) if losses else 0.0,
        "equity_curve":      equity_log,
        "buy_hold_curve":    _bh_curve(df, initial_capital),
        "monthly_returns":   _monthly_returns(df.index[:len(equity_log)], equity_log),
        "trades":            trades[-100:],  # return last 100 trades to keep payload small
    }
