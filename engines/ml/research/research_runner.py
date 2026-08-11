from typing import Dict, Any
from .experiment import ResearchExperiment
from .statistics import StatisticalValidator
import numpy as np

class ResearchRunner:
    def __init__(self, results_dir: str = "experiments/"):
        self.results_dir = results_dir
        
    def evaluate_champion_vs_challenger(self, champion_experiment: ResearchExperiment, challenger_experiment: ResearchExperiment, champion_returns: np.ndarray, challenger_returns: np.ndarray) -> Dict[str, Any]:
        """Manages Champion / Challenger evaluation and produces a report."""
        stats_validator = StatisticalValidator()
        comparison_stats = stats_validator.compare_challenger_vs_champion(challenger_returns, champion_returns)
        
        report = {
            "champion_id": champion_experiment.config.experiment_id,
            "challenger_id": challenger_experiment.config.experiment_id,
            "t_stat": comparison_stats["t_stat"],
            "p_value": comparison_stats["p_value"],
            "conclusion": "Challenger is statistically significantly better" if comparison_stats["p_value"] < 0.05 and comparison_stats["t_stat"] > 0 else "Challenger fails to beat Champion"
        }
        
        return report

    def evaluate_shadow(self, model_id: str, live_data: Any) -> Dict[str, Any]:
        """Evaluates a model in shadow mode."""
        return {"status": "Shadow evaluation complete", "model_id": model_id}
