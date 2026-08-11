from dataclasses import dataclass, asdict
import hashlib
import json
from typing import Dict, Any

@dataclass(frozen=True)
class TokenizerConfig:
    tokenizer_version: str = "v1.0"
    vocabulary_version: str = "v1.0"
    quantization_method: str = "quantile"  # quantile, fixed, zscore, kmeans
    n_bins: int = 5
    sequence_length: int = 32
    enable_composite_tokens: bool = False
    multi_timeframe_safe: bool = True

    def config_hash(self) -> str:
        data = asdict(self)
        raw = json.dumps(data, sort_keys=True)
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()
