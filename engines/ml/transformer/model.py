import numpy as np
from engines.ml.transformer.config import TransformerConfig
from engines.ml.transformer.embeddings import NumericalFeatureEmbedding, MarketTokenEmbedding, MarketEmbeddingFusion
from engines.ml.transformer.positional_encoding import SinusoidalPositionalEncoding

class FinancialTransformer:
    def __init__(self, config: TransformerConfig = TransformerConfig()):
        self.config = config
        self.num_embed = NumericalFeatureEmbedding(config.n_numerical_features, config.d_model)
        self.tok_embed = MarketTokenEmbedding(config.vocab_size, config.d_model)
        self.fusion = MarketEmbeddingFusion(config.d_model)
        self.pos_encoder = SinusoidalPositionalEncoding(config.d_model, max_len=256)
        
        # Softmax head weights
        np.random.seed(42)
        self.head_weights = np.random.randn(config.d_model, 3) * 0.1

    def forward(self, x_num: np.ndarray, x_tok: np.ndarray) -> dict:
        emb_num = self.num_embed.forward(x_num)
        emb_tok = self.tok_embed.forward(x_tok)
        
        if self.config.representation_mode == "numerical":
            x_fused = emb_num
        elif self.config.representation_mode == "token":
            x_fused = emb_tok
        else:
            x_fused = self.fusion.forward(emb_num, emb_tok)
            
        x_pos = self.pos_encoder.forward(x_fused)
        last_hidden = x_pos[:, -1, :]
        
        logits = np.dot(last_hidden, self.head_weights)
        exp_logits = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
        probs = exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)
        
        return {
            "logits": logits,
            "probs": probs,
            "last_hidden": last_hidden
        }
