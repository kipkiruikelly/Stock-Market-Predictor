import numpy as np
from sklearn.decomposition import PCA
from typing import Dict, Any

class LatentMarketStateEncoder:
    def __init__(self, n_components: int = 16):
        self.n_components = n_components
        self.pca = PCA(n_components=n_components)
        self.is_fitted = False

    def fit(self, embeddings: np.ndarray) -> 'LatentMarketStateEncoder':
        if len(embeddings) >= self.n_components:
            self.pca.fit(embeddings)
            self.is_fitted = True
        return self

    def transform(self, embeddings: np.ndarray) -> np.ndarray:
        if self.is_fitted:
            return self.pca.transform(embeddings)
        return embeddings[:, :self.n_components]
