import numpy as np

class AdaptivePositionSizer:
    def __init__(self, max_position: float = 1.0, min_confidence: float = 0.60):
        self.max_position = max_position
        self.min_confidence = min_confidence

    def compute_position_size(
        self,
        calibrated_prob: float,
        volatility_atr: float = 1.0,
        regime: str = "BULL_TREND"
    ) -> float:
        if regime == "CRISIS_STRESS" or calibrated_prob < self.min_confidence:
            return 0.0
            
        # Kelly-inspired probability fraction
        win_rate = calibrated_prob
        odds = 1.33  # 2.0σ TP / 1.5σ SL
        kelly_b = (win_rate * odds - (1.0 - win_rate)) / odds
        kelly_fraction = max(0.0, kelly_b)
        
        # Volatility normalization adjustment
        vol_scalar = 1.0 / max(0.5, volatility_atr)
        position_size = np.clip(kelly_fraction * vol_scalar, 0.0, self.max_position)
        return float(position_size)
