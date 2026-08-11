from dataclasses import dataclass, asdict
import hashlib
import json
from typing import Dict, Any

@dataclass(frozen=True)
class MicrostructureConfig:
    experiment_id: str = "EXP-MICRO-001"
    available_depth: int = 5
    ofi_horizon_ms: int = 1000
    vpin_bucket_size: int = 500
    fill_window_sec: int = 10
    adverse_selection_std: float = 0.5
    execution_fee_bps: float = 0.5

    def config_hash(self) -> str:
        data = asdict(self)
        raw = json.dumps(data, sort_keys=True)
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()
