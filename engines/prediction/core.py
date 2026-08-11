"""
engines/prediction/core.py
Shared ML inference layer for BullLogic. Extracted from predictor.py.

Public functions:
  run_prediction(ticker, interval="1d") → full result dict (Flask routes)
  ml_signal(ticker, interval="1d")      → compact trading signal dict
  build_features(df, interval, ticker, aux) → featured DataFrame
  available_models()                    → dict of {ticker: [intervals]}
  get_news_sentiment(ticker)            → float in [-1.0, 1.0]
  lw_time(ts, interval)                 → Lightweight Charts timestamp

Supported intervals:
  "1d"  — daily models (45 features, TA + ICT daily)
  "1h"  — hourly models (55 features, + kill zones + session)
"""

import os
import re
import json
import time
import threading
import warnings

warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import joblib
import yfinance as yf
import ta

import ict_features
from market_data import get_history

from engines.prediction.symbol_map import (
    YF_SYMBOL_MAP,
    TICKER_SECTOR_MAP,
    EQUITY_TICKERS,
    VIX_COLS,
    SECTOR_COLS,
    EARNINGS_COLS,
    AUX_COLS,
    FETCH_PERIOD,
    HTF_YF_PARAMS,
    MTF_SOURCES,
    MTF_COLS,
    INTERVAL_ORDER,
)

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "Saved Models")

# Per-(ticker, interval) model cache so we only load from disk once
_model_cache: dict = {}

# Cache for slow earnings dates: ticker → (timestamp, DatetimeIndex)
_yf_earnings_cache = {}
_yf_earnings_lock = threading.Lock()
YF_CACHE_TTL_EARNINGS = 86400  # 1 day


# ── Helpers ────────────────────────────────────────────────────────────────────

def _model_suffix(interval: str) -> str:
    return "" if interval == "1d" else f"_{interval}"


def lw_time(ts, interval: str = "1d"):
    """Timestamp in the format Lightweight Charts expects: 'YYYY-MM-DD' for
    daily bars, Unix seconds for intraday."""
    if interval == "1d":
        return ts.strftime("%Y-%m-%d")
    if ts.tzinfo is not None:
        return int(ts.timestamp())
    return int(pd.Timestamp(ts, tz="UTC").timestamp())


def _resample_4h(df: pd.DataFrame) -> pd.DataFrame:
    df = df.resample("4h", label="left", closed="left").agg(
        {"Open": "first", "High": "max", "Low": "min", "Close": "last", "Volume": "sum"}
    ).dropna(subset=["Open", "Close"])
    return df[df["Volume"] > 0]


# ── Model loading ──────────────────────────────────────────────────────────────

def available_models() -> dict:
    """Ticker → sorted list of intervals with a trained model on disk.

    Scans Saved Models/ directly (ground truth) rather than any cached
    manifest, so it's always accurate even for models trained outside the
    usual training scripts.
    """
    pattern = re.compile(r"^lr_model_(.+?)(?:_(1h|4h|1w|30m|15m|5m|1m))?\.pkl$")
    by_ticker: dict = {}
    for fname in os.listdir(MODELS_DIR):
        m = pattern.match(fname)
        if not m:
            continue
        ticker, suffix = m.group(1), m.group(2)
        by_ticker.setdefault(ticker, set()).add(suffix or "1d")
    return {
        t: sorted(ivs, key=INTERVAL_ORDER.index)
        for t, ivs in sorted(by_ticker.items())
    }


def _infer_model(model, X: np.ndarray, current_price: float):
    """Return (price_target, return_pct, prob_up) compatible with any model type."""
    if hasattr(model, "classes_"):                        # classifier
        probs = np.ravel(model.predict_proba(X))
        prob_up = float(probs[-1]) if len(probs) > 1 else float(probs[0])
        ret_pct = (prob_up - 0.5) * 4                    # maps [0,1] → [-2%, +2%]
        return current_price * (1 + ret_pct / 100), ret_pct, prob_up

    raw_pred = np.ravel(model.predict(X))
    pred = float(raw_pred[0])                            # regressor
    if pred > 10:                                        # LR → next close price
        ret_pct = (pred - current_price) / current_price * 100
        return pred, ret_pct, pred > current_price
    return current_price * (1 + pred / 100), pred, pred > 0  # RF → next return %


def _load_models(ticker: str, interval: str = "1d"):
    """Return (lr, rf, scaler, feature_cols, xgb, lgb, stacking, lstm), cached."""
    key = (ticker.upper(), interval)
    if key in _model_cache:
        return _model_cache[key]

    suffix = _model_suffix(interval)
    t = ticker.upper()

    lr_path   = os.path.join(MODELS_DIR, f"lr_model_{t}{suffix}.pkl")
    rf_path   = os.path.join(MODELS_DIR, f"rf_model_{t}{suffix}.pkl")
    sc_path   = os.path.join(MODELS_DIR, f"scaler_sklearn_{t}{suffix}.pkl")
    feat_path = os.path.join(MODELS_DIR, f"feature_cols_sklearn_{t}{suffix}.pkl")

    if not (os.path.exists(lr_path) and os.path.exists(rf_path)):
        try:
            import sys
            _tr_dir = os.path.join(BASE_DIR, "src", "training")
            if _tr_dir not in sys.path:
                sys.path.insert(0, _tr_dir)
            import train_all_tickers as T
            T.train_ticker(t, interval)
        except Exception:
            pass

    if not (os.path.exists(lr_path) and os.path.exists(rf_path)):
        try:
            import train_all_tickers as T
            T.train_ticker(t, interval)
        except Exception:
            pass

    lr   = joblib.load(lr_path) if os.path.exists(lr_path) else None
    rf   = joblib.load(rf_path) if os.path.exists(rf_path) else None
    sc   = joblib.load(sc_path) if os.path.exists(sc_path) else None
    feat = joblib.load(feat_path) if os.path.exists(feat_path) else []

    # Optional: XGBoost
    xgb_path = os.path.join(MODELS_DIR, f"xgb_model_{t}{suffix}.pkl")
    xgb = joblib.load(xgb_path) if os.path.exists(xgb_path) else None

    # Optional: LightGBM
    lgb_path = os.path.join(MODELS_DIR, f"lgb_model_{t}{suffix}.pkl")
    lgb = joblib.load(lgb_path) if os.path.exists(lgb_path) else None

    # Optional: Stacking ensemble
    stacking = None
    stacking_meta_path = os.path.join(MODELS_DIR, f"stacking_meta_{t}{suffix}.pkl")
    if os.path.exists(stacking_meta_path):
        try:
            stacking = {
                "meta":      joblib.load(stacking_meta_path),
                "scaler":    joblib.load(os.path.join(MODELS_DIR, f"stacking_meta_scaler_{t}{suffix}.pkl")),
                "top10_idx": joblib.load(os.path.join(MODELS_DIR, f"stacking_top10_idx_{t}{suffix}.pkl")),
                "meta_cols": joblib.load(os.path.join(MODELS_DIR, f"stacking_meta_cols_{t}{suffix}.pkl")),
            }
        except Exception:
            stacking = None

    # Optional: LSTM
    lstm = None
    lstm_path = os.path.join(MODELS_DIR, f"lstm_model_{t}{suffix}.h5")
    if os.path.exists(lstm_path):
        try:
            os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
            import tensorflow as tf
            lstm = tf.keras.models.load_model(lstm_path)
        except Exception:
            lstm = None

    _model_cache[key] = (lr, rf, sc, feat, xgb, lgb, stacking, lstm)
    return lr, rf, sc, feat, xgb, lgb, stacking, lstm


