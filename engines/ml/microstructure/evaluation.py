import numpy as np

class MicrostructureEvaluator:
    @staticmethod
    def evaluate_execution_cost(
        actions: list,
        slippage_series: np.ndarray,
        spread_series: np.ndarray,
        commission_bps: float = 0.5
    ) -> dict:
        costs = []
        fills = 0
        for i, act in enumerate(actions):
            if act == "MARKET":
                cost = spread_series[i] + abs(slippage_series[i]) + commission_bps
                costs.append(cost)
                fills += 1
            elif act == "LIMIT":
                cost = commission_bps  # passive fill
                costs.append(cost)
                fills += 1
            elif act in ["WAIT", "HALT"]:
                continue  # no transaction
                
        if not costs:
            return {"mean_execution_cost_bps": 0.0, "fill_rate": 0.0}

        return {
            "mean_execution_cost_bps": float(np.mean(costs)),
            "total_executed_orders": fills,
            "execution_cost_savings_bps": float(5.0 - np.mean(costs))  # vs 5.0 bps baseline
        }
