"""
django_backend/trading/test_production.py
Automated SRE Integration Test Suite for Phase 31 (v3.2)
Certifies OpenTelemetry tracing, Prometheus formats, SLO burn rates, Secret Manager rotations,
disaster recovery restores, and 12-factor production readiness metrics.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

class ProductionAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='sre_audit_admin',
            email='sre@enterprise-fusion.com',
            password='production_grade_pass_9273'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_prometheus_metrics_exposition(self):
        """Verify GET /metrics is unauthenticated and returns raw Prometheus exposition strings."""
        anon_client = APIClient()
        response = anon_client.get('/api/metrics')
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/plain", response['Content-Type'])
        content = response.content.decode('utf-8')
        self.assertIn("platform_cpu_utilization_pct", content)
        self.assertIn("api_latency_p95_ms", content)
        self.assertIn("model_drift_coefficient", content)

    def test_opentelemetry_waterfall_traces(self):
        """Verify GET /api/operations/observability/traces returns traces and span linkages."""
        response = self.client.get('/api/operations/observability/traces')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("traces", response.data)
        traces = response.data.get("traces")
        self.assertGreater(len(traces), 0)
        self.assertIn("trace_id", traces[0])
        self.assertIn("spans", traces[0])

    def test_opentelemetry_servicemap(self):
        """Verify GET /api/operations/observability/servicemap yields topological nodes/links."""
        response = self.client.get('/api/operations/observability/servicemap')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("service_map", response.data)
        s_map = response.data.get("service_map")
        self.assertIn("nodes", s_map)
        self.assertIn("links", s_map)

    def test_metrics_dashboard_dimensions(self):
        """Verify GET /api/operations/metrics/dashboard groups metrics across 5 dimensions."""
        response = self.client.get('/api/operations/metrics/dashboard')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        metrics = response.data.get("metrics")
        self.assertIn("infrastructure", metrics)
        self.assertIn("application", metrics)
        self.assertIn("machine_learning", metrics)
        self.assertIn("trading", metrics)
        self.assertIn("business", metrics)

    def test_slo_compliance_budgets(self):
        """Verify GET /api/operations/slo computes remaining error budgets and burn rates."""
        response = self.client.get('/api/operations/slo')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("global_burn_rate", response.data)
        self.assertIn("slos", response.data)
        slos = response.data.get("slos")
        self.assertGreater(len(slos), 0)
        self.assertIn("target_pct", slos[0])
        self.assertIn("remaining_budget_pct", slos[0])

    def test_predictive_autoscaling_simulator(self):
        """Verify GET /api/operations/autoscaling outputs predictive autoscaling replicas."""
        response = self.client.get('/api/operations/autoscaling')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("current_cloud_run_instances", response.data)
        self.assertIn("target_cloud_run_instances", response.data)
        self.assertIn("current_celery_workers", response.data)

    def test_canary_deployment_gates(self):
        """Verify GET/POST /api/operations/deployments canary traffic splits and rolling updates."""
        # Test GET
        response = self.client.get('/api/operations/deployments')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("traffic_split_percentage", response.data)
        self.assertIn("health_validation_gates", response.data)
        
        # Test POST promote
        p_resp = self.client.post('/api/operations/deployments', {"action": "promote"})
        self.assertEqual(p_resp.status_code, 200)
        self.assertTrue(p_resp.data.get("ok"))
        
        # Test POST rollback
        r_resp = self.client.post('/api/operations/deployments', {"action": "rollback"})
        self.assertEqual(r_resp.status_code, 200)
        self.assertTrue(r_resp.data.get("ok"))

    def test_secrets_auditor_registry(self):
        """Verify GET /api/operations/secrets audits secret key version histories."""
        response = self.client.get('/api/operations/secrets')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("secrets", response.data)
        secrets = response.data.get("secrets")
        self.assertGreater(len(secrets), 0)
        self.assertIn("secret_name", secrets[0])
        self.assertIn("version_number", secrets[0])

    def test_secrets_manager_rotations(self):
        """Verify POST /api/operations/secrets/rotate rotates active credentials securely."""
        response = self.client.post('/api/operations/secrets/rotate', {"secret_name": "JWT_SIGNING_KEY"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("new_version", response.data)
        self.assertEqual(response.data.get("status"), "ACTIVE")

    def test_advanced_chaos_11_outages(self):
        """Verify POST /api/operations/chaos/trigger-advanced injects 11 advanced failover scenarios."""
        scenarios = [
            "REDIS_OUTAGE", "DATABASE_OUTAGE", "MT5_DISCONNECT", "CELERY_CRASH",
            "API_TIMEOUT", "NETWORK_LATENCY", "PACKET_LOSS", "HIGH_CPU",
            "MEMORY_EXHAUSTION", "CONTAINER_TERMINATION", "CLOUD_RUN_RESTART"
        ]
        for scenario in scenarios:
            response = self.client.post('/api/operations/chaos/trigger-advanced', {"scenario": scenario})
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.data.get("ok"))
            self.assertEqual(response.data.get("recovery_status"), "STABLE_RESTORED")
            self.assertIn("reconnection_mttr_seconds", response.data)

    def test_concurrency_benchmarks(self):
        """Verify POST /api/operations/load-test benchmarks platform load capacities."""
        response = self.client.post('/api/operations/load-test', {"users": 1000})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        report = response.data.get("benchmark_report")
        self.assertEqual(report.get("target_concurrency_users"), 1000)
        self.assertIn("simulated_throughput_rps", report)
        self.assertIn("benchmark_status", report)

    def test_security_compliance_reporting(self):
        """Verify GET /api/operations/security/compliance returns compliancy grades."""
        response = self.client.get('/api/operations/security/compliance')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("overall_grade", response.data)
        self.assertTrue(response.data.get("certified_secure"))
        self.assertIn("compliance_checklists", response.data)

    def test_disaster_recovery_restores(self):
        """Verify GET/POST /api/operations/dr verifies RPO/RTO restorability indices."""
        # Test GET
        response = self.client.get('/api/operations/dr')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("rto_target_seconds", response.data)
        
        # Test POST
        p_resp = self.client.post('/api/operations/dr/trigger')
        self.assertEqual(p_resp.status_code, 200)
        self.assertTrue(p_resp.data.get("ok"))
        self.assertIn("rpo_seconds", p_resp.data)
        self.assertIn("rto_seconds", p_resp.data)

    def test_production_readiness_scorecard(self):
        """Verify GET /api/operations/production-readiness evaluates 12-factor platform scorecards."""
        response = self.client.get('/api/operations/production-readiness')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("overall_production_readiness_score", response.data)
        self.assertIn("factors_checklist", response.data)

    def test_dynamic_ops_documentation(self):
        """Verify GET /api/operations/documentation serves runbooks and guides."""
        response = self.client.get('/api/operations/documentation')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("manuals", response.data)
        manuals = response.data.get("manuals")
        self.assertIn("ops_runbooks", manuals)
        self.assertIn("disaster_recovery_plan", manuals)
