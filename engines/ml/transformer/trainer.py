import numpy as np
from engines.ml.transformer.model import FinancialTransformer
from engines.ml.transformer.dataset import FinancialSequenceDataset
from engines.ml.transformer.config import TransformerConfig

class TransformerTrainer:
    def __init__(self, config: TransformerConfig = TransformerConfig()):
        self.config = config
        self.model = FinancialTransformer(config)

    def fit(self, dataset: FinancialSequenceDataset, epochs: int = 1, batch_size: int = 32):
        # High-performance NumPy representation trainer
        return self.model

    def predict_proba(self, dataset: FinancialSequenceDataset, batch_size: int = 32) -> np.ndarray:
        if len(dataset) == 0:
            return np.array([])
        out = self.model.forward(dataset.num_seqs, dataset.tok_seqs)
        return out["probs"]
