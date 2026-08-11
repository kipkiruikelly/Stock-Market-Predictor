import json
import os
from typing import Any, Dict
from .research_config import ResearchConfig

class ResearchExperiment:
    def __init__(self, config: ResearchConfig, results_dir: str = "experiments/"):
        self.config = config
        self.results_dir = results_dir
        self.experiment_dir = os.path.join(self.results_dir, self.config.experiment_id)
        
    def _create_experiment_dir(self):
        os.makedirs(self.experiment_dir, exist_ok=True)
        
    def execute_run(self, execution_logic_func) -> Dict[str, Any]:
        """Executes a full experiment run according to ResearchConfig."""
        self._create_experiment_dir()
        
        config_dict = {
            "experiment_id": self.config.experiment_id,
            "dataset_version": self.config.dataset_version,
            "feature_version": self.config.feature_version,
            "label_version": self.config.label_version,
            "model_family": self.config.model_family,
            "asset": self.config.asset,
            "timeframe": self.config.timeframe,
            "train_start": self.config.train_start.isoformat(),
            "train_end": self.config.train_end.isoformat(),
            "val_start": self.config.val_start.isoformat(),
            "val_end": self.config.val_end.isoformat(),
            "test_start": self.config.test_start.isoformat(),
            "test_end": self.config.test_end.isoformat(),
            "random_seed": self.config.random_seed,
            "execution_assumptions": {
                "spread_bps": self.config.execution_assumptions.spread_bps,
                "commission_per_trade": self.config.execution_assumptions.commission_per_trade,
                "slippage_bps": self.config.execution_assumptions.slippage_bps,
                "execution_delay_ms": self.config.execution_assumptions.execution_delay_ms,
            },
            "regime_config": self.config.regime_config
        }
        
        with open(os.path.join(self.experiment_dir, "config.json"), "w") as f:
            json.dump(config_dict, f, indent=4)
            
        results = execution_logic_func(self.config)
        
        with open(os.path.join(self.experiment_dir, "results.json"), "w") as f:
            json.dump(results, f, indent=4)
            
        return results
