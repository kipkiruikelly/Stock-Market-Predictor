import numpy as np

class MarketTokenEmbedding:
    def __init__(self, vocab_size: int = 64, d_model: int = 64):
        self.vocab_size = vocab_size
        self.d_model = d_model
        np.random.seed(42)
        self.embedding_weights = np.random.randn(vocab_size, d_model) * 0.1

    def forward(self, x_tokens: np.ndarray) -> np.ndarray:
        if x_tokens.ndim == 3:
            # (batch, seq, tokens_per_step)
            emb = self.embedding_weights[x_tokens]
            return emb.sum(axis=2)
        return self.embedding_weights[x_tokens]

class NumericalFeatureEmbedding:
    def __init__(self, n_features: int = 20, d_model: int = 64):
        self.n_features = n_features
        self.d_model = d_model
        np.random.seed(42)
        self.weights = np.random.randn(n_features, d_model) * 0.1

    def forward(self, x_num: np.ndarray) -> np.ndarray:
        return np.dot(x_num, self.weights)

class MarketEmbeddingFusion:
    def __init__(self, d_model: int = 64):
        self.d_model = d_model

    def forward(self, emb_num: np.ndarray, emb_tok: np.ndarray) -> np.ndarray:
        return 0.5 * (emb_num + emb_tok)
