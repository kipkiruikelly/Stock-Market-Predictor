"""
django_backend/trading/test_institutional.py
Automated SRE & Institutional Integration Test Suite for Version 4.1
Certifies workspaces department permissions, champion/challenger model registrations,
ICT blocks AI reasoning, flash crash twin simulations, and compliance benchmarks.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


class InstitutionalAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='inst_audit_admin',
            email='quant_director@enterprise-fusion.com',
            password='inst_grade_pass_9273_secure'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_workspace_roles_permissions(self):
        """Verify GET & POST /api/institutional/collaboration/workspaces configures departments."""
        # 1. Fetch current workspaces
        response = self.client.get('/api/institutional/collaboration/workspaces')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        
        # 2. Initialize a new institutional department
        payload = {"organization_name": "Sovereign Wealth Fund London", "department": "Global Macro Alpha"}
        post_response = self.client.post('/api/institutional/collaboration/workspaces', payload, format='json')
        self.assertEqual(post_response.status_code, 200)
        self.assertTrue(post_response.data.get("ok"))
        workspace = post_response.data["workspace_data"]
        self.assertEqual(workspace["organization_name"], "Sovereign Wealth Fund London")
        self.assertIn("Owner", workspace["roles"])
        self.assertIn("View", workspace["permissions"]["portfolio_assets"])

    def test_champion_challenger_governance(self):
        """Verify GET & POST /api/institutional/model-governance/registry registers shadows."""
        # 1. Fetch current models under governance
        response = self.client.get('/api/institutional/model-governance/registry')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        
        # 2. Register challenger model
        payload = {"model_name": "XGBoost Momentum Challenger v3", "champion_status": "Challenger"}
        post_response = self.client.post('/api/institutional/model-governance/registry', payload, format='json')
        self.assertEqual(post_response.status_code, 200)
        self.assertTrue(post_response.data.get("ok"))
        model_data = post_response.data["governed_model_data"]
        self.assertEqual(model_data["champion_status"], "Challenger")
        self.assertEqual(model_data["validation_report"]["status"], "APPROVED")

    def test_decision_reasoning_ict_blocks(self):
        """Verify GET /api/institutional/decision-intelligence/reason evaluates RSI and ICT Order Blocks."""
        response = self.client.get('/api/institutional/decision-intelligence/reason?symbol=AAPL')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        reasoning = response.data["reasoning_engine_evaluation"]
        self.assertGreater(reasoning["confidence_score"], 0.80)
        self.assertIn("ict_order_block", reasoning["supporting_indicators"])
        self.assertEqual(reasoning["supporting_indicators"]["rsi_14"], 58.4)

    def test_workflow_visual_pipelines(self):
        """Verify POST /api/institutional/workflow/orchestrate runs Scan and Paper Trade pipeline gates."""
        payload = {"pipeline_name": "End-to-End Momentum Scan & Live Execute"}
        response = self.client.post('/api/institutional/workflow/orchestrate', payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        pipeline = response.data["workflow_execution_data"]
        self.assertEqual(pipeline["overall_status"], "PASSED_ALL_GATES")
        self.assertEqual(len(pipeline["nodes_states"]), 8)

    def test_market_twin_simulation(self):
        """Verify POST /api/institutional/market-twin/simulate models flash crashes and widenings."""
        response = self.client.post('/api/institutional/market-twin/simulate', {}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        twin = response.data["digital_market_twin_simulation_results"]
        self.assertTrue(twin["market_conditions"]["circuit_breaker_triggered"])
        self.assertEqual(twin["market_conditions"]["spread_widening_points"], 12.5)

    def test_data_fabric_lineages(self):
        """Verify GET /api/institutional/data-fabric/lineage catalogs datasets versions."""
        response = self.client.get('/api/institutional/data-fabric/lineage')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        fabric = response.data["data_fabric_catalog"]
        self.assertGreater(len(fabric["cataloged_datasets"]), 0)
        self.assertEqual(fabric["validation_status"], "VERIFIED_COMPLIANT_SCHEMA")

    def test_risk_portfolio_reports(self):
        """Verify POST /api/institutional/risk/portfolio-reports generates Greeks and Monte Carlo VaR."""
        payload = {"portfolio_value": 35000000.00}
        response = self.client.post('/api/institutional/risk/portfolio-reports', payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        report = response.data["institutional_risk_report"]
        self.assertGreater(report["option_greeks_portfolio"]["delta"], 0)
        self.assertGreater(report["value_at_risk_analyses"]["monte_carlo_var_95_usd"], 0)

    def test_aiops_operations_postmortem(self):
        """Verify GET /api/institutional/aiops/operations returns failure logs and postmortem audits."""
        response = self.client.get('/api/institutional/aiops/operations')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        aiops = response.data["aiops_operational_data"]
        self.assertIn("dependency_impact_graph", aiops)
        self.assertGreater(len(aiops["ai_generated_postmortems"]), 0)

    def test_executive_dashboard_indicators(self):
        """Verify GET /api/institutional/executive/dashboard returns ARR growth and costs forecasts."""
        response = self.client.get('/api/institutional/executive/dashboard')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        indicators = response.data["executive_dashboard_indicators"]
        self.assertGreater(indicators["business_intelligence"]["arr_growth_forecast_usd"], 0)
        self.assertEqual(indicators["infrastructure_intelligence"]["overall_availability_index"], 0.9998)

    def test_developer_explorer_api(self):
        """Verify GET /api/institutional/developer/api-explorer returns multi-language SDK snippets."""
        response = self.client.get('/api/institutional/developer/api-explorer')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        dev = response.data["developer_explorer"]
        self.assertIn("python", dev["sdk_code_snippets"])
        self.assertIn("go", dev["sdk_code_snippets"])

    def test_compliance_soc2_evidence(self):
        """Verify GET /api/institutional/compliance/dashboard returns SOC 2 compliance ratings."""
        response = self.client.get('/api/institutional/compliance/dashboard')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        compliance = response.data["compliance_audit_data"]
        self.assertEqual(compliance["evidence_collection_registry"]["soc2_compliance_controls"], "VERIFIED_COMPLIANT")
        self.assertEqual(compliance["regulatory_score_pct"], 100.0)

    def test_optimization_benchmarks_latency(self):
        """Verify GET /api/institutional/optimization/benchmarks indexes speedups."""
        response = self.client.get('/api/institutional/optimization/benchmarks')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        bench = response.data["performance_optimizations_benchmarks"]
        self.assertLess(bench["post_optimization"]["average_api_latency_ms"], bench["pre_optimization"]["average_api_latency_ms"])