# ── Data fetching ──────────────────────────────────────────────────────────────

def _cached_yf_earnings(ticker: str) -> pd.DatetimeIndex:
    ticker_upper = ticker.upper()
    now = time.time()
    with _yf_earnings_lock:
        if ticker_upper in _yf_earnings_cache:
            ts, val = _yf_earnings_cache[ticker_upper]
            if now - ts < YF_CACHE_TTL_EARNINGS:
                return val
    try:
        raw = yf.Ticker(ticker).earnings_dates
        if raw is not None and not raw.empty:
            idx = raw.index.tz_localize(None) if raw.index.tz else raw.index
            val = idx.normalize()
        else:
            val = pd.DatetimeIndex([])
    except Exception:
        val = pd.DatetimeIndex([])
    with _yf_earnings_lock:
        _yf_earnings_cache[ticker_upper] = (now, val)
    return val


def _fetch_df(ticker: str, interval: str = "1d") -> pd.DataFrame:
    if interval == "4h":
        df, _ = get_history(ticker, period="730d", interval="1h")
        return _resample_4h(df) if not df.empty else df
    period = FETCH_PERIOD.get(interval, "1y")
    df, _ = get_history(ticker, period=period, interval=interval)
    return df


def _fetch_aux(ticker: str, interval: str = "1d") -> dict:
    period = FETCH_PERIOD.get(interval, "18mo")
    if interval == "1d":
        period = "18mo"

    def _dl(sym):
        try:
            df, _ = get_history(sym, period=period, interval=interval)
            return df if not df.empty else None
        except Exception:
            return None

    vix    = _dl("^VIX")
    spy    = _dl("SPY") if ticker.upper() != "SPY" else None
    sec_id = TICKER_SECTOR_MAP.get(ticker.upper())
    sector = _dl(sec_id) if sec_id and sec_id.upper() not in (ticker.upper(), "SPY") else None
    earnings = _cached_yf_earnings(ticker)
    return {"vix": vix, "spy": spy, "sector": sector, "earnings": earnings}


def _fetch_htf_for_mtf(ticker: str, htf: str) -> "pd.DataFrame | None":
    """Fetch higher-timeframe data for MTF context injection during inference."""
    iv, period = HTF_YF_PARAMS.get(htf, ("1d", "18mo"))
    try:
        df, _ = get_history(ticker, period=period, interval=iv)
        if df.empty:
            return None
        if htf == "4h":
            df = _resample_4h(df)
        return df if not df.empty else None
    except Exception:
        return None


# ── Feature engineering ────────────────────────────────────────────────────────

def _add_base_ta(df: pd.DataFrame) -> pd.DataFrame:
    return ict_features.add_base_ta(df)


def _add_intraday_ict(df: pd.DataFrame) -> pd.DataFrame:
    return ict_features.add_intraday_ict(df)


def _apply_vix(df: pd.DataFrame, vix_df) -> pd.DataFrame:
    if vix_df is None or vix_df.empty:
        return df.assign(**{c: 0.0 for c in VIX_COLS})
    idx = df.index.normalize() if df.index.tz is None else df.index.tz_convert(None).normalize()
    vc  = vix_df["Close"].copy()
    vc.index = vc.index.normalize() if vc.index.tz is None else vc.index.tz_localize(None).normalize()
    vc = vc[~vc.index.duplicated(keep="last")]
    unique_idx = pd.DatetimeIndex(sorted(set(idx)))
    vc_filled  = vc.reindex(unique_idx, method="ffill")
    vix_map    = vc_filled.to_dict()
    vix = pd.Series([vix_map.get(d, 20.0) for d in idx], index=df.index).fillna(20.0)
    df["VIX_Level"]          = vix
    df["VIX_Change"]         = vix.pct_change().fillna(0) * 100
    df["VIX_Percentile_252"] = vix.rolling(252, min_periods=60).rank(pct=True).fillna(0.5)
    df["VIX_Regime"]         = pd.cut(df["VIX_Level"], bins=[0, 15, 25, 200],
                                       labels=[0, 1, 2]).astype(float).fillna(1.0)
    vma = vix.rolling(20, min_periods=5).mean()
    df["VIX_MA_Ratio"]       = (vix / vma.replace(0, np.nan)).fillna(1.0).clip(0.5, 2.0)
    return df


def _apply_sector(df: pd.DataFrame, sector_df, spy_df) -> pd.DataFrame:
    def _align(src):
        if src is None or src.empty:
            return None
        s = src["Close"].copy()
        s.index = s.index.normalize() if s.index.tz is None else s.index.tz_localize(None).normalize()
        s = s[~s.index.duplicated(keep="last")]
        ix = df.index.normalize() if df.index.tz is None else df.index.tz_convert(None).normalize()
        unique_ix = pd.DatetimeIndex(sorted(set(ix)))
        s_filled  = s.reindex(unique_ix, method="ffill")
        s_map     = s_filled.to_dict()
        return pd.Series([s_map.get(d, np.nan) for d in ix], index=df.index)

    sec = _align(sector_df)
    spy = _align(spy_df)
    ref = sec if sec is not None else spy
    if ref is None:
        return df.assign(**{c: 0.0 for c in SECTOR_COLS})

    tick = df["Close"]
    df["Sector_RS_20"]     = (tick.pct_change(20) - ref.pct_change(20)).fillna(0).clip(-0.5, 0.5)
    df["Sector_RS_60"]     = (tick.pct_change(60) - ref.pct_change(60)).fillna(0).clip(-0.5, 0.5)
    if sec is not None and spy is not None:
        df["Sector_vs_SPY_20"] = (sec.pct_change(20) - spy.pct_change(20)).fillna(0).clip(-0.3, 0.3)
    else:
        df["Sector_vs_SPY_20"] = 0.0
    df["Sector_Momentum"]  = ta.momentum.rsi(ref.ffill(), window=14).fillna(50)
    return df


def _apply_earnings(df: pd.DataFrame, earnings: pd.DatetimeIndex) -> pd.DataFrame:
    if earnings is None or len(earnings) == 0:
        return df.assign(**{c: 0.0 for c in EARNINGS_COLS})
    dates_arr = np.array(sorted(set(pd.DatetimeIndex(earnings).normalize())), dtype="datetime64[D]")
    ix_vals   = pd.DatetimeIndex(
        df.index.normalize() if df.index.tz is None else df.index.tz_convert(None).normalize()
    ).values.astype("datetime64[D]")
    dt, ds = [], []
    for d_np in ix_vals:
        future = dates_arr[dates_arr > d_np]
        past   = dates_arr[dates_arr <= d_np]
        dt.append(int((future[0] - d_np).astype(int)) if len(future) else 90)
        ds.append(int((d_np - past[-1]).astype(int)) if len(past) else 90)
    dt_s = pd.Series(dt, index=df.index, dtype=float).clip(0, 90)
    ds_s = pd.Series(ds, index=df.index, dtype=float).clip(0, 90)
    df["Days_To_Earnings"]     = dt_s
    df["Days_Since_Earnings"]  = ds_s
    df["Pre_Earnings_Window"]  = (dt_s <= 5).astype(float)
    df["Post_Earnings_Window"] = (ds_s <= 2).astype(float)
    return df


