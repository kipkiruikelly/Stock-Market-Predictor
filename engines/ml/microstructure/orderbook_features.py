import pandas as pd
import numpy as np

class OrderBookFeatureExtractor:
    @staticmethod
    def compute_order_book_imbalance(df: pd.DataFrame, depth_levels: int = 5) -> pd.DataFrame:
        features = pd.DataFrame(index=df.index)
        
        bid_vol = df.get('bid_size', pd.Series(100.0, index=df.index))
        ask_vol = df.get('ask_size', pd.Series(100.0, index=df.index))
        
        obi = (bid_vol - ask_vol) / (bid_vol + ask_vol + 1e-6)
        features['obi_level_1'] = obi
        features['wobi_depth'] = obi * 0.8  # weighted imbalance placeholder
        return features
