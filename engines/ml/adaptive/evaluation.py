import numpy as np
from engines.ml.research.metrics import QuantMetrics

class AdaptivePipelineEvaluator:
    @staticmethod
    def evaluate_pipeline(
        base_probs: np.ndarray,
        meta_accept: np.ndarray,
        y_true: np.ndarray,
        friction_bps: float = 5.0
    ) -> dict:
        # Filter accepted trades
        filtered_mask = meta_accept
        y_test_filt = y_true[filtered_mask]
        probs_filt = base_probs[filtered_mask]

        if len(y_test_filt) == 0:
            return {"precision": 0.0, "net_sharpe": 0.0, "accepted_trades": 0}

        pred_metrics = QuantMetrics.calculate_predictive_metrics(y_test_filt, probs_filt)
        
        gross_returns = (y_test_filt * 2 - 1) * (probs_filt - 0.5) * 0.02
        net_returns = gross_returns - (friction_bps * 1e-4)
        
        trading_metrics = QuantMetrics.calculate_trading_metrics(net_returns)
        
        return {
            "precision": pred_metrics["precision"],
            "brier_score": pred_metrics["brier_score"],
            "net_sharpe": trading_metrics["sharpe"],
            "max_drawdown": trading_metrics["max_drawdown"],
            "accepted_trades": int(np.sum(filtered_mask)),
            "filter_rejection_rate": float(1.0 - np.mean(filtered_mask))
        }
