import numpy as np

class DriftMonitor:
    def __init__(self):
        pass
        
    def calculate_psi(self, expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
        """Calculate Population Stability Index (PSI)"""
        if len(expected) == 0 or len(actual) == 0:
            return 0.0
            
        expected_min = np.min(expected)
        expected_max = np.max(expected)
        
        bin_edges = np.linspace(expected_min, expected_max, bins + 1)
        
        expected_percents = np.histogram(expected, bin_edges)[0] / len(expected)
        actual_percents = np.histogram(actual, bin_edges)[0] / len(actual)
        
        def sub_psi(e_perc, a_perc):
            if a_perc == 0:
                a_perc = 0.0001
            if e_perc == 0:
                e_perc = 0.0001
            
            value = (e_perc - a_perc) * np.log(e_perc / a_perc)
            return value
            
        psi_value = np.sum([sub_psi(expected_percents[i], actual_percents[i]) for i in range(bins)])
        
        return psi_value
        
    def monitor_brier_degradation(self, base_brier: float, current_brier: float, threshold: float = 0.05) -> bool:
        """Return True if degradation exceeds threshold"""
        degradation = current_brier - base_brier
        return degradation > threshold
