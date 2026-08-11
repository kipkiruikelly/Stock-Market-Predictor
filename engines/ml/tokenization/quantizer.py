import pandas as pd
import numpy as np
from typing import Dict, List, Any

class FeatureQuantizer:
    def __init__(self, method: str = "quantile", n_bins: int = 5):
        self.method = method
        self.n_bins = n_bins
        self.bin_edges_: Dict[str, np.ndarray] = {}

    def fit(self, df: pd.DataFrame, continuous_cols: List[str]) -> 'FeatureQuantizer':
        for col in continuous_cols:
            if col not in df.columns:
                continue
            series = df[col].dropna()
            if len(series) == 0:
                continue
            if self.method == "quantile":
                quantiles = np.linspace(0, 1, self.n_bins + 1)
                edges = np.quantile(series, quantiles)
                edges = np.unique(edges)
            elif self.method == "zscore":
                mean, std = series.mean(), series.std() + 1e-6
                edges = np.array([-np.inf, mean - 1.5*std, mean - 0.5*std, mean + 0.5*std, mean + 1.5*std, np.inf])
            else:  # fixed / uniform
                edges = np.linspace(series.min(), series.max(), self.n_bins + 1)
            self.bin_edges_[col] = edges
        return self

    def transform(self, df: pd.DataFrame, continuous_cols: List[str]) -> pd.DataFrame:
        binned_df = pd.DataFrame(index=df.index)
        for col in continuous_cols:
            if col in self.bin_edges_ and col in df.columns:
                edges = self.bin_edges_[col]
                binned_df[f"{col}_bin"] = np.digitize(df[col], edges) - 1
        return binned_df