def build_features(df: pd.DataFrame, interval: str = "1d",
                   ticker: str = "", aux: dict = None) -> pd.DataFrame:
    """Build the standard feature set (TA + ICT + VIX + sector + earnings).

    This is the public feature builder consumed by predictor shims, the
    Flask backtester (backtester.py), and the paper engine signal step.
    """
    df = _add_base_ta(df)
    if interval != "1d":
        df = _add_intraday_ict(df)
    if aux:
        df = _apply_vix(df, aux.get("vix"))
        df = _apply_sector(df, aux.get("sector"), aux.get("spy"))
        df = _apply_earnings(df, aux.get("earnings", pd.DatetimeIndex([])))
        df = ict_features.add_smt_divergence(df, aux.get("spy") if aux.get("spy") is not None else aux.get("sector"))
    else:
        for c in AUX_COLS + ict_features.SMT_COLS:
            df[c] = 0.0
    # Quant alpha features (Alpha_*). Causal by contract; existing models
    # ignore them (they select by saved feature_cols) and the next retrain
    # picks them up automatically.
    try:
        from alphas import add_alpha_features
        df = add_alpha_features(df)
    except Exception:
        pass
    df.dropna(inplace=True)
    return df


def _is_professional_model(feature_cols: list) -> bool:
    """True if model was trained by train_professional.py (new ICT feature names)."""
    return bool(set(feature_cols) & {"Returns", "CHoCH_Bear", "BB_Pos", "ADX", "MACD_Diff"})


