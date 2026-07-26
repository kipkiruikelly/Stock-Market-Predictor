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
