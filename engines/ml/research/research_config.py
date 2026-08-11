from dataclasses import dataclass, asdict
import hashlib
import json
from typing import Dict, Any

@dataclass(frozen=True)
class ExecutionAssumptions:
    spread_bps: float = 2.0
    commission_per_trade: float = 0.005
    slippage_bps: float = 3.0
    execution_delay_ms: float = 50.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass(frozen=True)
class ResearchConfig:
    experiment_id: str
    dataset_version: str
    feature_version: str
    label_version: str
    model_family: str
    asset: str
    timeframe: str = "1d"
    train_start: str = "2015-01-01"
    train_end: str = "2020-01-01"
    val_start: str = "2020-01-01"
    val_end: str = "2022-01-01"
    test_start: str = "2022-01-01"
    test_end: str = "2026-08-01"
    random_seed: int = 42
    execution_assumptions: ExecutionAssumptions = ExecutionAssumptions()
    regime_config: str = "5_state"

    def config_hash(self) -> str:
        data = asdict(self)
        raw = json.dumps(data, sort_keys=True)
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["config_hash"] = self.config_hash()
        return d
