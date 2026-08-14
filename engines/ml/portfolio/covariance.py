import numpy as np
import pandas as pd
from sklearn.covariance import LedoitWolf

class CovarianceEstimator:
    @staticmethod
    def ledoit_wolf_covariance(returns_df: pd.DataFrame) -> np.ndarray:
        if returns_df.empty or len(returns_df) < 5:
            n_assets = len(returns_df.columns) if not returns_df.empty else 1
            return np.eye(n_assets) * 0.0001
            
        lw = LedoitWolf()
        lw.fit(returns_df.fillna(0.0).values)
        return lw.covariance_

    @staticmethod
    def exponential_covariance(returns_df: pd.DataFrame, halflife: int = 20) -> np.ndarray:
        if returns_df.empty:
            return np.eye(1)
        cov = returns_df.ewm(halflife=halflife).cov()
        last_date = returns_df.index[-1]
        return cov.loc[last_date].values
