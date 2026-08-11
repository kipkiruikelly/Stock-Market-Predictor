import numpy as np
from sklearn.isotonic import IsotonicRegression

class AdaptiveProbabilityModel:
    def __init__(self):
        self.calibrator = IsotonicRegression(out_of_bounds="clip")
        self.is_fitted = False

    def fit(self, base_probs: np.ndarray, y_true: np.ndarray) -> 'AdaptiveProbabilityModel':
        if len(base_probs) > 10:
            self.calibrator.fit(base_probs, y_true)
            self.is_fitted = True
        return self

    def calibrate(self, base_probs: np.ndarray) -> np.ndarray:
        if self.is_fitted:
            return self.calibrator.predict(base_probs)
        return base_probs
