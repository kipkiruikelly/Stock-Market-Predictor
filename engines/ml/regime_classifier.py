import pandas as pd

class MarketRegimeClassifier:
    REGIMES = ['BULL_TREND', 'BEAR_TREND', 'SIDEWAYS_RANGE', 'HIGH_VOLATILITY', 'CRISIS_STRESS']

    def __init__(self):
        pass
        
    def classify(self, df: pd.DataFrame) -> pd.Series:
        regimes = pd.Series(index=df.index, dtype='str')
        
        for idx, row in df.iterrows():
            # Mock evaluation logic for ADX, Realized Volatility Z-score, VIX level, Return direction
            adx = row.get('adx', 20)
            vix = row.get('vix', 15)
            returns = row.get('returns_1', 0)
            
            if vix > 40:
                regimes[idx] = 'CRISIS_STRESS'
            elif vix > 25:
                regimes[idx] = 'HIGH_VOLATILITY'
            elif adx > 25 and returns > 0:
                regimes[idx] = 'BULL_TREND'
            elif adx > 25 and returns < 0:
                regimes[idx] = 'BEAR_TREND'
            else:
                regimes[idx] = 'SIDEWAYS_RANGE'
                
        return regimes
