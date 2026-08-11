"""
engines/prediction/symbol_map.py
Symbol lookup tables and asset-class classification for the prediction engine.
"""

# YFinance ticker override table: BullLogic symbol → yfinance symbol
YF_SYMBOL_MAP = {
    # ── Indices ───────────────────────────────────────────────────────────────
    "NDX":       "^NDX",
    "SPX":       "^GSPC",
    "SPXUSD":    "^GSPC",
    "SPX500":    "^GSPC",
    "DJI":       "^DJI",
    "VIX":       "^VIX",
    "RUT":       "^RUT",
    "FTSE":      "^FTSE",
    "DAX":       "^GDAXI",
    "NIKKEI":    "^N225",
    "HSI":       "^HSI",

    # ── Crypto ────────────────────────────────────────────────────────────────
    "BTC":       "BTC-USD",
    "ETH":       "ETH-USD",
    "BNB":       "BNB-USD",
    "SOL":       "SOL-USD",
    "XRP":       "XRP-USD",
    "ADA":       "ADA-USD",
    "AVAX":      "AVAX-USD",
    "DOGE":      "DOGE-USD",
    "DOT":       "DOT-USD",
    "LINK":      "LINK-USD",
    "LTC":       "LTC-USD",
    "MATIC":     "POL-USD",
    "SHIB":      "SHIB-USD",
    "UNI":       "UNI-USD",
    "ATOM":      "ATOM-USD",

    # ── Forex (spot) ──────────────────────────────────────────────────────────
    "EURUSD":    "EURUSD=X",
    "GBPUSD":    "GBPUSD=X",
    "USDJPY":    "USDJPY=X",
    "AUDUSD":    "AUDUSD=X",
    "USDCAD":    "USDCAD=X",
    "USDCHF":    "USDCHF=X",
    "NZDUSD":    "NZDUSD=X",
    "EURGBP":    "EURGBP=X",
    "EURJPY":    "EURJPY=X",
    "GBPJPY":    "GBPJPY=X",
    "USDMXN":    "MXN=X",
    "USDZAR":    "ZAR=X",
    "XAUUSD":    "XAUUSD=X",
    "XAGUSD":    "XAGUSD=X",

    # ── Commodities (futures) ─────────────────────────────────────────────────
    "GOLD":      "GC=F",
    "SILVER":    "SI=F",
    "OIL":       "CL=F",
    "BRENT":     "BZ=F",
    "NATGAS":    "NG=F",
    "COPPER":    "HG=F",
    "PLATINUM":  "PL=F",
    "PALLADIUM": "PA=F",
    "WHEAT":     "ZW=F",
    "CORN":      "ZC=F",
    "SOYBEAN":   "ZS=F",
    "COTTON":    "CT=F",
    "SUGAR":     "SB=F",
    "COCOA":     "CC=F",
    "COFFEE":    "KC=F",
}

# Ticker → sector ETF mapping for relative-strength features
TICKER_SECTOR_MAP = {
    "AAPL": "XLK", "MSFT": "XLK", "GOOGL": "XLK", "META": "XLK",
    "NVDA": "XLK", "AMD": "XLK", "NFLX": "XLK", "CRM": "XLK", "ADBE": "XLK",
    "AMZN": "XLY", "TSLA": "XLY", "HD": "XLY", "DIS": "XLY", "NKE": "XLY",
    "JPM": "XLF", "GS": "XLF", "BAC": "XLF", "V": "XLF", "MA": "XLF",
    "JNJ": "XLV", "PFE": "XLV", "UNH": "XLV", "ABBV": "XLV", "MRK": "XLV",
    "XOM": "XLE", "CVX": "XLE", "COP": "XLE",
    "WMT": "XLP", "COST": "XLP", "PG": "XLP", "KO": "XLP",
    "BA": "XLI", "GE": "XLI", "CAT": "XLI",
    "QQQ": "SPY", "IWM": "SPY", "DIA": "SPY",
}

EQUITY_TICKERS = {
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "AMD",
    "NFLX", "JPM", "GS", "BAC", "V", "MA", "JNJ", "PFE", "UNH",
    "XOM", "CVX", "WMT", "HD", "COST", "BA", "DIS", "CRM", "ADBE",
    "ABBV", "MRK", "PG", "KO", "NKE", "CAT", "GE", "COP",
}

# Auxiliary feature column groups
VIX_COLS = ["VIX_Level", "VIX_Change", "VIX_Percentile_252", "VIX_Regime", "VIX_MA_Ratio"]
SECTOR_COLS = ["Sector_RS_20", "Sector_RS_60", "Sector_vs_SPY_20", "Sector_Momentum"]
EARNINGS_COLS = ["Days_To_Earnings", "Days_Since_Earnings", "Pre_Earnings_Window", "Post_Earnings_Window"]
AUX_COLS = VIX_COLS + SECTOR_COLS + EARNINGS_COLS

# Fetch periods by interval
FETCH_PERIOD = {
    "1d":  "18mo",
    "1h":  "730d",
    "4h":  "730d",   # fetch as 1h then resample
    "30m": "60d",
    "15m": "60d",
    "5m":  "60d",
    "1m":  "7d",
}

HTF_YF_PARAMS = {
    "5m":  ("5m",  "60d"),
    "15m": ("15m", "60d"),
    "1h":  ("1h",  "730d"),
    "4h":  ("1h",  "730d"),  # resample to 4h after fetch
    "1d":  ("1d",  "18mo"),
}

MTF_SOURCES = {
    "1m":  ["5m", "15m", "1h"],
    "5m":  ["15m", "1h", "4h"],
    "15m": ["1h", "4h", "1d"],
    "30m": ["1h", "4h", "1d"],
    "1h":  ["4h", "1d"],
    "4h":  ["1d"],
    "1d":  [],
}

MTF_COLS = {
    "Structure_Bullish": "Struct",
    "PD_Position":       "PD",
    "RSI_14":            "RSI",
    "Above_200SMA":      "A200",
    "MACD_Diff":         "MACD",
    "Bull_FVG_Count":    "BullFVG",
    "Bear_FVG_Count":    "BearFVG",
    "Displacement":      "Disp",
    "BB_Pos":            "BBPos",
    "ADX":               "ADX",
}

INTERVAL_ORDER = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]
