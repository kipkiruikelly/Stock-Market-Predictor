import numpy as np
from sklearn.ensemble import RandomForestClassifier

class LatentMetaLabeler:
    def __init__(self, threshold: float = 0.60):
        self.threshold = threshold
        self.model = RandomForestClassifier(n_estimators=50, max_depth=4, random_state=42)
        self.is_fitted = False

    def fit(self, X_fused: np.ndarray, y_meta: np.ndarray) -> 'LatentMetaLabeler':
        if len(X_fused) > 10:
            self.model.fit(X_fused, y_meta)
            self.is_fitted = True
        return self

    def predict_accept(self, X_fused: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            return np.ones(len(X_fused), dtype=bool)
        probs = self.model.predict_proba(X_fused)[:, 1]
        return probs >= self.threshold
