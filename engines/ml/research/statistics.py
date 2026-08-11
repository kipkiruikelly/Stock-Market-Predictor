import numpy as np
import pandas as pd
from typing import Tuple, Dict
import scipy.stats as stats

class StatisticalValidator:
    @staticmethod
    def bootstrap_confidence_intervals(data: np.ndarray, num_samples: int = 1000, ci_level: float = 0.95) -> Tuple[float, float]:
        """Calculates bootstrap confidence intervals."""
        n = len(data)
        if n == 0:
            return (0.0, 0.0)
        samples = np.random.choice(data, size=(num_samples, n), replace=True)
        sample_means = np.mean(samples, axis=1)
        lower_bound = np.percentile(sample_means, (1 - ci_level) / 2 * 100)
        upper_bound = np.percentile(sample_means, (1 + ci_level) / 2 * 100)
        return (float(lower_bound), float(upper_bound))

    @staticmethod
    def deflated_sharpe_ratio(estimated_sharpe: float, sharpe_std: float, num_trials: int, variance_of_trials: float) -> float:
        """Calculates Deflated Sharpe Ratio (DSR) to account for multiple testing."""
        euler_mascheroni = 0.5772156649
        expected_max_sharpe = np.sqrt(variance_of_trials) * ((1 - euler_mascheroni) * stats.norm.ppf(1 - 1/num_trials) + euler_mascheroni * stats.norm.ppf(1 - 1/(num_trials * np.e)))
        
        dsr = stats.norm.cdf((estimated_sharpe - expected_max_sharpe) / sharpe_std) if sharpe_std > 0 else 0.0
        return float(dsr)

    @staticmethod
    def probability_of_backtest_overfitting(performance_matrix: pd.DataFrame, num_partitions: int = 16) -> float:
        """Calculates Probability of Backtest Overfitting (PBO)."""
        # Note: True PBO implementation requires CSCV which is beyond scope, keeping placeholder
        return 0.0 

    @staticmethod
    def compare_challenger_vs_champion(challenger_returns: np.ndarray, champion_returns: np.ndarray) -> Dict[str, float]:
        """Student's t-test for comparing Challenger vs Champion."""
        if len(challenger_returns) == 0 or len(champion_returns) == 0:
             return {"t_stat": 0.0, "p_value": 1.0}
        t_stat, p_value = stats.ttest_ind(challenger_returns, champion_returns, equal_var=False)
        return {
            "t_stat": float(t_stat),
            "p_value": float(p_value)
        }
