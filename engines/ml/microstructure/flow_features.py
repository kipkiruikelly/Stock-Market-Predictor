import pandas as pd
import numpy as np

class OrderFlowFeatureExtractor:
    @staticmethod
    def compute_ofi(df: pd.DataFrame) -> pd.DataFrame:
        features = pd.DataFrame(index=df.index)
        bid = df.get('bid', df.get('close'))
        ask = df.get('ask', df.get('close'))
        bid_size = df.get('bid_size', pd.Series(100.0, index=df.index))
        ask_size = df.get('ask_size', pd.Series(100.0, index=df.index))
        
        delta_bid_p = bid.diff().fillna(0.0)
        delta_ask_p = ask.diff().fillna(0.0)
        
        ofi = np.where(delta_bid_p > 0, bid_size, np.where(delta_bid_p == 0, bid_size.diff().fillna(0.0), 0.0)) - \
              np.where(delta_ask_p < 0, ask_size, np.where(delta_ask_p == 0, ask_size.diff().fillna(0.0), 0.0))
              
        features['ofi_raw'] = ofi
        features['ofi_zscore'] = (features['ofi_raw'] - features['ofi_raw'].rolling(50).mean()) / (features['ofi_raw'].rolling(50).std() + 1e-6)
        features['ofi_zscore'] = features['ofi_zscore'].fillna(0.0)
        return features
