import pandas as pd
import numpy as np

class DynamicRiskBudgeter:
    def __init__(self, target_vol_annual: float = 0.15):
        self.target_vol_annual = target_vol_annual

    def apply_regime_risk_budget(
        self,
        weights: pd.Series,
        regime: str = "BULL_TREND",
        current_drawdown: float = 0.0
    ) -> pd.Series:
        budget_scalar = 1.0
        
        if regime == "CRISIS_STRESS":
            # 100% Cash Safety Pause
            return pd.Series(0.0, index=weights.index)
        elif regime == "HIGH_VOLATILITY":
            budget_scalar = 0.50
        elif regime == "SIDEWAYS_RANGE":
            budget_scalar = 0.75
        elif regime == "BEAR_TREND":
            budget_scalar = 0.85
            
        # Drawdown throttling
        if current_drawdown < -0.05:
            budget_scalar *= 0.50
            
        scaled_weights = weights * budget_scalar
        return scaled_weights
