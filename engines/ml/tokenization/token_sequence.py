import pandas as pd
import numpy as np
from typing import List, Dict, Any

class TokenSequenceBuilder:
    def __init__(self, sequence_length: int = 32):
        self.sequence_length = sequence_length

    def build_sequences(self, token_id_lists: List[List[int]]) -> np.ndarray:
        n_obs = len(token_id_lists)
        if n_obs < self.sequence_length:
            return np.array([])

        sequences = []
        for i in range(self.sequence_length, n_obs + 1):
            seq_window = token_id_lists[i - self.sequence_length:i]
            # Flatten or pad each window to fixed width (e.g. 5 tokens per step)
            padded_step_list = []
            for step_tokens in seq_window:
                fixed_step = (step_tokens + [0]*5)[:5]  # pad/cut to 5 tokens per timestamp
                padded_step_list.extend(fixed_step)
            sequences.append(padded_step_list)

        return np.array(sequences)
