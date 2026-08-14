from dataclasses import dataclass, asdict
import hashlib
import json
from typing import Dict, Any

@dataclass(frozen=True)
class PortfolioConfig:
    experiment_id: str = "EXP-PORT-001"
    target_volatility_annual: float = 0.15
    shrinkage_method: str = "ledoit_wolf"  # ledoit_wolf, sample, exponential
    optimization_method: str = "hrp"  # hrp, kelly, risk_parity, mean_variance
    max_asset_weight: float = 0.40
    min_asset_weight: float = 0.00
    rebalance_frequency_bars: int = 5
    leverage_limit: float = 1.0

    def config_hash(self) -> str:
        data = asdict(self)
        raw = json.dumps(data, sort_keys=True)
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()
