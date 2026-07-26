"""core/utils.py — Shared utility helpers for the Django backend."""

from datetime import datetime


def utcnow() -> datetime:
    """Return the current UTC time (naive, matching Flask/SQLAlchemy default)."""
    return datetime.utcnow()


def json_error(message: str, status: int = 400):
    """Helper to build a standard error response dict."""
    from rest_framework.response import Response
    return Response({'ok': False, 'error': message}, status=status)


def json_ok(data: dict = None, **kwargs):
    """Helper to build a standard success response dict."""
    from rest_framework.response import Response
    payload = {'ok': True}
    if data:
        payload.update(data)
    payload.update(kwargs)
    return Response(payload)


def get_client_ip(request) -> str:
    """Extract real client IP, respecting X-Forwarded-For proxies."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


# ── Constants & Asset Classes ───────────────────────────────────────────────

ASSET_CLASSES_TICKERS = {
    "STOCKS": [
        "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA",
        "NFLX", "AMD", "V", "JPM", "DIS", "BA", "BABA", "INTC", "PLTR"
    ],
    "FOREX": [
        "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "EURGBP",
        "USDCHF", "NZDUSD", "EURJPY", "GBPJPY"
    ],
    "CRYPTO": [
        "BTC", "ETH", "SOL", "XRP", "BNB", "AVAX", "DOGE", "LINK", "ADA", "DOT", "MATIC", "LTC"
    ],
    "COMMODITIES": [
        "XAUUSD", "XAGUSD", "USOIL", "UKOIL", "NG"
    ],
    "INDICES": [
        "SPX500", "US30", "NAS100", "GER40", "UK100", "JPN225"
    ]
}

# Flattened default list of all covered tickers
SCREENER_TICKERS = [ticker for category in ASSET_CLASSES_TICKERS.values() for ticker in category]

_SECTOR_ETFS = {
    "Technology":       "XLK",
    "Healthcare":       "XLV",
    "Financials":       "XLF",
    "Consumer Disc":    "XLY",
    "Industrials":      "XLI",
    "Energy":           "XLE",
    "Consumer Staples": "XLP",
    "Real Estate":      "XLRE",
    "Materials":        "XLB",
    "Utilities":        "XLU",
    "Communication":    "XLC",
}


# ── Activity & Gamification helpers ───────────────────────────────────────────

def award_xp(user, amount: int):
    """Increment user's XP and persist the change."""
    if not amount:
        return
    user.xp = (user.xp or 0) + amount
    user.save(update_fields=['xp'])
