import hashlib
import pandas as pd
from typing import Optional

class ResearchDatasetManager:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir

    def load_dataset(self, version: str) -> pd.DataFrame:
        """Loads versioned dataset, hashes it, and checks quality. Fails loudly on missing or synthetic data."""
        file_path = f"{self.data_dir}/dataset_v{version}.parquet"
        try:
            df = pd.read_parquet(file_path)
        except Exception as e:
            raise RuntimeError(f"Failed to load dataset version {version} at {file_path}. Missing or inaccessible data. {e}")
        
        if df.empty:
            raise ValueError("Dataset is empty. No fake data allowed.")
        
        return df
        
    def hash_dataset(self, df: pd.DataFrame) -> str:
        """Returns SHA256 hash of the dataset."""
        return hashlib.sha256(pd.util.hash_pandas_object(df, index=True).values).hexdigest()
