class ModelSelector:
    def __init__(self):
        pass
        
    def select_model(self, asset: str, timeframe: str, regime: str) -> str:
        if regime == 'CRISIS_STRESS':
            raise ValueError("Trading rejected during CRISIS_STRESS regime.")
            
        return f"{asset}_{timeframe}_{regime}_model"
