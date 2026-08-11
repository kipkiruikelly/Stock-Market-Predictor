import pandas as pd
import numpy as np

class ExecutionLabelGenerator:
    @staticmethod
    def generate_execution_labels(df: pd.DataFrame, fill_window_bars: int = 10) -> pd.DataFrame:
        labels = pd.DataFrame(index=df.index)
        close = df.get('close', df.get('last_price'))
        mid = df.get('mid', close)
        
        # 1. Market Order Slippage (bps)
        next_open = df.get('open', close).shift(-1)
        labels['market_slippage_bps'] = ((next_open - mid) / mid) * 10000.0
        labels['market_slippage_bps'] = labels['market_slippage_bps'].fillna(0.0)
        
        # 2. Limit Order Fill Probability
        future_low = close.iloc[::-1].rolling(fill_window_bars).min().iloc[::-1]
        future_high = close.iloc[::-1].rolling(fill_window_bars).max().iloc[::-1]
        
        # Limit buy fills if future low drops below entry
        labels['limit_fill_prob'] = np.where(future_low <= close * 0.9995, 1.0, 0.0)
        
        # 3. Adverse Selection Flag
        future_ret = (close.shift(-fill_window_bars) - close) / close
        labels['adverse_selection'] = np.where(future_ret < -0.003, 1, 0)
        
        return labels
