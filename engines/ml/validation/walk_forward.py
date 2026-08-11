import numpy as np
import pandas as pd
from typing import Iterator, Tuple

class PurgedWalkForwardCV:
    def __init__(self, n_splits: int = 5, purge_window_bars: int = 15, embargo_bars: int = 10):
        self.n_splits = n_splits
        self.purge_window_bars = purge_window_bars
        self.embargo_bars = embargo_bars

    def split(self, df: pd.DataFrame) -> Iterator[Tuple[np.ndarray, np.ndarray, np.ndarray]]:
        n_samples = len(df)
        indices = np.arange(n_samples)
        
        split_size = n_samples // (self.n_splits + 1)
        
        for i in range(self.n_splits):
            train_end = split_size * (i + 1)
            val_end = split_size * (i + 2)
            
            # Apply purge and embargo
            actual_train_end = train_end - self.purge_window_bars
            actual_val_start = train_end + self.embargo_bars
            
            if actual_train_end <= 0 or actual_val_start >= n_samples:
                continue
                
            train_indices = indices[:actual_train_end]
            val_indices = indices[actual_val_start:val_end]
            purge_indices = indices[actual_train_end:actual_val_start]
            
            yield train_indices, val_indices, purge_indices
