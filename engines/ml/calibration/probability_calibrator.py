from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import brier_score_loss
import numpy as np

class ProbabilityCalibrator:
    def __init__(self, method: str = 'isotonic'):
        if method not in ['isotonic', 'platt']:
            raise ValueError("Method must be 'isotonic' or 'platt'")
        self.method = method
        self.calibrator = IsotonicRegression(out_of_bounds='clip') if method == 'isotonic' else None
        
    def fit(self, probs: np.ndarray, y_true: np.ndarray) -> 'ProbabilityCalibrator':
        if self.method == 'isotonic':
            self.calibrator.fit(probs, y_true)
        return self
        
    def calibrate(self, probs: np.ndarray) -> np.ndarray:
        if self.method == 'isotonic':
            return self.calibrator.predict(probs)
        return probs
        
    def expected_calibration_error(self, y_true: np.ndarray, probs: np.ndarray, n_bins: int = 10) -> float:
        bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
        binned = np.digitize(probs, bin_edges) - 1
        
        ece = 0.0
        for i in range(n_bins):
            bin_mask = (binned == i)
            if not np.any(bin_mask):
                continue
            
            bin_acc = y_true[bin_mask].mean()
            bin_conf = probs[bin_mask].mean()
            bin_weight = np.sum(bin_mask) / len(probs)
            
            ece += bin_weight * np.abs(bin_acc - bin_conf)
            
        return ece
        
    def brier_score(self, y_true: np.ndarray, probs: np.ndarray) -> float:
        return brier_score_loss(y_true, probs)
