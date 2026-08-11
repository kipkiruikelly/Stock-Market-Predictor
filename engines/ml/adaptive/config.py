from dataclasses import dataclass, asdict
import hashlib
import json
from typing import Dict, Any

@dataclass(frozen=True)
class AdaptiveConfig:
    experiment_id: str = "EXP-022-001"
    latent_dim: int = 64
    compressed_dim: int = 16
    meta_label_threshold: float = 0.60
    sizing_mode: str = "adaptive_kelly"  # fixed, volatility, kelly, adaptive_kelly, rl
    max_position_size: float = 1.0
    enable_transformer_embeddings: bool = True

    def config_hash(self) -> str:
        data = asdict(self)
        raw = json.dumps(data, sort_keys=True)
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()
