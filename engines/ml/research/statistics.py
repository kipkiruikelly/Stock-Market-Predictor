import numpy as np
from scipy import stats

class StatisticalValidator:
    @staticmethod
    def bootstrap_confidence_interval(metric_values: np.ndarray, n_bootstraps: int = 1000, ci: float = 0.95) -> dict:
        if len(metric_values) == 0:
            return {"mean": 0.0, "ci_lower": 0.0, "ci_upper": 0.0}
        bootstrapped = []
        for _ in range(n_bootstraps):
            sample = np.random.choice(metric_values, size=len(metric_values), replace=True)
            bootstrapped.append(np.mean(sample))
        alpha = (1.0 - ci) / 2.0
        lower = np.percentile(bootstrapped, alpha * 100)
        upper = np.percentile(bootstrapped, (1.0 - alpha) * 100)
        return {
            "mean": float(np.mean(metric_values)),
            "ci_lower": float(lower),
            "ci_upper": float(upper)
        }

    @staticmethod
    def t_test_comparison(champion_returns: np.ndarray, challenger_returns: np.ndarray) -> dict:
        if len(champion_returns) == 0 or len(challenger_returns) == 0:
            return {"t_stat": 0.0, "p_value": 1.0, "significant": False}
        t_stat, p_val = stats.ttest_ind(challenger_returns, champion_returns, equal_var=False)
        return {
            "t_stat": float(t_stat),
            "p_value": float(p_val),
            "significant": bool(p_val < 0.05 and t_stat > 0)
        }
