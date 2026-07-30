"""
django_backend/trading/test_phase34.py
Integration unit tests for Phase 34 Enterprise Production, Security, Execution Analytics, Quant, AI Governance, & Developer Endpoints.
"""

from django.test import TestCase, RequestFactory
from trading.production_views import DeploymentStatusView
from users.security_views import SecurityCenterView, AuditLogExplorerView
from trading.execution_analytics import TcaAnalyticsView, OrderReplayView
from trading.quant_views import FactorAttributionView, PairResearchView
from trading.ai_governance_views import AiGovernanceSummaryView
from trading.collaboration_views import ActivityFeedView
from trading.report_views import ScheduledReportsView
from trading.webhook_views import WebhookManagementView


class Phase34IntegrationTestCase(TestCase):
    def setUp(self):
        self.rf = RequestFactory()

    def test_deployment_status_endpoint(self):
        req = self.rf.get('/api/production/deployments/status')
        res = DeploymentStatusView.as_view()(req)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['ok'])
        self.assertEqual(res.data['active_environment'], 'production')

    def test_security_center_endpoint(self):
        req = self.rf.get('/api/security/dashboard')
        res = SecurityCenterView.as_view()(req)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['security_risk_score'], 94)

    def test_tca_analytics_endpoint(self):
        req = self.rf.get('/api/execution/tca?ticker=AAPL')
        res = TcaAnalyticsView.as_view()(req)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['ticker'], 'AAPL')

    def test_quant_factor_attribution_endpoint(self):
        req = self.rf.get('/api/quant/factor-attribution')
        res = FactorAttributionView.as_view()(req)
        self.assertEqual(res.status_code, 200)
        self.assertIn('factor_exposures', res.data)

    def test_ai_governance_summary_endpoint(self):
        req = self.rf.get('/api/ai/governance/summary')
        res = AiGovernanceSummaryView.as_view()(req)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['summary']['total_agents_active'], 6)

    def test_developer_webhooks_endpoint(self):
        req = self.rf.get('/api/developer/webhooks')
        res = WebhookManagementView.as_view()(req)
        self.assertEqual(res.status_code, 200)
        self.assertIn('webhooks', res.data)
