import os
import json
import pandas as pd
import numpy as np
from engines.ml.research.research_config import ResearchConfig
from engines.ml.research.metrics import QuantMetrics
from engines.ml.research.statistics import StatisticalValidator

class ResearchExperiment:
    def __init__(self, config: ResearchConfig, output_dir: str = "experiments"):
        self.config = config
        self.exp_dir = os.path.join(output_dir, config.experiment_id)
        os.makedirs(self.exp_dir, exist_ok=True)

    def run(self, X_train: pd.DataFrame, y_train: np.ndarray, X_test: pd.DataFrame, y_test: np.ndarray, model) -> dict:
        model.fit(X_train, y_train)
        probs = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else model.predict(X_test)
        
        pred_metrics = QuantMetrics.calculate_predictive_metrics(y_test, probs)
        
        # Calculate simulated returns with friction
        gross_returns = (y_test * 2 - 1) * (probs - 0.5) * 0.02
        friction_bps = (self.config.execution_assumptions.spread_bps + self.config.execution_assumptions.slippage_bps) * 1e-4
        net_returns = gross_returns - friction_bps
        
        trading_metrics = QuantMetrics.calculate_trading_metrics(net_returns)
        stats = StatisticalValidator.bootstrap_confidence_interval(net_returns)
        
        report = {
            "config": self.config.to_dict(),
            "predictive_metrics": pred_metrics,
            "trading_metrics": trading_metrics,
            "bootstrap_stats": stats
        }
        
        with open(os.path.join(self.exp_dir, "report.json"), "w") as f:
            json.dump(report, f, indent=2)
            
        return report
