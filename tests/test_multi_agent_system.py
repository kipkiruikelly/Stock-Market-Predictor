import unittest
import pandas as pd
import numpy as np

from engines.agents import MultiAgentOrchestrator, ShadowLiveValidator

class TestMultiAgentSystem(unittest.TestCase):
    def setUp(self):
        np.random.seed(42)
        dates = pd.date_range('2024-01-01', periods=10, freq='1D', tz='UTC')
        
        opens = 100.0 + np.random.randn(10) * 0.5
        closes = opens + np.random.randn(10) * 0.5
        highs = np.maximum(opens, closes) + 1.0
        lows = np.minimum(opens, closes) - 1.0
        
        self.df = pd.DataFrame({
            'open': opens,
            'high': highs,
            'low': lows,
            'close': closes,
            'volume': 1000 + np.random.randint(100, 500, 10),
            'prob_up': [0.65] * 10,
            'spread_bps': [2.5] * 10,
            'ofi_zscore': [1.8] * 10,
            'vpin': [0.20] * 10,
            'regime': ['BULL_TREND'] * 10
        }, index=dates)

    def test_orchestrator_pipeline_step(self):
        orchestrator = MultiAgentOrchestrator()
        result = orchestrator.process_pipeline_step("AAPL", self.df)
        self.assertEqual(result["status"], "COMPLETED")
        self.assertEqual(result["routing_action"], "MARKET")
        self.assertGreater(result["position_size"], 0.0)

    def test_shadow_validator(self):
        validator = ShadowLiveValidator()
        validator.record_shadow_event("AAPL", "BUY", 0.72, "MARKET", 0.40, realized_pnl=0.015)
        eval_metrics = validator.evaluate_shadow_performance()
        self.assertEqual(eval_metrics["total_events"], 1)
        self.assertEqual(eval_metrics["win_rate"], 1.0)

if __name__ == '__main__':
    unittest.main()
