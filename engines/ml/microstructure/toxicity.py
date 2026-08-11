import pandas as pd
import numpy as np

class ToxicityEstimator:
    @staticmethod
    def compute_vpin(df: pd.DataFrame, bucket_size: int = 500) -> pd.DataFrame:
        features = pd.DataFrame(index=df.index)
        volume = df.get('volume', pd.Series(1000.0, index=df.index))
        close = df.get('close', df.get('last_price'))
        
        returns = close.pct_change().fillna(0.0)
        buy_vol = np.where(returns >= 0, volume, 0.0)
        sell_vol = np.where(returns < 0, volume, 0.0)
        
        order_imbalance = np.abs(buy_vol - sell_vol)
        vpin = order_imbalance / (volume + 1e-6)
        features['vpin_estimate'] = pd.Series(vpin, index=df.index).rolling(20).mean().fillna(0.1)
        features['toxicity_regime'] = np.where(features['vpin_estimate'] > 0.6, "HIGH_TOXICITY", "NORMAL_TOXICITY")
        return features
