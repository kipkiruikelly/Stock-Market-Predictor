from dataclasses import dataclass, asdict
import hashlib
import json
from typing import Dict, Any, List

@dataclass(frozen=True)
class TransformerConfig:
    experiment_id: str = "EXP-TFM-001"
    sequence_length: int = 32
    d_model: int = 64
    n_heads: int = 4
    n_layers: int = 2
    dim_feedforward: int = 128
    dropout: float = 0.1
    learning_rate: float = 1e-3
    vocab_size: int = 64
    n_numerical_features: int = 20
    representation_mode: str = "numerical_token"  # numerical, token, numerical_token, full_hybrid
    multi_task_heads: bool = True

    def config_hash(self) -> str:
        data = asdict(self)
        raw = json.dumps(data, sort_keys=True)
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()
