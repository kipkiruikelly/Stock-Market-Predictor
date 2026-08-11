"""
tests/test_ml_engine.py
Phase 18 — Machine Learning & Alpha Research Engine Test Suite.
"""

import unittest
import pandas as pd
import numpy as np

from engines.ml.dataset_pipeline import IngestionPipeline, DataFreshnessError
from engines.ml.feature_engine import FeatureEngine
from engines.ml.validation.walk_forward import PurgedWalkForwardCV
from engines.ml.calibration.probability_calibrator import ProbabilityCalibrator
from engines.ml.regime_classifier import MarketRegimeClassifier
from engines.ml.model_selector import ModelSelector


class TestMLEngine(unittest.TestCase):

    def setUp(self):
        dates = pd.date_range("2024-01-01", periods=100, freq="1D", tz="UTC")
        np.random.seed(42)
        prices = 100.0 + np.cumsum(np.random.randn(100))
        highs = prices + np.abs(np.random.randn(100)) + 0.5
        lows = prices - np.abs(np.random.randn(100)) - 0.5
        closes = prices + np.random.randn(100) * 0.1
        closes = np.clip(closes, lows + 0.1, highs - 0.1)

        self.df = pd.DataFrame({
            "open": prices,
            "high": highs,
            "low": lows,
            "close": closes,
            "volume": np.random.randint(1000, 10000, size=100),
        }, index=dates)

    def test_dataset_pipeline_integrity(self):
        pipeline = IngestionPipeline()
        cleaned = pipeline.ingest(self.df)
        self.assertEqual(len(cleaned), 100)

    def test_data_freshness_failure_on_empty(self):
        pipeline = IngestionPipeline()
        empty_df = pd.DataFrame()
        with self.assertRaises(DataFreshnessError):
            pipeline.ingest(empty_df)

    def test_feature_engineering(self):
        fe = FeatureEngine()
        featured = fe.build_features(self.df)
        self.assertIn("returns_1", featured.columns)
        self.assertIn("atr_ratio", featured.columns)
        self.assertIn("rvol", featured.columns)

    def test_purged_walk_forward_cv(self):
        cv = PurgedWalkForwardCV(n_splits=3, purge_window_bars=5, embargo_bars=2)
        splits = list(cv.split(self.df))
        self.assertEqual(len(splits), 3)
        for train_idx, val_idx, purge_idx in splits:
            self.assertLess(max(train_idx), min(val_idx))

    def test_probability_calibrator(self):
        calibrator = ProbabilityCalibrator()
        y_true = np.array([0, 0, 1, 1, 1, 0, 1, 1])
        y_prob = np.array([0.1, 0.2, 0.8, 0.9, 0.7, 0.3, 0.85, 0.95])
        calibrator.fit(y_prob, y_true)
        calibrated = calibrator.calibrate(y_prob)
        self.assertEqual(len(calibrated), len(y_prob))
        brier = calibrator.brier_score(y_true, y_prob)
        self.assertGreater(brier, 0.0)

    def test_market_regime_classifier(self):
        classifier = MarketRegimeClassifier()
        regime = classifier.classify(adx=30.0, vix=15.0, ret_5d=0.05)
        self.assertEqual(regime, "BULL_TREND")

        crisis = classifier.classify(vix=45.0)
        self.assertEqual(crisis, "CRISIS_STRESS")

    def test_model_selector(self):
        selector = ModelSelector()
        model_id = selector.select_model(asset="SPY", timeframe="1d", regime="BULL_TREND")
        self.assertIsNotNone(model_id)

        with self.assertRaises(ValueError):
            selector.select_model(asset="SPY", timeframe="1d", regime="CRISIS_STRESS")


if __name__ == "__main__":
    unittest.main()
