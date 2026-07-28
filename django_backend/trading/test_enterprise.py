"""
django_backend/trading/test_enterprise.py
Automated SRE & Quant Integration Test Suite for Phase 32 (v3.2 Enterprise Gold Upgrade)
Certifies OpenTelemetry SDK, Monte Carlo Path Forecasts, Efficient Frontier curves,
salted Secrets rotations, targeting Feature Flags, universal search, and SOC 2 audits.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


class EnterpriseAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='enterprise_audit_admin',
            email='cto@enterprise-fusion.com',
            password='gold_grade_pass_9273_secure'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_distributed_tracing_propagation_waterfalls(self):
        """Verify GET /api/enterprise/observability/traces returns traces and RCA guides."""
        response = self.client.get('/api/enterprise/observability/traces')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("traces_waterfall", response.data)
        self.assertIn("root_cause_analysis", response.data)
        
        waterfall = response.data.get("traces_waterfall")
        self.assertGreater(len(waterfall), 0)
        self.assertIn("trace_id", waterfall[0])
        self.assertIn("span_id", waterfall[0])
        self.assertIn("service", waterfall[0])

    def test_observability_dashboard_widgets(self):
        """Verify GET /api/enterprise/observability/dashboard yields Grafana-style telemetry metrics."""
        response = self.client.get('/api/enterprise/observability/dashboard')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("infrastructure", response.data)
        self.assertIn("application", response.data)
        self.assertIn("trading", response.data)
        self.assertIn("mlops", response.data)
        self.assertIn("business", response.data)

    def test_sre_incidents_lifecycle(self):
        """Verify GET & POST /api/enterprise/sre/incidents creates and audits system incident state rows."""
        # 1. Fetch current incidents
        response = self.client.get('/api/enterprise/sre/incidents')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        
        # 2. Register new manual incident
        payload = {
            "severity": "CRITICAL",
            "owner": "kelvinkipkirui",
            "affected_services": ["postgres-db", "mt5-bridge"],
            "root_cause": "Deadlock during portfolio rebalancing computations",
            "recovery_actions": "Recycled DB connection pools"
        }
        post_response = self.client.post('/api/enterprise/sre/incidents', payload, format='json')
        self.assertEqual(post_response.status_code, 200)
        self.assertTrue(post_response.data.get("ok"))
        self.assertEqual(post_response.data["created_incident"]["owner"], "kelvinkipkirui")

    def test_secrets_salted_cryptographic_rotations(self):
        """Verify Secrets rotations hash salted versions and track IAM audits."""
        # 1. Rotate Secret Key
        payload = {"key": "API_STRIPE_SECRET_KEY", "value": "sk_live_51Mpw9sH18"}
        response = self.client.post('/api/enterprise/secrets/rotate', payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertEqual(response.data["rotation_metadata"]["version"], 1)
        self.assertIn("secret_hash", response.data["rotation_metadata"])
        
        # 2. Audit version history
        get_response = self.client.get('/api/enterprise/secrets')
        self.assertEqual(get_response.status_code, 200)
        self.assertTrue(get_response.data.get("ok"))

    def test_canary_deployments_traffic_splitting(self):
        """Verify Canary traffic ratios and automated rollback thresholds gates."""
        response = self.client.get('/api/enterprise/deployments/canary')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertEqual(response.data["canary_deployments"]["canary_percentage"], 25)

    def test_feature_flags_percentage_targeting(self):
        """Verify Feature flags targeting logic with percentage hashes and role verification."""
        response = self.client.get('/api/enterprise/feature-flags?user_id=trader-101&role=VIP')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("ENABLE_VIP_MT5_EDGE", response.data["evaluations"])

    def test_quant_portfolio_simulations(self):
        """Verify Monte Carlo geometric Brownian simulations and Efficient Frontier optimizers."""
        payload = {"initial_value": 150000.00, "paths": 100}
        response = self.client.post('/api/enterprise/portfolio/optimization', payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("monte_carlo_forecast", response.data)
        self.assertIn("efficient_frontier", response.data)
        
        mc = response.data["monte_carlo_forecast"]
        self.assertEqual(mc["paths_count"], 100)
        self.assertGreater(mc["p50_median"], 0)

    def test_explainable_ai_shap_values(self):
        """Verify Explainable AI endpoint yields SHAP vectors and reasoning summaries."""
        response = self.client.get('/api/enterprise/explainable-ai')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("prediction_explanation", response.data)
        self.assertIn("shap_values", response.data["prediction_explanation"])

    def test_universal_cmd_k_search(self):
        """Verify universal indexer search retrieves matching results accurately."""
        response = self.client.get('/api/enterprise/search?q=Ensemble')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertGreaterEqual(response.data["total_matches"], 1)

    def test_notifications_alerts_dispatcher(self):
        """Verify notifications dispatch and severity-based multi-channel routing logs."""
        response = self.client.get('/api/enterprise/notifications')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        
        payload = {
            "category": "Security",
            "title": "SQL Injection attempt blocked",
            "body": "WAF intercepted payload: OR 1=1;--",
            "severity": "CRITICAL"
        }
        post_response = self.client.post('/api/enterprise/notifications', payload, format='json')
        self.assertEqual(post_response.status_code, 200)
        self.assertTrue(post_response.data.get("ok"))
        self.assertIn("Slack", post_response.data["dispatched_alert"]["channels_routed"])

    def test_cloud_run_cost_intelligence(self):
        """Verify infrastructure resource projection and cost reduction recommendations."""
        response = self.client.get('/api/enterprise/cloud-costs')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("costs_calculations", response.data)

    def test_compliance_scorecards(self):
        """Verify compliance scoring yields valid rate audits for GDPR and SOC 2 audits."""
        response = self.client.get('/api/enterprise/compliance')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertGreater(response.data["compliance_scores"]["soc2_compliance_rate_pct"], 90.0)