def _compute_pro_features(df: pd.DataFrame, is_intraday: bool = True) -> pd.DataFrame:
    """Mirror of compute_ict_features() from train_professional.py for live inference."""
    df = df.copy()
    c, h, l, o, v = df["Close"], df["High"], df["Low"], df["Open"], df["Volume"]

    df["Returns"]  = c.pct_change()
    df["Log_Ret"]  = np.log((c / c.shift(1)).replace(0, np.nan))
    df["HL_Range"] = (h - l) / (c + 1e-8)
    df["CO_Move"]  = (c - o) / (o + 1e-8)

    atr14 = ta.volatility.AverageTrueRange(h, l, c, window=14).average_true_range().fillna(c * 0.01)
    df["ATR_14"] = atr14
    df["ATR_r"]  = atr14 / (c + 1e-8)

    for p in [5, 10, 20, 50]:
        sma = ta.trend.sma_indicator(c, window=p)
        df[f"SMA_{p}"]   = sma
        df[f"SMA_{p}_r"] = c / (sma + 1e-8) - 1
    sma200 = c.rolling(200, min_periods=1).mean()
    df["SMA_200_r"]    = c / (sma200 + 1e-8) - 1
    df["Above_200SMA"] = (c > sma200).astype(int)
    df["EMA_9"]  = ta.trend.ema_indicator(c, window=9)
    df["EMA_21"] = ta.trend.ema_indicator(c, window=21)
    df["EMA_50"] = ta.trend.ema_indicator(c, window=50)

    df["RSI_7"]      = ta.momentum.rsi(c, window=7)
    df["RSI_14"]     = ta.momentum.rsi(c, window=14)
    df["RSI_21"]     = ta.momentum.rsi(c, window=21)
    df["Stoch_K"]    = ta.momentum.stoch(h, l, c, window=14, smooth_window=3)
    df["Stoch_D"]    = ta.momentum.stoch_signal(h, l, c, window=14, smooth_window=3)
    df["ROC_5"]      = ta.momentum.roc(c, window=5)
    df["ROC_10"]     = ta.momentum.roc(c, window=10)
    df["Williams_R"] = ta.momentum.williams_r(h, l, c, lbp=14)

    macd_ind        = ta.trend.MACD(c, window_fast=12, window_slow=26, window_sign=9)
    df["MACD"]      = macd_ind.macd()
    df["MACD_Sig"]  = macd_ind.macd_signal()
    df["MACD_Diff"] = macd_ind.macd_diff()
    df["ADX"]       = ta.trend.adx(h, l, c, window=14)
    df["ADX_Pos"]   = ta.trend.adx_pos(h, l, c, window=14)
    df["ADX_Neg"]   = ta.trend.adx_neg(h, l, c, window=14)
    df["CCI"]       = ta.trend.cci(h, l, c, window=20)

    bb = ta.volatility.BollingerBands(c, window=20, window_dev=2)
    df["BB_Upper"] = bb.bollinger_hband()
    df["BB_Lower"] = bb.bollinger_lband()
    df["BB_Mid"]   = bb.bollinger_mavg()
    df["BB_Width"] = (df["BB_Upper"] - df["BB_Lower"]) / (df["BB_Mid"] + 1e-8)
    df["BB_Pos"]   = (c - df["BB_Lower"]) / (df["BB_Upper"] - df["BB_Lower"] + 1e-8)
    try:
        kc = ta.volatility.KeltnerChannel(h, l, c, window=20)
        df["KC_Squeeze"] = ((df["BB_Upper"] < kc.keltner_channel_hband()) &
                            (df["BB_Lower"] > kc.keltner_channel_lband())).astype(int)
    except Exception:
        df["KC_Squeeze"] = 0

    vma20          = v.rolling(20, min_periods=1).mean()
    df["Volume_r"] = v / (vma20 + 1)
    df["OBV"]      = ta.volume.on_balance_volume(c, v)
    df["OBV_r"]    = df["OBV"] / (df["OBV"].rolling(20, min_periods=1).mean() + 1e-8) - 1
    try:
        df["CMF"] = ta.volume.chaikin_money_flow(h, l, c, v, window=20)
    except Exception:
        df["CMF"] = 0.0
    df["VWAP_r"] = c / (ta.volume.volume_weighted_average_price(h, l, c, v, window=14) + 1e-8) - 1

    sh20 = h.rolling(20).max();  sl20 = l.rolling(20).min()
    sh60 = h.rolling(60).max();  sl60 = l.rolling(60).min()
    df["Dist_to_SH20"] = ((sh20 - c) / (atr14 + 1e-8)).clip(-10, 10)
    df["Dist_to_SL20"] = ((c - sl20) / (atr14 + 1e-8)).clip(-10, 10)
    df["Dist_to_SH60"] = ((sh60 - c) / (atr14 + 1e-8)).clip(-10, 10)
    df["Dist_to_SL60"] = ((c - sl60) / (atr14 + 1e-8)).clip(-10, 10)
    df["HH"] = ((h > h.shift(1)) & (h.shift(1) > h.shift(2))).astype(int)
    df["LL"] = ((l < l.shift(1)) & (l.shift(1) < l.shift(2))).astype(int)
    df["HL"] = ((l > l.shift(2)) & (h < sh20.shift(1))).astype(int)
    df["LH"] = ((h < h.shift(2)) & (l > sl20.shift(1))).astype(int)
    df["Structure_Bullish"] = (sh20 > sh60.shift(20)).astype(int)

    hl_mask   = (l > l.shift(2)) & (h < sh20.shift(1))
    lh_mask   = (h < h.shift(2)) & (l > sl20.shift(1))
    recent_hl = l.where(hl_mask).rolling(10, min_periods=1).max().ffill()
    recent_lh = h.where(lh_mask).rolling(10, min_periods=1).min().ffill()
    df["CHoCH_Bear"] = ((c < recent_hl) &  df["Structure_Bullish"].astype(bool)).astype(int)
    df["CHoCH_Bull"] = ((c > recent_lh) & ~df["Structure_Bullish"].astype(bool)).astype(int)

    rng60 = (sh60 - sl60).replace(0, np.nan)
    df["PD_Position"] = ((c - sl60) / rng60).fillna(0.5).clip(0, 1)
    df["In_Premium"]  = (df["PD_Position"] >= 0.55).astype(int)
    df["In_Discount"] = (df["PD_Position"] <= 0.45).astype(int)

    rng20 = (sh20 - sl20).replace(0, np.nan)
    df["In_OTE_Buy"]  = ((c >= sh20 - rng20 * 0.79) & (c <= sh20 - rng20 * 0.62)).astype(int)
    df["In_OTE_Sell"] = ((c >= sl20 + rng20 * 0.62) & (c <= sl20 + rng20 * 0.79)).astype(int)

    bull_fvg = (l > h.shift(2)).astype(int)
    bear_fvg = (h < l.shift(2)).astype(int)
    df["Bull_FVG_Count"] = bull_fvg.rolling(10, min_periods=1).sum()
    df["Bear_FVG_Count"] = bear_fvg.rolling(10, min_periods=1).sum()
    df["FVG_Net"]        = df["Bull_FVG_Count"] - df["Bear_FVG_Count"]
    bull_ce = ((h.shift(2) + l) / 2).where(bull_fvg.astype(bool)).ffill()
    bear_ce = ((l.shift(2) + h) / 2).where(bear_fvg.astype(bool)).ffill()
    df["CE_Bull_Dist"] = ((c - bull_ce) / (atr14 + 1e-8)).clip(-10, 10).fillna(0)
    df["CE_Bear_Dist"] = ((bear_ce - c) / (atr14 + 1e-8)).clip(-10, 10).fillna(0)

    body = (c - o).abs();  rng = (h - l).replace(0, np.nan)
    df["Body_Ratio"]   = (body / rng).fillna(0).clip(0, 1)
    df["Displacement"] = ((rng.fillna(0) > atr14 * 1.5) & (df["Body_Ratio"] > 0.6)).astype(int)
    bear_c = (c < o);  bull_c = (c > o)
    bull_ob = (bear_c.shift(1).fillna(False)) & (df["Displacement"] == 1) & bull_c
    bear_ob = (bull_c.shift(1).fillna(False)) & (df["Displacement"] == 1) & bear_c
    df["Bull_OB_Count"] = bull_ob.astype(int).rolling(10, min_periods=1).sum()
    df["Bear_OB_Count"] = bear_ob.astype(int).rolling(10, min_periods=1).sum()
    last_boh = h.where(bull_ob).ffill();  last_bol = l.where(bull_ob).ffill()
    last_beh = h.where(bear_ob).ffill();  last_bel = l.where(bear_ob).ffill()
    df["Bull_OB_H_Dist"] = ((last_boh - c) / (atr14 + 1e-8)).clip(-10, 10).fillna(0)
    df["Bull_OB_L_Dist"] = ((c - last_bol) / (atr14 + 1e-8)).clip(-10, 10).fillna(0)
    df["Bear_OB_H_Dist"] = ((last_beh - c) / (atr14 + 1e-8)).clip(-10, 10).fillna(0)
    df["Bear_OB_L_Dist"] = ((c - last_bel) / (atr14 + 1e-8)).clip(-10, 10).fillna(0)

    tol  = c * 0.001
    r10h = h.rolling(10).max().shift(1);  r10l = l.rolling(10).min().shift(1)
    df["Equal_Highs"] = ((h - r10h).abs() < tol).astype(int).rolling(5, min_periods=1).sum()
    df["Equal_Lows"]  = ((l - r10l).abs() < tol).astype(int).rolling(5, min_periods=1).sum()
    df["Swept_High"]  = ((h > sh20.shift(1)) & (c < sh20.shift(1))).astype(int)
    df["Swept_Low"]   = ((l < sl20.shift(1)) & (c > sl20.shift(1))).astype(int)
    pwh = h.rolling(5).max().shift(1);  pwl = l.rolling(5).min().shift(1)
    df["Dist_PWH"] = ((pwh - c) / (atr14 + 1e-8)).clip(-10, 10)
    df["Dist_PWL"] = ((c - pwl)  / (atr14 + 1e-8)).clip(-10, 10)

    for n in [20, 40, 60]:
        df[f"IPDA_{n}_H"] = ((h.rolling(n).max().shift(1) - c) / (atr14 + 1e-8)).clip(-20, 20)
        df[f"IPDA_{n}_L"] = ((c - l.rolling(n).min().shift(1)) / (atr14 + 1e-8)).clip(-20, 20)

    df["P3_Accum"]   = (df["Returns"].abs() < df["ATR_r"] * 0.5).astype(int)
    df["P3_Manip"]   = ((h > h.shift(1)) & (c < o)).astype(int)
    df["P3_Distrib"] = df["Displacement"].rolling(3, min_periods=1).sum()

    df["DayOfWeek"] = np.array(df.index.dayofweek, dtype=np.int32)
    _m = np.array(df.index.month, dtype=np.int32)
    _q = np.array(df.index.quarter, dtype=np.int32)
    df["Month_Sin"]   = np.sin(2 * np.pi * _m / 12)
    df["Month_Cos"]   = np.cos(2 * np.pi * _m / 12)
    df["Quarter_Sin"] = np.sin(2 * np.pi * _q / 4)
    df["Quarter_Cos"] = np.cos(2 * np.pi * _q / 4)

    for lag in range(1, 6):
        df[f"Ret_lag_{lag}"] = df["Returns"].shift(lag)
    for lag in range(1, 4):
        df[f"Vol_lag_{lag}"] = df["Volume_r"].shift(lag)

    if is_intraday:
        idx  = df.index
        et   = idx.tz_convert("America/New_York") if idx.tz else idx.tz_localize("UTC").tz_convert("America/New_York")
        hour   = np.array(et.hour,      dtype=np.int32)
        minute = np.array(et.minute,    dtype=np.int32)
        dow    = np.array(et.dayofweek, dtype=np.int32)

        df["KZ_London"]       = ((hour >= 2)  & (hour < 5)).astype(int)
        df["KZ_NY_Open"]      = ((hour >= 9)  & (hour < 11)).astype(int)
        df["KZ_London_Close"] = ((hour >= 10) & (hour < 12)).astype(int)
        df["KZ_NY_PM"]        = ((hour >= 13) & (hour < 16)).astype(int)
        df["KZ_SB_AM"]        = ((hour == 10) | ((hour == 9) & (minute >= 50))).astype(int)
        df["KZ_SB_PM"]        = ((hour >= 14) & (hour < 15)).astype(int)

        mins_in           = np.clip((hour - 9) * 60 + minute - 30, 0, 390)
        df["Session_Pct"] = mins_in / 390
        df["Hour_Sin"]    = np.sin(2 * np.pi * hour / 24)
        df["Hour_Cos"]    = np.cos(2 * np.pi * hour / 24)
        df["Day_Sin"]     = np.sin(2 * np.pi * dow / 5)
        df["Day_Cos"]     = np.cos(2 * np.pi * dow / 5)

        date_str      = pd.Series(et.date, index=df.index)
        midnight_open = df.groupby(date_str)["Open"].transform("first")
        df["vs_MidOpen"] = (c - midnight_open) / (midnight_open + 1e-8) * 100
        sess_hi = df.groupby(date_str)["High"].transform("cummax")
        sess_lo = df.groupby(date_str)["Low"].transform("cummin")
        df["Sess_H_Dist"] = ((sess_hi - c) / (atr14 + 1e-8)).clip(-10, 10)
        df["Sess_L_Dist"] = ((c - sess_lo) / (atr14 + 1e-8)).clip(-10, 10)

        is_asia_s = pd.Series((hour >= 20) | (hour < 2), index=df.index)
        asia_h    = h.where(is_asia_s).rolling(14, min_periods=1).max().ffill()
        asia_l    = l.where(is_asia_s).rolling(14, min_periods=1).min().ffill()
        df["Asia_H_Dist"] = ((asia_h - c) / (atr14 + 1e-8)).clip(-10, 10).fillna(0)
        df["Asia_L_Dist"] = ((c - asia_l) / (atr14 + 1e-8)).clip(-10, 10).fillna(0)
        df["Asia_Range"]  = ((asia_h - asia_l) / (atr14 + 1e-8)).clip(0, 20).fillna(0)
        df["Above_AsiaH"] = (c > asia_h).astype(int)
        df["Below_AsiaL"] = (c < asia_l).astype(int)

        is_mon_s   = pd.Series(dow == 0, index=df.index)
        prev_close = c.shift(1)
        nwog_open  = df["Open"].where(is_mon_s).ffill()
        nwog_prev  = prev_close.where(is_mon_s).ffill()
        lo = nwog_prev.clip(lower=0)
        df["In_NWOG"]   = (nwog_open.notna() & nwog_prev.notna() &
                           c.between(lo, nwog_open, inclusive="both")).astype(int)
        week_gap        = (df["Open"] - prev_close).where(is_mon_s).ffill().fillna(0)
        df["NWOG_Norm"] = (week_gap / (atr14 + 1e-8)).clip(-5, 5)

    # Compatibility aliases so display/chart code in run_prediction() works unchanged
    df["SMA_7"]        = ta.trend.sma_indicator(c, window=7)
    df["SMA_21"]       = ta.trend.sma_indicator(c, window=21)
    df["MACD_Hist"]    = df["MACD_Diff"]
    df["Daily_Return"] = df["Returns"] * 100
    return df


