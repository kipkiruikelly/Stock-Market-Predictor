from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

class EndpointAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testtrader',
            email='testtrader@example.com',
            password='securepassword123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_market_overview_endpoint(self):
        """Verify GET /api/market/overview returns structured segments."""
        response = self.client.get('/api/market/overview')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('indices', response.data)
        self.assertIn('forex', response.data)

    def test_screener_endpoint(self):
        """Verify GET /api/screener processes interval-based listings."""
        response = self.client.get('/api/screener', {'interval': '1h'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('rows', response.data)

    def test_research_endpoint(self):
        """Verify GET /api/research/<ticker> runs deep model evaluations."""
        response = self.client.get('/api/research/AAPL')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('ticker', response.data)
        self.assertEqual(response.data['ticker'], 'AAPL')

    def test_operations_health_endpoint(self):
        """Verify GET /api/operations/health returns live service reports."""
        response = self.client.get('/api/operations/health')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('services', response.data)
        self.assertIn('overall_status', response.data)

    def test_api_performance_endpoint(self):
        """Verify GET /api/operations/performance returns live requests and response stats."""
        response = self.client.get('/api/operations/performance')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('total_requests', response.data)
        self.assertIn('avg_latency', response.data)

    def test_model_health_endpoint(self):
        """Verify GET /api/model/health returns deep drift assessments."""
        response = self.client.get('/api/model/health')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('drift_detection', response.data)
        self.assertIn('models', response.data)

    def test_strategy_marketplace_endpoint(self):
        """Verify GET /api/strategy/marketplace returns premium strategy grids."""
        response = self.client.get('/api/strategy/marketplace')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('strategies', response.data)

    def test_ai_assistant_chat_endpoint(self):
        """Verify POST /api/ai/assistant/chat processes conversational inputs."""
        response = self.client.post('/api/ai/assistant/chat', {"prompt": "Analyze my portfolio risk"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('response', response.data)

    def test_research_projects_endpoint(self):
        """Verify GET /api/research/projects returns active projects and metadata."""
        response = self.client.get('/api/research/projects')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('projects', response.data)

    def test_research_datasets_endpoint(self):
        """Verify GET /api/research/datasets returns continuous stock tick series."""
        response = self.client.get('/api/research/datasets')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('datasets', response.data)

    def test_model_comparison_endpoint(self):
        """Verify GET /api/research/compare returns model comparison data."""
        response = self.client.get('/api/research/compare')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('comparisons', response.data)

    def test_model_promotion_endpoint(self):
        """Verify POST /api/research/promote manages step-gate model deployment levels."""
        response = self.client.post('/api/research/promote', {"model_id": "model_xgb_01", "target_stage": "production"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('gate_checks', response.data)

    def test_market_events_endpoint(self):
        """Verify GET /api/market/events aggregates high-impact news releases."""
        response = self.client.get('/api/market/events')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('events', response.data)

    def test_trading_supervisor_endpoint(self):
        """Verify POST /api/trading/supervisor/check gates orders and risk criteria."""
        response = self.client.post('/api/trading/supervisor/check', {"ticker": "AAPL", "side": "long", "size": 15.0})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('decision', response.data)

    def test_knowledge_hub_endpoint(self):
        """Verify GET /api/knowledge/hub exposes system documentation."""
        response = self.client.get('/api/knowledge/hub')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('documentation', response.data)

    def test_executive_command_endpoint(self):
        """Verify GET /api/executive/command compiles command indicators."""
        response = self.client.get('/api/executive/command')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('business', response.data)
        self.assertIn('ai', response.data)
