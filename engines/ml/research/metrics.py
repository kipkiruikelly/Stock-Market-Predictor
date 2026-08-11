import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, brier_score_loss, log_loss, precision_recall_curve, auc

class QuantMetrics:
    @staticmethod
    def calculate_classification_metrics(y_true: np.ndarray, y_pred_proba: np.ndarray, threshold: float = 0.5) -> Dict[str, float]:
        y_pred = (y_pred_proba >= threshold).astype(int)
        
        precision, recall, _ = precision_recall_curve(y_true, y_pred_proba)
        pr_auc = auc(recall, precision)
        
        # Expected Calibration Error (ECE) - simplified version proxy
        ece = float(np.mean(np.abs(y_pred_proba - y_true)))

        metrics = {
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1": float(f1_score(y_true, y_pred, zero_division=0)),
            "brier_score": float(brier_score_loss(y_true, y_pred_proba)),
            "ece": ece
        }
        
        if len(np.unique(y_true)) > 1:
            metrics["roc_auc"] = float(roc_auc_score(y_true, y_pred_proba))
            metrics["pr_auc"] = float(pr_auc)
            metrics["log_loss"] = float(log_loss(y_true, y_pred_proba, labels=[0, 1]))
        else:
            metrics["roc_auc"] = float('nan')
            metrics["pr_auc"] = float('nan')
            metrics["log_loss"] = float('nan')
            
        return metrics

    @staticmethod
    def calculate_financial_metrics(returns: pd.Series, risk_free_rate: float = 0.0) -> Dict[str, float]:
        if returns.empty:
            return {}
            
        annualization_factor = 252 * 24 * 60
        
        mean_return = float(returns.mean())
        std_return = float(returns.std())
        
        sharpe = np.sqrt(annualization_factor) * (mean_return - risk_free_rate) / std_return if std_return != 0 else 0.0
        
        downside_returns = returns[returns < 0]
        downside_std = float(downside_returns.std()) if not downside_returns.empty else 0.0
        sortino = np.sqrt(annualization_factor) * (mean_return - risk_free_rate) / downside_std if downside_std != 0 and len(downside_returns) > 0 else 0.0
        
        cumulative_returns = (1 + returns).cumprod()
        running_max = cumulative_returns.cummax()
        drawdown = (cumulative_returns - running_max) / running_max
        max_drawdown = float(drawdown.min())
        
        calmar = (mean_return * annualization_factor) / abs(max_drawdown) if max_drawdown != 0 else 0.0
        
        gross_profit = float(returns[returns > 0].sum())
        gross_loss = float(abs(returns[returns < 0].sum()))
        profit_factor = gross_profit / gross_loss if gross_loss != 0 else float('inf')
        
        win_rate = len(returns[returns > 0]) / len(returns) if len(returns) > 0 else 0.0
        
        return {
            "net_expectancy": mean_return,
            "annualized_sharpe_ratio": sharpe,
            "sortino_ratio": sortino,
            "profit_factor": profit_factor,
            "max_drawdown": max_drawdown,
            "calmar_ratio": calmar,
            "turnover": 0.0,
            "win_rate": win_rate
        }
