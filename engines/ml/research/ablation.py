import pandas as pd
from typing import Dict, List, Callable, Any

class FeatureAblator:
    def __init__(self, model_trainer_func: Callable = None, evaluation_func: Callable = None):
        self.model_trainer_func = model_trainer_func
        self.evaluation_func = evaluation_func
        self.feature_groups = [
            "Price Action", "Technical", "ICT/Market Structure", 
            "Volatility", "Volume/Flow", "Macro", 
            "Cross-Asset", "News/Sentiment", "Microstructure", "All"
        ]

    def evaluate_incremental_contribution(self, X: pd.DataFrame, y: pd.Series, feature_mapping: Dict[str, List[str]]) -> Dict[str, float]:
        results = {}
        
        all_features = []
        for cols in feature_mapping.values():
            all_features.extend(cols)
            
        if "All" not in feature_mapping:
             feature_mapping["All"] = all_features
             
        model_all = self.model_trainer_func(X[all_features], y)
        baseline_score = self.evaluation_func(model_all, X[all_features], y)
        results["baseline_all_features"] = baseline_score
        
        for group in self.feature_groups:
            if group == "All":
                continue
                
            if group not in feature_mapping:
                results[f"{group}_ablation_impact"] = 0.0
                continue
                
            ablated_features = [f for f in all_features if f not in feature_mapping[group]]
            if not ablated_features:
                 continue
                 
            model_ablated = self.model_trainer_func(X[ablated_features], y)
            ablated_score = self.evaluation_func(model_ablated, X[ablated_features], y)
            
            impact = baseline_score - ablated_score
            results[f"{group}_ablation_impact"] = impact
            
        return results
