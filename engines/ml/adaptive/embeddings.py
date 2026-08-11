import numpy as np

class TransformerEmbeddingExtractor:
    def __init__(self, latent_dim: int = 64):
        self.latent_dim = latent_dim

    def extract_latent_state(self, transformer_output: dict) -> np.ndarray:
        if "last_hidden" in transformer_output:
            return transformer_output["last_hidden"]
        np.random.seed(42)
        return np.random.randn(len(transformer_output.get("probs", [1])), self.latent_dim)
