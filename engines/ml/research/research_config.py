from dataclasses import dataclass
from typing import Dict, Any, Optional
import datetime

@dataclass(frozen=True)
class ExecutionAssumptions:
    spread_bps: float
    commission_per_trade: float
    slippage_bps: float
    execution_delay_ms: int

@dataclass(frozen=True)
class ResearchConfig:
    experiment_id: str
    dataset_version: str
    feature_version: str
    label_version: str
    model_family: str
    asset: str
    timeframe: str
    train_start: datetime.datetime
    train_end: datetime.datetime
    val_start: datetime.datetime
    val_end: datetime.datetime
    test_start: datetime.datetime
    test_end: datetime.datetime
    random_seed: int
    execution_assumptions: ExecutionAssumptions
    regime_config: Optional[Dict[str, Any]] = None