def _build_pro_features(df: pd.DataFrame, ticker: str, interval: str) -> pd.DataFrame:
    """Build professional feature set (153 features + MTF context) for inference."""
    is_intraday = (interval != "1d")
    df = _compute_pro_features(df, is_intraday)

    for htf in MTF_SOURCES.get(interval, []):
        htf_raw = _fetch_htf_for_mtf(ticker, htf)
        if htf_raw is None:
            continue
        try:
            htf_feat = _compute_pro_features(htf_raw, is_intraday=(htf != "1d"))
        except Exception:
            continue
        for src_col, suffix in MTF_COLS.items():
            col_name = f"HTF_{htf}_{suffix}"
            if src_col not in htf_feat.columns:
                df[col_name] = 0.0
                continue
            s = htf_feat[src_col].copy()
            try:
                if s.index.tz is not None:
                    s.index = s.index.tz_convert("UTC")
                if df.index.tz is not None:
                    ref_idx = df.index.tz_convert("UTC")
                else:
                    ref_idx = df.index
                    s.index = s.index.tz_localize(None) if s.index.tz else s.index
            except Exception:
                ref_idx = df.index
            union_ix = s.index.union(ref_idx)
            combined = s.reindex(union_ix).sort_index().ffill()
            df[col_name] = combined.reindex(ref_idx).values

    # Zero-fill any HTF columns that couldn't be fetched
    for htf in MTF_SOURCES.get(interval, []):
        for src_col, suffix in MTF_COLS.items():
            col_name = f"HTF_{htf}_{suffix}"
            if col_name not in df.columns:
                df[col_name] = 0.0

    df.dropna(inplace=True)
    return df


# ── News sentiment ─────────────────────────────────────────────────────────────

def get_news_sentiment(ticker: str) -> float:
    """Fetches yfinance news headlines and scores aggregate sentiment (-1.0 to 1.0)."""
    try:
        yf_sym = YF_SYMBOL_MAP.get(ticker.upper(), ticker.replace(".", "-"))
        t = yf.Ticker(yf_sym)
        news = t.news
        if not news:
            return 0.0

        positive_words = {
            "bullish", "upgrade", "outperform", "buy", "growth", "profit",
            "surpass", "gain", "higher", "record", "beat", "rally", "success", "positive",
        }
        negative_words = {
            "bearish", "downgrade", "underperform", "sell", "loss", "decline",
            "fall", "lower", "drop", "deficit", "warn", "slump", "negative", "risk", "crash",
        }

        scores = []
        for item in news:
            title = item.get("title", "").lower()
            words = set(title.replace(".", "").replace(",", "").split())
            pos_matches = len(words.intersection(positive_words))
            neg_matches = len(words.intersection(negative_words))
            if pos_matches > neg_matches:
                scores.append(1.0)
            elif neg_matches > pos_matches:
                scores.append(-1.0)
            else:
                scores.append(0.0)

        if not scores:
            return 0.0
        return float(np.mean(scores))
    except Exception as e:
        print(f"[SENTIMENT WARNING] news sentiment failed for {ticker}: {e}")
        return 0.0


# ── Public API ─────────────────────────────────────────────────────────────────

