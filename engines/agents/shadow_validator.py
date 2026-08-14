import pandas as pd
import numpy as np
from datetime import datetime, timezone
from typing import Dict, List, Any

class ShadowLiveValidator:
    def __init__(self):
        self.shadow_logs = []

    def record_shadow_event(
        self,
        symbol: str,
        base_signal: str,
        calibrated_prob: float,
        routing_action: str,
        portfolio_weight: float,
        realized_pnl: float = None
    ) -> Dict[str, Any]:
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "symbol": symbol,
            "base_signal": base_signal,
            "calibrated_prob": calibrated_prob,
            "routing_action": routing_action,
            "portfolio_weight": portfolio_weight,
            "realized_pnl": realized_pnl
        }
        self.shadow_logs.append(event)
        return event

    def evaluate_shadow_performance(self) -> Dict[str, Any]:
        if not self.shadow_logs:
            return {"total_events": 0, "win_rate": 0.0, "mean_pnl": 0.0}
            
        df = pd.DataFrame(self.shadow_logs)
        valid = df.dropna(subset=["realized_pnl"])
        if valid.empty:
            return {"total_events": len(df), "win_rate": 0.0, "mean_pnl": 0.0}
            
        wins = (valid["realized_pnl"] > 0).mean()
        mean_pnl = valid["realized_pnl"].mean()
        return {
            "total_events": len(df),
            "evaluated_events": len(valid),
            "win_rate": float(wins),
            "mean_pnl": float(mean_pnl)
        }
