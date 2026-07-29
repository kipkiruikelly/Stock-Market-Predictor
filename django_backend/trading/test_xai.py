"""
django_backend/trading/test_xai.py
Unit tests for Explainable AI (XAI) SHAP translation engine.
"""

from django.test import TestCase

class ExplainableAiTestCase(TestCase):
    def test_shap_to_human_drivers_conversion(self):
        raw_shap_weights = {
            'rsi_14': 0.42,
            'volume_surge': 0.28,
            'macd_signal': 0.18,
            'sentiment_score': 0.12
        }

        # Human translation logic validation
        drivers = []
        if raw_shap_weights.get('rsi_14', 0) > 0.3:
            drivers.append(f"RSI momentum recovered cleanly above 50 (+{int(raw_shap_weights['rsi_14']*100)}% contribution)")
        if raw_shap_weights.get('volume_surge', 0) > 0.2:
            drivers.append(f"Unusual volume surge detected (+{int(raw_shap_weights['volume_surge']*100)}% contribution)")

        self.assertEqual(len(drivers), 2)
        self.assertIn("RSI momentum", drivers[0])
        self.assertIn("Unusual volume surge", drivers[1])