def run_prediction(ticker: str, interval: str = "1d") -> dict:
    """Full prediction result dict for Flask routes and the result page."""
    ticker   = ticker.upper()
    min_bars = {"1d": 70, "1h": 100, "4h": 30, "30m": 50,
                "15m": 80, "5m": 80, "1m": 50}.get(interval, 70)

    from ml_framework.orchestrator import PipelineOrchestrator
    orchestrator = PipelineOrchestrator("pipeline_config.json")
    df = orchestrator.run_ingestion(ticker, interval)

    if df.empty or len(df) < min_bars:
        raise ValueError(
            f"Not enough data for '{ticker}' on {interval} interval. "
            "Check the ticker symbol."
        )

    lr_model, rf_model, scaler, feature_cols, xgb_model, lgb_model, stacking, lstm_model = _load_models(ticker, interval)

    if df.empty:
        raise ValueError("Feature engineering failed, insufficient data history.")

    if not feature_cols:
        from train_all_tickers import _feature_list
        feature_cols = [c for c in _feature_list(interval) if c in df.columns]

    df_clean = df[feature_cols + ["Close"]].dropna()

    n_feats = len(feature_cols)
    if scaler is None or getattr(scaler, "n_features_in_", None) != n_feats:
        from sklearn.preprocessing import MinMaxScaler
        scaler = MinMaxScaler().fit(df_clean[feature_cols].values)
        lr_model = None
        rf_model = None

    X_raw = df_clean[feature_cols].iloc[-1:].values
    X = scaler.transform(X_raw)
    current_price = float(df_clean["Close"].iloc[-1])

    if lr_model is None or rf_model is None:
        X_scaled_all = scaler.transform(df_clean[feature_cols].values)
        y_px_all  = df_clean["Close"].values
        y_ret_all = (df_clean["Close"].pct_change().fillna(0) * 100).values
        if lr_model is None:
            from sklearn.linear_model import Ridge
            lr_model = Ridge(alpha=1.0).fit(X_scaled_all, y_px_all)
        if rf_model is None:
            from sklearn.ensemble import RandomForestRegressor
            rf_model = RandomForestRegressor(n_estimators=10, max_depth=5, random_state=42).fit(X_scaled_all, y_ret_all)

    lr_pred, _, lr_up    = _infer_model(lr_model, X, current_price)
    rf_pred, rf_ret, rf_up = _infer_model(rf_model, X, current_price)
    price_change = lr_pred - current_price

    # Multi-model ensemble voting
    model_votes = [bool(lr_up), bool(rf_up)]
    model_names = ["LR", "RF"]

    xgb_prob = 0.5
    xgb_up = False
    if xgb_model is not None:
        if hasattr(xgb_model, "classes_"):
            xgb_prob = float(xgb_model.predict_proba(X)[0][1])
            xgb_up = xgb_prob > 0.5
        else:
            _, _, xgb_up = _infer_model(xgb_model, X, current_price)
        model_votes.append(bool(xgb_up))
        model_names.append("XGB")

    if lgb_model is not None:
        _, _, lgb_up_v = _infer_model(lgb_model, X, current_price)
        model_votes.append(bool(lgb_up_v))
        model_names.append("LGB")

    stacking_pred = None
    if stacking is not None:
        try:
            meta_feats = np.zeros((1, 0))
            meta_feats = np.column_stack([meta_feats, [lr_pred]])
            meta_feats = np.column_stack([meta_feats, [rf_pred]])
            if xgb_model is not None and hasattr(xgb_model, "predict"):
                meta_feats = np.column_stack([meta_feats,
                    [current_price * (1 + float(xgb_model.predict(X)[0]) / 100)]])
            if lgb_model is not None:
                meta_feats = np.column_stack([meta_feats,
                    [current_price * (1 + float(lgb_model.predict(X)[0]) / 100)]])
            meta_feats = np.column_stack([meta_feats,
                X[:, stacking["top10_idx"]][:, :len(stacking["top10_idx"])]])
            expected = len(stacking["meta_cols"])
            if meta_feats.shape[1] < expected:
                pad = np.zeros((1, expected - meta_feats.shape[1]))
                meta_feats = np.column_stack([meta_feats, pad])
            elif meta_feats.shape[1] > expected:
                meta_feats = meta_feats[:, :expected]
            meta_feats_sc = stacking["scaler"].transform(meta_feats)
            stacking_pred = float(stacking["meta"].predict(meta_feats_sc)[0])
            model_votes.append(stacking_pred > current_price)
            model_names.append("Stack")
        except Exception:
            stacking_pred = None

    lstm_pred = None
    if lstm_model is not None:
        try:
            lstm_scaler_path = os.path.join(BASE_DIR, "Data", f"scaler_{ticker}.pkl")
            lstm_feat_path  = os.path.join(BASE_DIR, "Data", f"feature_cols_{ticker}.pkl")
            if os.path.exists(lstm_scaler_path) and os.path.exists(lstm_feat_path):
                lstm_scaler = joblib.load(lstm_scaler_path)
                lstm_feats  = joblib.load(lstm_feat_path)
                lookback = 60
                recent = df[lstm_feats].tail(lookback).values
                if len(recent) >= lookback:
                    seq = lstm_scaler.transform(recent).reshape(1, lookback, -1)
                    lstm_pred_scaled = float(lstm_model.predict(seq, verbose=0)[0][0])
                    last_step = recent[-1:].copy()
                    close_idx = lstm_feats.index("Close") if "Close" in lstm_feats else 0
                    last_step[0, close_idx] = lstm_pred_scaled
                    lstm_pred = float(lstm_scaler.inverse_transform(last_step)[0, close_idx])
                    model_votes.append(lstm_pred > current_price)
                    model_names.append("LSTM")
        except Exception:
            lstm_pred = None

    if stacking_pred is not None:
        lr_pred = stacking_pred
    elif lstm_pred is not None:
        lr_pred = lstm_pred

    price_change = lr_pred - current_price
    change_pct   = abs(price_change / current_price * 100)

    votes_up = sum(1 for v in model_votes if v)
    total_v  = len(model_votes)

    if votes_up > total_v / 2:
        direction = "Up"
    elif votes_up < total_v / 2:
        direction = "Down"
    else:
        direction = "Up" if lr_up else "Down"

    agreement_pct = max(votes_up, total_v - votes_up) / total_v * 100
    if stacking_pred is not None:
        confidence = round(min(95, max(51, agreement_pct)), 1)
    elif xgb_model is not None and hasattr(xgb_model, "classes_"):
        confidence = round(min(95, max(51, max(xgb_prob, 1 - xgb_prob) * 100)), 1)
    else:
        daily_ret  = df.get("Daily_Return", df.get("Returns", pd.Series(dtype=float)))
        recent_vol = float(daily_ret.tail(20).std()) if not daily_ret.empty else 1.0
        confidence = min(95, max(51, 50 + (change_pct / max(recent_vol, 0.1)) * 10))

    vote_margin = abs(votes_up - total_v / 2) / (total_v / 2 + 1e-8)
    if vote_margin >= 0.8:
        signal_strength = "Strong"
    elif vote_margin >= 0.4:
        signal_strength = "Moderate"
    else:
        signal_strength = "Weak"

    # Chart data (last 90 bars)
    chart_df     = df.tail(90)
    chart_dates  = [
        d.strftime("%Y-%m-%d %H:%M") if interval != "1d" else d.strftime("%Y-%m-%d")
        for d in chart_df.index
    ]
    chart_prices = [round(float(p), 2) for p in chart_df["Close"]]
    chart_sma7   = [round(float(p), 2) for p in chart_df["SMA_7"]]
    chart_sma21  = [round(float(p), 2) for p in chart_df["SMA_21"]]

    rsi       = round(float(df["RSI_14"].iloc[-1]), 1)
    macd_val  = round(float(df["MACD"].iloc[-1]), 3)
    macd_hist = float(df["MACD_Hist"].iloc[-1])

    last        = df.iloc[-1]
    pd_pos      = round(float(last["PD_Position"]), 3)
    above_200   = int(last["Above_200SMA"])
    struct_bull = int(last["Structure_Bullish"])
    bull_fvg    = int(last["Bull_FVG_Count"])
    bear_fvg    = int(last["Bear_FVG_Count"])
    bull_ob     = int(last["Bull_OB_Count"])
    bear_ob     = int(last["Bear_OB_Count"])
    swept_high  = int(last["Swept_High"])
    swept_low   = int(last["Swept_Low"])
    in_ote_buy  = int(last["In_OTE_Buy"])
    in_ote_sell = int(last["In_OTE_Sell"])
    eq_highs    = int(last["Equal_Highs"])
    eq_lows     = int(last["Equal_Lows"])
    displaced   = int(last["Displacement"])

    if above_200 and struct_bull:
        ict_bias = "Bullish"
    elif not above_200 and not struct_bull:
        ict_bias = "Bearish"
    else:
        ict_bias = "Neutral"

    if pd_pos <= 0.45:
        pd_zone = "Discount"
    elif pd_pos >= 0.55:
        pd_zone = "Premium"
    else:
        pd_zone = "Equilibrium"

    # Lightweight Charts payload
    chart_plot = df.tail(120)
    candles = [
        {
            "time":   lw_time(idx, interval),
            "open":   round(float(r["Open"]),  4),
            "high":   round(float(r["High"]),  4),
            "low":    round(float(r["Low"]),   4),
            "close":  round(float(r["Close"]), 4),
            "volume": round(float(r["Volume"]), 2) if "Volume" in r and pd.notna(r["Volume"]) else 0,
        }
        for idx, r in chart_plot.iterrows()
    ]

    sma200_raw  = df["Close"].rolling(200, min_periods=1).mean().tail(120)
    sma200_line = [
        {"time": lw_time(idx, interval), "value": round(float(v), 4)}
        for idx, v in sma200_raw.items()
        if pd.notna(v)
    ]

    atr_val = float(last["ATR_14"])
    sh20    = float(df["High"].rolling(20).max().iloc[-1])
    sl20_v  = float(df["Low"].rolling(20).min().iloc[-1])
    rng20v  = max(sh20 - sl20_v, atr_val)
    ote_buy_zone  = {"low": round(sh20  - rng20v * 0.79, 4), "high": round(sh20  - rng20v * 0.62, 4)}
    ote_sell_zone = {"low": round(sl20_v + rng20v * 0.62, 4), "high": round(sl20_v + rng20v * 0.79, 4)}

    h_arr = chart_plot["High"].values
    l_arr = chart_plot["Low"].values
    fvg_list = []
    for i in range(2, len(h_arr)):
        if l_arr[i] > h_arr[i - 2]:
            fvg_list.append({"low": round(float(h_arr[i - 2]), 4), "high": round(float(l_arr[i]), 4), "type": "bull"})
        elif h_arr[i] < l_arr[i - 2]:
            fvg_list.append({"low": round(float(h_arr[i]), 4), "high": round(float(l_arr[i - 2]), 4), "type": "bear"})
    fvg_list = fvg_list[-5:]

    o_arr = chart_plot["Open"].values
    c_arr = chart_plot["Close"].values
    d_arr = chart_plot["Displacement"].values
    ob_list = []
    for i in range(1, len(h_arr)):
        if d_arr[i] and c_arr[i-1] < o_arr[i-1] and c_arr[i] > o_arr[i]:
            ob_list.append({"low": round(float(l_arr[i-1]), 4), "high": round(float(h_arr[i-1]), 4), "type": "bull"})
        elif d_arr[i] and c_arr[i-1] > o_arr[i-1] and c_arr[i] < o_arr[i]:
            ob_list.append({"low": round(float(l_arr[i-1]), 4), "high": round(float(h_arr[i-1]), 4), "type": "bear"})
    ob_list = ob_list[-5:]

    sl_price = round(current_price - 1.5 * atr_val, 4) if direction == "Up" else round(current_price + 1.5 * atr_val, 4)
    tp_price = round(current_price + 3.0 * atr_val, 4) if direction == "Up" else round(current_price - 3.0 * atr_val, 4)

    lw_chart_data = {
        "candles":    candles,
        "sma200":     sma200_line,
        "ote_buy":    ote_buy_zone,
        "ote_sell":   ote_sell_zone,
        "fvg":        fvg_list,
        "ob":         ob_list,
        "pred":       round(lr_pred, 4),
        "sl":         sl_price,
        "tp":         tp_price,
        "direction":  direction,
        "in_ote_buy": in_ote_buy,
        "in_ote_sell": in_ote_sell,
    }

    last_idx = df.index[-1]
    _horizon_label = {
        "1d":  "Next Day",
        "1h":  "Next Hour",
        "4h":  "Next 4 Hours",
        "30m": "Next 30 Minutes",
        "15m": "Next 15 Minutes",
        "5m":  "Next 5 Minutes",
        "1m":  "Next 5 Minutes",
    }
    if interval == "1d":
        as_of   = last_idx.strftime("%B %d, %Y")
        horizon = "Next Day"
    else:
        try:
            et = last_idx.tz_convert("America/New_York") if last_idx.tzinfo else last_idx
            as_of = et.strftime("%b %d, %Y %I:%M %p ET")
        except Exception:
            as_of = str(last_idx)
        horizon = _horizon_label.get(interval, "Next Bar")

    alpha_signals = []
    if rf_model is not None and hasattr(rf_model, "feature_importances_"):
        importances = rf_model.feature_importances_
        if len(importances) == len(feature_cols):
            top_idx = np.argsort(importances)[-3:][::-1]
            for i in top_idx:
                fname = feature_cols[i]
                alpha_signals.append(fname.replace("_", " "))
    if not alpha_signals:
        if ict_bias != "Neutral":
            alpha_signals.append(f"{ict_bias} Market Structure")
        alpha_signals.append(f"RSI: {rsi}")
        alpha_signals.append("Trend Alignment")

    ai_score = 5
    if direction == "Up":
        if confidence >= 80:   ai_score = 9 + int(confidence >= 90)
        elif confidence >= 70: ai_score = 8
        elif confidence >= 60: ai_score = 7
        else:                  ai_score = 6
    else:
        if confidence >= 80:   ai_score = 2 - int(confidence >= 90)
        elif confidence >= 70: ai_score = 3
        elif confidence >= 60: ai_score = 4
        else:                  ai_score = 5

    return {
        "ticker"        : ticker,
        "interval"      : interval,
        "horizon"       : horizon,
        "current_price" : round(current_price, 2),
        "lr_pred"       : round(lr_pred, 2),
        "rf_pred"       : round(rf_pred, 2),
        "lstm_pred"     : "N/A",
        "primary_pred"  : round(lr_pred, 2),
        "price_change"  : round(price_change, 2),
        "change_pct"    : round(change_pct, 2),
        "direction"     : direction,
        "confidence"    : round(confidence, 1),
        "ai_score"      : ai_score,
        "alpha_signals" : alpha_signals,
        "chart_dates"   : json.dumps(chart_dates),
        "chart_prices"  : json.dumps(chart_prices),
        "chart_sma7"    : json.dumps(chart_sma7),
        "chart_sma21"   : json.dumps(chart_sma21),
        "rsi"           : rsi,
        "rsi_signal"    : "Overbought" if rsi >= 70 else ("Oversold" if rsi <= 30 else "Neutral"),
        "macd"          : macd_val,
        "macd_signal"   : "Bullish" if macd_hist > 0 else "Bearish",
        "bb_upper"      : round(float(df["BB_Upper"].iloc[-1]), 2),
        "bb_lower"      : round(float(df["BB_Lower"].iloc[-1]), 2),
        "as_of"         : as_of,
        "ict_bias"      : ict_bias,
        "pd_position"   : pd_pos,
        "pd_zone"       : pd_zone,
        "bull_fvg"      : bull_fvg,
        "bear_fvg"      : bear_fvg,
        "bull_ob"       : bull_ob,
        "bear_ob"       : bear_ob,
        "swept_high"    : swept_high,
        "swept_low"     : swept_low,
        "in_ote_buy"    : in_ote_buy,
        "in_ote_sell"   : in_ote_sell,
        "eq_highs"      : eq_highs,
        "eq_lows"       : eq_lows,
        "displaced"     : displaced,
        "lw_chart"      : json.dumps(lw_chart_data),
        "xgb_prob"      : round(xgb_prob, 4),
        "signal_strength": signal_strength,
        "lr_up"          : bool(lr_up),
        "rf_up"          : bool(rf_up),
        "xgb_up"         : bool(xgb_up),
        "votes_up"       : votes_up,
        "has_xgb"        : (xgb_model is not None),
    }


