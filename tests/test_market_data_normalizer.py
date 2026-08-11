import pytest
from datetime import datetime, timezone, timedelta
import pandas as pd

from engines.market_data.normalizer import _ensure_utc, normalize_bars, normalize_quote
from engines.market_data.interface import DataFreshness, MarketBar, Quote

def test_ensure_utc_timestamp():
    dt_naive = datetime(2023, 1, 1, 12, 0, 0)
    dt_utc = _ensure_utc(dt_naive)
    assert dt_utc.tzinfo == timezone.utc
    
    dt_aware = datetime(2023, 1, 1, 12, 0, 0, tzinfo=timezone(timedelta(hours=3)))
    dt_utc_2 = _ensure_utc(dt_aware)
    assert dt_utc_2.tzinfo == timezone.utc

def test_normalize_bars():
    data = {
        "Open": [100.0],
        "High": [105.0],
        "Low": [99.0],
        "Close": [104.0],
        "Volume": [1000]
    }
    index = [datetime(2023, 1, 1, 12, 0, 0, tzinfo=timezone.utc)]
    df = pd.DataFrame(data, index=index)
    
    bars = normalize_bars(df, symbol="AAPL", interval="1h", freshness=DataFreshness.LIVE)
    assert len(bars) == 1
    bar = bars[0]
    assert bar.symbol == "AAPL"
    assert bar.open == 100.0
    assert bar.close == 104.0
    assert bar.volume == 1000
    assert bar.freshness == DataFreshness.LIVE

def test_normalize_quote():
    raw_quote = {
        "price": 150.5,
        "prev": 149.0,
        "chg": 1.5,
        "pct": 1.0,
        "verified": True
    }
    quote = normalize_quote(raw_quote, symbol="MSFT", freshness=DataFreshness.LIVE)
    assert quote.symbol == "MSFT"
    assert quote.price == 150.5
    assert quote.prev_close == 149.0
    assert quote.change == 1.5
    assert quote.change_pct == 1.0
    assert quote.freshness == DataFreshness.LIVE
    assert quote.verified is True
