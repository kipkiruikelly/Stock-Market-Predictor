import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage, leaves_list
from scipy.spatial.distance import squareform
from engines.ml.portfolio.covariance import CovarianceEstimator

class PortfolioOptimizer:
    def __init__(self, max_weight: float = 0.40, min_weight: float = 0.00):
        self.max_weight = max_weight
        self.min_weight = min_weight

    def hierarchical_risk_parity(self, returns_df: pd.DataFrame) -> pd.Series:
        if returns_df.empty or len(returns_df.columns) == 1:
            cols = returns_df.columns if not returns_df.empty else ["ASSET_1"]
            return pd.Series([1.0], index=cols)
            
        cov = CovarianceEstimator.ledoit_wolf_covariance(returns_df)
        std = np.sqrt(np.diag(cov))
        corr = cov / np.outer(std, std)
        corr = np.clip(corr, -1.0, 1.0)
        
        # Distance matrix
        dist = np.sqrt(0.5 * (1.0 - corr))
        dist_compressed = squareform(dist, checks=False)
        
        # Single linkage clustering
        link = linkage(dist_compressed, method='single')
        sort_ix = leaves_list(link)
        
        # Recursive bisection for HRP weighting
        weights = pd.Series(1.0, index=returns_df.columns)
        clusters = [list(sort_ix)]
        
        while len(clusters) > 0:
            clusters = [c[j:k] for c in clusters for j, k in ((0, len(c) // 2), (len(c) // 2, len(c))) if len(c) > 1]
            for c in range(0, len(clusters), 2):
                if c + 1 >= len(clusters):
                    continue
                left = clusters[c]
                right = clusters[c + 1]
                
                left_cov = cov[np.ix_(left, left)]
                right_cov = cov[np.ix_(right, right)]
                
                left_var = 1.0 / np.trace(left_cov)
                right_var = 1.0 / np.trace(right_cov)
                
                alloc_factor = left_var / (left_var + right_var)
                weights.iloc[left] *= alloc_factor
                weights.iloc[right] *= (1.0 - alloc_factor)
                
        # Iteratively apply max/min weight caps while preserving sum == 1.0
        w_values = weights.values.copy()
        for _ in range(10):
            w_values = np.clip(w_values, self.min_weight, self.max_weight)
            if w_values.sum() > 0:
                w_values /= w_values.sum()
                
        weights = pd.Series(w_values, index=returns_df.columns)
        return weights

    def multi_asset_kelly(self, expected_returns: pd.Series, returns_df: pd.DataFrame) -> pd.Series:
        cov = CovarianceEstimator.ledoit_wolf_covariance(returns_df)
        try:
            inv_cov = np.linalg.pinv(cov)
            raw_kelly = np.dot(inv_cov, expected_returns.values)
            weights = pd.Series(raw_kelly, index=returns_df.columns)
            w_values = weights.values.copy()
            for _ in range(10):
                w_values = np.clip(w_values, self.min_weight, self.max_weight)
                if w_values.sum() > 0:
                    w_values /= w_values.sum()
            weights = pd.Series(w_values, index=returns_df.columns)
            return weights
        except Exception:
            return pd.Series(1.0 / len(returns_df.columns), index=returns_df.columns)
