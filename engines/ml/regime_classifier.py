import pandas as pd
from typing import Union

class MarketRegimeClassifier:
    REGIMES = ['BULL_TREND', 'BEAR_TREND', 'SIDEWAYS_RANGE', 'HIGH_VOLATILITY', 'CRISIS_STRESS']

    def __init__(self):
        pass
        
    def classify(
        self,
        df: Union[pd.DataFrame, None] = None,
        adx: float = 20.0,
        realized_vol_z: float = 0.0,
        vix: float = 15.0,
        ret_5d: float = 0.0,
    ) -> Union[pd.Series, str]:
        if df is not None and isinstance(df, pd.DataFrame):
            regimes = pd.Series(index=df.index, dtype='str')
            for idx, row in df.iterrows():
                row_adx = row.get('adx', 20)
                row_vix = row.get('vix', 15)
                row_ret = row.get('returns_1', row.get('ret_5d', 0))
                
                if row_vix > 40:
                    regimes[idx] = 'CRISIS_STRESS'
                elif row_vix > 25:
                    regimes[idx] = 'HIGH_VOLATILITY'
                elif row_adx > 25 and row_ret > 0:
                    regimes[idx] = 'BULL_TREND'
                elif row_adx > 25 and row_ret < 0:
                    regimes[idx] = 'BEAR_TREND'
                else:
                    regimes[idx] = 'SIDEWAYS_RANGE'
            return regimes

        # Scalar evaluation
        if vix > 40:
            return 'CRISIS_STRESS'
        elif vix > 25:
            return 'HIGH_VOLATILITY'
        elif adx > 25 and ret_5d > 0:
            return 'BULL_TREND'
        elif adx > 25 and ret_5d < 0:
            return 'BEAR_TREND'
        else:
            return 'SIDEWAYS_RANGE'

