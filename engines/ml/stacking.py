import numpy as np
import pandas as pd
from typing import List, Any
from sklearn.model_selection import KFold

class OOFStackingEnsemble:
    def __init__(self, base_models: List[Any], meta_model: Any, n_splits: int = 5):
        self.base_models = base_models
        self.meta_model = meta_model
        self.n_splits = n_splits
        
    def fit(self, X: pd.DataFrame, y: pd.Series):
        n_samples = len(X)
        self.oof_predictions_ = np.zeros((n_samples, len(self.base_models)))
        
        kf = KFold(n_splits=self.n_splits, shuffle=False)
        
        for i, model in enumerate(self.base_models):
            for train_index, val_index in kf.split(X):
                X_train, X_val = X.iloc[train_index], X.iloc[val_index]
                y_train, _ = y.iloc[train_index], y.iloc[val_index]
                
                model.fit(X_train, y_train)
                # Ensure models have predict_proba
                if hasattr(model, 'predict_proba'):
                    preds = model.predict_proba(X_val)[:, 1]
                else:
                    preds = model.predict(X_val)
                    
                self.oof_predictions_[val_index, i] = preds
                
            # Fit on full data for future predictions
            model.fit(X, y)
            
        # Train meta model
        self.meta_model.fit(self.oof_predictions_, y)
        
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        meta_features = np.zeros((len(X), len(self.base_models)))
        
        for i, model in enumerate(self.base_models):
            if hasattr(model, 'predict_proba'):
                meta_features[:, i] = model.predict_proba(X)[:, 1]
            else:
                meta_features[:, i] = model.predict(X)
                
        if hasattr(self.meta_model, 'predict_proba'):
            return self.meta_model.predict_proba(meta_features)[:, 1]
        else:
            return self.meta_model.predict(meta_features)
