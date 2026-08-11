from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class TickData:
    timestamp: datetime
    symbol: str
    bid: float
    ask: float
    bid_size: float
    ask_size: float
    last_price: float
    last_size: float
    trade_direction: str  # BUY / SELL / UNKNOWN

@dataclass
class Level2Depth:
    timestamp: datetime
    symbol: str
    bids: List[tuple]  # [(price, size), ...]
    asks: List[tuple]  # [(price, size), ...]