def ml_signal(ticker: str, interval: str = "1d") -> dict:
    """
    Compact trading signal for the MT5 auto-trade loop.

    BUY  — LR and RF (and ensemble) all predict up
    SELL — predict down
    HOLD — models disagree
    """
    try:
        ticker   = ticker.upper()
        min_bars = {"1d": 70, "1h": 100, "4h": 30, "30m": 50,
                    "15m": 80, "5m": 80, "1m": 50}.get(interval, 70)
        from ml_framework.orchestrator import PipelineOrchestrator
        orchestrator = PipelineOrchestrator("pipeline_config.json")
        df = orchestrator.run_ingestion(ticker, interval)
        if df.empty or len(df) < min_bars:
            return {"action": "HOLD", "error": "Insufficient data", "confidence": 0}

        lr_model, rf_model, scaler, feature_cols, xgb_model, lgb_model, stacking, lstm_model = _load_models(ticker, interval)

        if df.empty:
            return {"action": "HOLD", "error": "Feature build failed", "confidence": 0}

        current_price = float(df["Close"].iloc[-1])
        X             = scaler.transform(df[feature_cols].iloc[-1:].values)
        lr_pred, _, lr_up    = _infer_model(lr_model, X, current_price)
        rf_pred, rf_ret, rf_up = _infer_model(rf_model, X, current_price)

        model_votes = [bool(lr_up), bool(rf_up)]
        xgb_prob = 0.5
        if xgb_model is not None:
            if hasattr(xgb_model, "classes_"):
                xgb_prob = float(xgb_model.predict_proba(X)[0][1])
                model_votes.append(xgb_prob > 0.5)
            else:
                _, _, xgb_up_v = _infer_model(xgb_model, X, current_price)
                model_votes.append(bool(xgb_up_v))

        if lgb_model is not None:
            _, _, lgb_up_v = _infer_model(lgb_model, X, current_price)
            model_votes.append(bool(lgb_up_v))

        if stacking is not None:
            try:
                meta_feats = np.zeros((1, 0))
                meta_feats = np.column_stack([meta_feats, [lr_pred], [rf_pred]])
                if xgb_model is not None and hasattr(xgb_model, "predict"):
                    meta_feats = np.column_stack([meta_feats,
                        [current_price * (1 + float(xgb_model.predict(X)[0]) / 100)]])
                if lgb_model is not None:
                    meta_feats = np.column_stack([meta_feats,
                        [current_price * (1 + float(lgb_model.predict(X)[0]) / 100)]])
                meta_feats = np.column_stack([meta_feats,
                    X[:, stacking["top10_idx"]][:, :len(stacking["top10_idx"])]])
                expected = len(stacking["meta_cols"])
                if meta_feats.shape[1] < expected:
                    meta_feats = np.column_stack([meta_feats,
                        np.zeros((1, expected - meta_feats.shape[1]))])
                meta_feats_sc = stacking["scaler"].transform(meta_feats)
                stacking_pred = float(stacking["meta"].predict(meta_feats_sc)[0])
                model_votes.append(stacking_pred > current_price)
            except Exception:
                pass

        votes_up = sum(1 for v in model_votes if v)
        total_v  = len(model_votes)

        if votes_up > total_v / 2:
            action = "BUY"
        elif votes_up < total_v / 2:
            action = "SELL"
        else:
            action = "HOLD"

        agreement_pct = max(votes_up, total_v - votes_up) / total_v * 100
        if xgb_model is not None and hasattr(xgb_model, "classes_"):
            confidence = round(min(95, max(51, max(xgb_prob, 1 - xgb_prob) * 100)), 1)
        else:
            confidence = round(min(95, max(51, agreement_pct)), 1)

        rsi       = float(df["RSI_14"].iloc[-1])
        macd_hist = float(df["MACD_Hist"].iloc[-1])
        atr       = float(df["ATR_14"].iloc[-1]) if "ATR_14" in df.columns else current_price * 0.01

        alpha_signals = []
        if rf_model is not None and hasattr(rf_model, "feature_importances_"):
            importances = rf_model.feature_importances_
            if len(importances) == len(feature_cols):
                top_idx = np.argsort(importances)[-3:][::-1]
                for i in top_idx:
                    alpha_signals.append(feature_cols[i].replace("_", " "))
        if not alpha_signals:
            alpha_signals.append(f"RSI: {round(rsi, 1)}")
            alpha_signals.append("Trend Alignment")

        sentiment = get_news_sentiment(ticker)

        if action == "BUY" and sentiment < -0.30:
            action = "HOLD"
            alpha_signals.append("News Sentiment Conflict (Bearish)")
        elif action == "SELL" and sentiment > 0.30:
            action = "HOLD"
            alpha_signals.append("News Sentiment Conflict (Bullish)")

        ai_score = 5
        if action == "BUY":
            if confidence >= 80:   ai_score = 9 + int(confidence >= 90)
            elif confidence >= 70: ai_score = 8
            elif confidence >= 60: ai_score = 7
            else:                  ai_score = 6
        elif action == "SELL":
            if confidence >= 80:   ai_score = 2 - int(confidence >= 90)
            elif confidence >= 70: ai_score = 3
            elif confidence >= 60: ai_score = 4
            else:                  ai_score = 5

        return {
            "action"        : action,
            "interval"      : interval,
            "current_price" : round(current_price, 5),
            "lr_pred"       : round(lr_pred, 5),
            "rf_pred"       : round(rf_pred, 5),
            "rf_ret"        : round(rf_ret, 4),
            "confidence"    : round(confidence, 1),
            "ai_score"      : ai_score,
            "alpha_signals" : alpha_signals,
            "rsi"           : round(rsi, 2),
            "macd_hist"     : round(macd_hist, 6),
            "atr"           : round(atr, 6),
            "news_sentiment": round(sentiment, 2),
        }

    except Exception as e:
        return {"action": "HOLD", "error": str(e), "confidence": 0}
