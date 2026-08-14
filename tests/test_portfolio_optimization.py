import unittest
import pandas as pd
import numpy as np

from engines.ml.portfolio import (
    PortfolioConfig, CovarianceEstimator, PortfolioOptimizer, DynamicRiskBudgeter
)

class TestPortfolioOptimization(unittest.TestCase):
    def setUp(self):
        np.random.seed(42)
        dates = pd.date_range('2024-01-01', periods=50, freq='1D', tz='UTC')
        self.returns_df = pd.DataFrame({
            'AAPL': np.random.randn(50) * 0.015,
            'NVDA': np.random.randn(50) * 0.025,
            'SPY': np.random.randn(50) * 0.010,
            'EURUSD': np.random.randn(50) * 0.005
        }, index=dates)

    def test_covariance_estimation(self):
        cov = CovarianceEstimator.ledoit_wolf_covariance(self.returns_df)
        self.assertEqual(cov.shape, (4, 4))
        self.assertTrue(np.all(np.linalg.eigvals(cov) > 0))

    def test_hrp_optimization(self):
        optimizer = PortfolioOptimizer(max_weight=0.40)
        weights = optimizer.hierarchical_risk_parity(self.returns_df)
        self.assertAlmostEqual(weights.sum(), 1.0, places=4)
        self.assertTrue((weights <= 0.4001).all())

    def test_risk_budgeting_crisis(self):
        budgeter = DynamicRiskBudgeter()
        weights = pd.Series([0.25, 0.25, 0.25, 0.25], index=self.returns_df.columns)
        scaled = budgeter.apply_regime_risk_budget(weights, regime="CRISIS_STRESS")
        self.assertTrue((scaled == 0.0).all())

if __name__ == '__main__':
    unittest.main()
