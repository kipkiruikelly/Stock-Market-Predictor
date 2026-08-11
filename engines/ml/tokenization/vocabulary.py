from dataclasses import dataclass
from typing import Dict, List, Optional
import json

@dataclass(frozen=True)
class TokenDefinition:
    token_id: int
    token_name: str
    category: str
    semantic_meaning: str
    version: str = "v1.0"

class TokenVocabulary:
    def __init__(self):
        self._vocab: Dict[int, TokenDefinition] = {}
        self._name_to_id: Dict[str, int] = {}
        self._build_default_vocabulary()

    def _build_default_vocabulary(self):
        tokens = [
            # Price Action (1000-1099)
            (1001, "RETURN_UP_SMALL", "PRICE_ACTION", "Positive log return < 0.5 std"),
            (1002, "RETURN_UP_MEDIUM", "PRICE_ACTION", "Positive log return 0.5-1.5 std"),
            (1003, "RETURN_UP_LARGE", "PRICE_ACTION", "Positive log return > 1.5 std"),
            (1004, "RETURN_DOWN_SMALL", "PRICE_ACTION", "Negative log return > -0.5 std"),
            (1005, "RETURN_DOWN_MEDIUM", "PRICE_ACTION", "Negative log return -0.5 to -1.5 std"),
            (1006, "RETURN_DOWN_LARGE", "PRICE_ACTION", "Negative log return < -1.5 std"),
            (1007, "PRICE_EXPANSION", "PRICE_ACTION", "Bar range > 1.5x ATR"),
            (1008, "PRICE_COMPRESSION", "PRICE_ACTION", "Bar range < 0.6x ATR"),

            # Volatility (1100-1199)
            (1101, "VOL_LOW", "VOLATILITY", "Garman-Klass vol < 20th percentile"),
            (1102, "VOL_NORMAL", "VOLATILITY", "Garman-Klass vol 20-80th percentile"),
            (1103, "VOL_HIGH", "VOLATILITY", "Garman-Klass vol 80-95th percentile"),
            (1104, "VOL_EXTREME", "VOLATILITY", "Garman-Klass vol > 95th percentile"),

            # Momentum (1200-1299)
            (1201, "MOMENTUM_BULLISH", "MOMENTUM", "RSI z-score > 1.0"),
            (1202, "MOMENTUM_BEARISH", "MOMENTUM", "RSI z-score < -1.0"),
            (1203, "MOMENTUM_NEUTRAL", "MOMENTUM", "RSI z-score between -1.0 and 1.0"),

            # Market Structure (1300-1399)
            (1301, "BOS_BULLISH", "MARKET_STRUCTURE", "Break of structure to the upside"),
            (1302, "BOS_BEARISH", "MARKET_STRUCTURE", "Break of structure to the downside"),
            (1303, "CHOCH_BULLISH", "MARKET_STRUCTURE", "Change of character to bullish"),
            (1304, "CHOCH_BEARISH", "MARKET_STRUCTURE", "Change of character to bearish"),
            (1305, "FVG_BULLISH", "MARKET_STRUCTURE", "Fair Value Gap bullish imbalance"),
            (1306, "FVG_BEARISH", "MARKET_STRUCTURE", "Fair Value Gap bearish imbalance"),

            # Volume / Flow (1400-1499)
            (1401, "RVOL_LOW", "VOLUME_FLOW", "Relative volume < 0.7x"),
            (1402, "RVOL_NORMAL", "VOLUME_FLOW", "Relative volume 0.7x-1.5x"),
            (1403, "RVOL_HIGH", "VOLUME_FLOW", "Relative volume > 1.5x"),

            # Regimes (1500-1599)
            (1501, "REGIME_BULL", "REGIME", "Strong upward trending regime"),
            (1502, "REGIME_BEAR", "REGIME", "Strong downward trending regime"),
            (1503, "REGIME_RANGE", "REGIME", "Sideways consolidation regime"),
            (1504, "REGIME_HIGH_VOL", "REGIME", "High volatility expansion regime"),
            (1505, "REGIME_CRISIS", "REGIME", "Crisis stress market regime"),

            # Microstructure (1600-1699)
            (1601, "SPREAD_TIGHT", "MICROSTRUCTURE", "Effective spread < median"),
            (1602, "SPREAD_WIDE", "MICROSTRUCTURE", "Effective spread > 80th percentile"),
            (1603, "TICK_INTENSITY_HIGH", "MICROSTRUCTURE", "Trade count > 2x average"),
        ]

        for token_id, name, cat, desc in tokens:
            t_def = TokenDefinition(token_id, name, cat, desc)
            self._vocab[token_id] = t_def
            self._name_to_id[name] = token_id

    def get_token_id(self, token_name: str) -> int:
        return self._name_to_id.get(token_name, 0)  # 0 = UNKNOWN

    def get_token_definition(self, token_id: int) -> Optional[TokenDefinition]:
        return self._vocab.get(token_id)

    def size(self) -> int:
        return len(self._vocab)
