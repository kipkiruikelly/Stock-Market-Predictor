import numpy as np

class FinancialSequenceDataset:
    def __init__(self, X_num: np.ndarray, X_tok: np.ndarray, y_labels: np.ndarray, sequence_length: int = 32):
        self.sequence_length = sequence_length
        self.num_seqs = []
        self.tok_seqs = []
        self.labels = []
        
        n_obs = len(X_num)
        if n_obs >= sequence_length:
            for i in range(sequence_length, n_obs + 1):
                self.num_seqs.append(X_num[i - sequence_length:i])
                self.tok_seqs.append(X_tok[i - sequence_length:i])
                self.labels.append(y_labels[i - 1])
                
        self.num_seqs = np.array(self.num_seqs)
        self.tok_seqs = np.array(self.tok_seqs)
        self.labels = np.array(self.labels)

    def __len__(self):
        return len(self.num_seqs)
