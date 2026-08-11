import pandas as pd
import numpy as np

class TickFeatureExtractor:
    @staticmethod
    def compute_spread_features(df: pd.DataFrame) -> pd.DataFrame:
        features = pd.DataFrame(index=df.index)
        bid = df.get('bid', df.get('close'))
        ask = df.get('ask', df.get('close') * 1.0002)
        mid = (bid + ask) / 2.0
        
        spread_abs = ask - bid
        features['spread_abs'] = spread_abs
        features['spread_bps'] = (spread_abs / mid) * 10000.0
        features['spread_volatility'] = features['spread_bps'].rolling(20).std().fillna(0.0)
        return features
