import pandas as pd
import numpy as np
from engines.ml.dataset_pipeline import DataFreshnessError

class MicrostructureDatasetManager:
    def __init__(self, check_synthetic: bool = True):
        self.check_synthetic = check_synthetic

    def validate_tick_data(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            raise DataFreshnessError("Microstructure tick dataset is empty. Real tick data required.")
        if self.check_synthetic and 'is_synthetic' in df.columns and df['is_synthetic'].any():
            raise DataFreshnessError("Synthetic tick data detected. Real market ticks required.")
            
        # Monotonicity & Quote Validation
        if not df.index.is_monotonic_increasing:
            raise ValueError("Tick timestamps must be monotonic increasing.")
        if 'bid' in df.columns and 'ask' in df.columns:
            if (df['ask'] < df['bid']).any():
                raise ValueError("Crossed quote detected: Ask price < Bid price.")
                
        return df
