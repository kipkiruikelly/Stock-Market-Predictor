"""
django_backend/trading/test_ai_fos.py
Automated SRE & AI-FOS Integration Test Suite for Version 4.0
Certifies multi-agent consensus, knowledge graph nodes, persistent memory context,
Option Greeks, Value at Risk, Expected Shortfalls, and Digital Twin market crashes.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


class AiFosAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='fos_audit_admin',
            email='chief_ai_officer@enterprise-fusion.com',
            password='fos_grade_pass_9273_secure'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_multi_agent_consensus_orchestration(self):
        """Verify POST /api/ai-fos/multi-agent/orchestrate negotiates consensus across 6 agents."""
        payload = {"topic": "Trigger AAPL Long Trade under Golden-Cross"}
        response = self.client.post('/api/ai-fos/multi-agent/orchestrate', payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        consensus = response.data["orchestrated_agents_consensus"]
        self.assertEqual(consensus["consensus_status"], "APPROVED_BY_CONSENSUS")
        self.assertIn("Trading Supervisor Agent", consensus["orchestrated_agents"])

    def test_knowledge_graph_query(self):
        """Verify GET /api/ai-fos/knowledge-graph/query queries nodes links diameters."""
        response = self.client.get('/api/ai-fos/knowledge-graph/query')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        graph = response.data["knowledge_graph"]
        self.assertGreaterEqual(graph["indexed_entities_count"], 5)
        self.assertEqual(graph["nodes"][0]["category"], "Users")

    def test_memory_context_persistence(self):
        """Verify GET & POST /api/ai-fos/memory/context caches conversation timelines."""
        # 1. Post context message
        payload = {"session_id": "test-session-99", "message": "Verify model validation drift limits"}
        response = self.client.post('/api/ai-fos/memory/context', payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        
        # 2. Get context messages
        get_response = self.client.get('/api/ai-fos/memory/context?session_id=test-session-99')
        self.assertEqual(get_response.status_code, 200)
        self.assertTrue(get_response.data.get("ok"))
        self.assertEqual(get_response.data["session_context"][-1]["message"], "Verify model validation drift limits")

    def test_research_platform_experiment_lineage(self):
        """Verify GET /api/ai-fos/research/platform queries versioned lineages."""
        response = self.client.get('/api/ai-fos/research/platform')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        research = response.data["collaborative_research"]
        self.assertIn("ds-v14-clean", research["experiments_lineage"])

    def test_workflow_engine_approvals(self):
        """Verify GET & POST /api/ai-fos/workflow/engine routes and audits state approvals."""
        # 1. Create a workflow
        create_payload = {"action": "create", "title": "Deploy v4.0.0-Gold to production"}
        response = self.client.post('/api/ai-fos/workflow/engine', create_payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        wf_id = response.data["created_workflow"]["id"]
        
        # 2. Approve the workflow
        approve_payload = {"action": "approve", "workflow_id": wf_id, "comment": "Audit guidelines fully passed.", "user": "vp_sre"}
        approve_response = self.client.post('/api/ai-fos/workflow/engine', approve_payload, format='json')
        self.assertEqual(approve_response.status_code, 200)
        self.assertTrue(approve_response.data.get("ok"))
        self.assertEqual(approve_response.data["approved_workflow"]["status"], "APPROVED")

    def test_quant_greeks_var_es(self):
        """Verify POST /api/ai-fos/quant/risk computes Black-Scholes Greeks, VaR, and Expected Shortfall."""
        payload = {
            "S": 160.0,
            "K": 150.0,
            "T": 0.5,
            "r": 0.04,
            "sigma": 0.22,
            "portfolio_value": 12000000.00
        }
        response = self.client.post('/api/ai-fos/quant/risk', payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        
        greeks = response.data["option_greeks_analysis"]["option_greeks"]
        self.assertGreater(greeks["delta"], 0)
        self.assertGreater(greeks["gamma"], 0)
        
        var_es = response.data["portfolio_value_at_risk_metrics"]
        self.assertGreater(var_es["value_at_risk_var_usd"], 0)
        self.assertGreater(var_es["expected_shortfall_es_usd"], 0)

    def test_data_lineage_scoring(self):
        """Verify GET /api/ai-fos/data/lineage queries catalogs lineage schema trees."""
        response = self.client.get('/api/ai-fos/data/lineage')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        catalog = response.data["data_platform_catalog_and_lineage"]
        self.assertGreater(catalog["dataset_catalog"][0]["data_quality_score"], 0.90)

    def test_sdk_plugins_registry(self):
        """Verify GET /api/ai-fos/sdk/plugins returns download paths and active plugins."""
        response = self.client.get('/api/ai-fos/sdk/plugins')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        sdk = response.data["plugins_and_sdk_marketplace"]
        self.assertIn("python_sdk_download_url", sdk)
        self.assertGreater(len(sdk["registered_market_strategy_plugins"]), 0)

    def test_decision_intelligence_reasoning_chains(self):
        """Verify GET /api/ai-fos/decision-intelligence evaluates reasons and evidence counterarguments."""
        response = self.client.get('/api/ai-fos/decision-intelligence?proposal=AAPL')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        decision = response.data["decision_intelligence_analysis"]
        self.assertGreater(decision["decision_score"], 0)
        self.assertGreater(len(decision["reasoning_chain"]), 0)
        self.assertGreater(len(decision["counterarguments"]), 0)

    def test_digital_twin_shock_stress_testing(self):
        """Verify POST /api/ai-fos/digital-twin/simulate models -20% crashes and fails database latency."""
        response = self.client.post('/api/ai-fos/digital-twin/simulate', {}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        twin = response.data["digital_twin_shock_tested_results"]
        self.assertIn("Black Monday", twin["simulated_scenario_name"])
        self.assertTrue(twin["impact_analysis"]["margin_call_triggered_status"])
        self.assertGreater(twin["impact_analysis"]["projected_drawdown_amount_usd"], 0)

    def test_governance_regulatory_policies(self):
        """Verify GET /api/ai-fos/governance/policy audits control libraries."""
        response = self.client.get('/api/ai-fos/governance/policy')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        gov = response.data["governance_and_policy_verification"]
        self.assertEqual(gov["regulatory_score_pct"], 100.0)

    def test_executive_growth_intelligence(self):
        """Verify GET /api/ai-fos/executive/intelligence forecasts business ARR metrics."""
        response = self.client.get('/api/ai-fos/executive/intelligence')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        exec_intel = response.data["executive_business_intelligence"]
        self.assertGreater(exec_intel["arr_growth_forecast_usd"], 0)

    def test_architecture_standards_review(self):
        """Verify GET /api/ai-fos/certification/review verifies DDD and Clean Architecture standards."""
        response = self.client.get('/api/ai-fos/certification/review')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        review = response.data["architecture_review"]
        self.assertEqual(review["standards_compliance"]["clean_architecture"], "PASSED (Strict decoupling boundaries between modules)")
