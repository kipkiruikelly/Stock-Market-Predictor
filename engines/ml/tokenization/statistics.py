import pandas as pd
import numpy as np
from typing import List, Dict, Any

class TokenStatisticsEngine:
    @staticmethod
    def compute_token_frequencies(token_lists: List[List[str]]) -> Dict[str, int]:
        freqs = {}
        for tokens in token_lists:
            for t in tokens:
                freqs[t] = freqs.get(t, 0) + 1
        return freqs

    @staticmethod
    def compute_token_transition_matrix(token_lists: List[List[str]]) -> Dict[str, Dict[str, float]]:
        transitions = {}
        for i in range(len(token_lists) - 1):
            curr_tokens = token_lists[i]
            next_tokens = token_lists[i+1]
            for c in curr_tokens:
                if c not in transitions:
                    transitions[c] = {}
                for n in next_tokens:
                    transitions[c][n] = transitions[c].get(n, 0) + 1

        # Normalize to probabilities
        prob_matrix = {}
        for c, nexts in transitions.items():
            total = sum(nexts.values())
            prob_matrix[c] = {n: count / total for n, count in nexts.items()}
        return prob_matrix
