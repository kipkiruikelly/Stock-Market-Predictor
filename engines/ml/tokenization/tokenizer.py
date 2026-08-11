import pandas as pd
import numpy as np
from typing import List, Dict, Any
from engines.ml.tokenization.vocabulary import TokenVocabulary
from engines.ml.tokenization.quantizer import FeatureQuantizer
from engines.ml.tokenization.config import TokenizerConfig

class MarketTokenizer:
    def __init__(self, config: TokenizerConfig = TokenizerConfig()):
        self.config = config
        self.vocab = TokenVocabulary()
        self.quantizer = FeatureQuantizer(method=config.quantization_method, n_bins=config.n_bins)

    def fit(self, df: pd.DataFrame) -> 'MarketTokenizer':
        continuous_cols = [c for c in ['returns_1', 'gk_vol', 'atr_ratio', 'rvol', 'rsi_z_score'] if c in df.columns]
        self.quantizer.fit(df, continuous_cols)
        return self

    def tokenize_row(self, row: pd.Series) -> List[str]:
        tokens = []
        
        # Price Action
        ret = row.get('returns_1', 0.0)
        if ret > 0.015:
            tokens.append("RETURN_UP_LARGE")
        elif ret > 0.005:
            tokens.append("RETURN_UP_MEDIUM")
        elif ret > 0:
            tokens.append("RETURN_UP_SMALL")
        elif ret < -0.015:
            tokens.append("RETURN_DOWN_LARGE")
        elif ret < -0.005:
            tokens.append("RETURN_DOWN_MEDIUM")
        elif ret < 0:
            tokens.append("RETURN_DOWN_SMALL")

        # Volatility
        atr = row.get('atr_ratio', 1.0)
        if atr > 2.0:
            tokens.append("VOL_EXTREME")
        elif atr > 1.5:
            tokens.append("VOL_HIGH")
        elif atr < 0.6:
            tokens.append("VOL_LOW")
        else:
            tokens.append("VOL_NORMAL")

        # Momentum
        rsi_z = row.get('rsi_z_score', 0.0)
        if rsi_z > 1.0:
            tokens.append("MOMENTUM_BULLISH")
        elif rsi_z < -1.0:
            tokens.append("MOMENTUM_BEARISH")
        else:
            tokens.append("MOMENTUM_NEUTRAL")

        # Market Structure
        fvg = row.get('fvg_distance', 0.0)
        if fvg > 0.5:
            tokens.append("FVG_BULLISH")
        elif fvg < -0.5:
            tokens.append("FVG_BEARISH")

        # Volume / Flow
        rvol = row.get('rvol', 1.0)
        if rvol > 1.5:
            tokens.append("RVOL_HIGH")
        elif rvol < 0.7:
            tokens.append("RVOL_LOW")
        else:
            tokens.append("RVOL_NORMAL")

        # Regime
        regime = row.get('regime', 'BULL_TREND')
        if regime == 'BULL_TREND':
            tokens.append("REGIME_BULL")
        elif regime == 'BEAR_TREND':
            tokens.append("REGIME_BEAR")
        elif regime == 'CRISIS_STRESS':
            tokens.append("REGIME_CRISIS")

        return tokens

    def tokenize_dataframe(self, df: pd.DataFrame) -> List[List[str]]:
        return [self.tokenize_row(row) for _, row in df.iterrows()]

    def encode_to_ids(self, token_lists: List[List[str]]) -> List[List[int]]:
        return [[self.vocab.get_token_id(t) for t in tokens if self.vocab.get_token_id(t) != 0] for tokens in token_lists]
