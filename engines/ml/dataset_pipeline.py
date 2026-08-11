import pandas as pd
import hashlib

class DataFreshnessError(Exception):
    pass

class IngestionPipeline:
    def __init__(self, check_freshness: bool = True):
        self.check_freshness = check_freshness

    def ingest(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            raise DataFreshnessError("Dataframe is empty.")
        
        # Enforce real data only
        if 'is_synthetic' in df.columns and df['is_synthetic'].any():
            raise DataFreshnessError("Synthetic data detected. Only real data is allowed.")

        self._check_data_quality(df)
        
        return df

    def _check_data_quality(self, df: pd.DataFrame) -> None:
        if not df.index.is_monotonic_increasing:
            raise ValueError("Time index must be monotonic increasing.")
            
        if df.index.duplicated().any():
            raise ValueError("Duplicate candles detected.")
            
        for col in ['open', 'high', 'low', 'close']:
            if col not in df.columns:
                raise ValueError(f"Missing required OHLC column: {col}")
                
        if not ((df['high'] >= df['open']).all() and (df['high'] >= df['close']).all()):
            raise ValueError("High prices must be >= Open and Close.")
            
        if not ((df['low'] <= df['open']).all() and (df['low'] <= df['close']).all()):
            raise ValueError("Low prices must be <= Open and Close.")

    def compute_hash(self, df: pd.DataFrame) -> str:
        return hashlib.sha256(pd.util.hash_pandas_object(df, index=True).values).hexdigest()
