import numpy as np
from dataclasses import dataclass

@dataclass
class RoutingRecommendation:
    action: str  # WAIT / LIMIT / MARKET / CANCEL / REDUCE_SIZE / HALT
    confidence: float
    expected_cost_bps: float
    fill_probability: float
    adverse_selection_risk: float

class AdaptiveExecutionRouter:
    def __init__(self, min_fill_prob: float = 0.60, max_slippage_bps: float = 5.0):
        self.min_fill_prob = min_fill_prob
        self.max_slippage_bps = max_slippage_bps

    def route_order(
        self,
        signal_direction: str,
        base_probability: float,
        vpin_toxicity: float,
        ofi_zscore: float,
        spread_bps: float,
        regime: str = "BULL_TREND"
    ) -> RoutingRecommendation:
        if regime == "CRISIS_STRESS" or vpin_toxicity > 0.70:
            return RoutingRecommendation(
                action="HALT",
                confidence=0.95,
                expected_cost_bps=0.0,
                fill_probability=0.0,
                adverse_selection_risk=0.90
            )

        # High toxicity or wide spread -> Use Limit or Wait
        if spread_bps > 8.0:
            return RoutingRecommendation(
                action="WAIT",
                confidence=0.80,
                expected_cost_bps=spread_bps,
                fill_probability=0.30,
                adverse_selection_risk=0.55
            )

        # Strong momentum / order flow -> Market order for immediate execution
        if abs(ofi_zscore) > 1.5 and spread_bps <= 3.0:
            return RoutingRecommendation(
                action="MARKET",
                confidence=0.88,
                expected_cost_bps=spread_bps + 1.5,
                fill_probability=1.0,
                adverse_selection_risk=0.15
            )

        # Default passive limit order
        return RoutingRecommendation(
            action="LIMIT",
            confidence=0.75,
            expected_cost_bps=0.5,
            fill_probability=0.72,
            adverse_selection_risk=0.25
        )
