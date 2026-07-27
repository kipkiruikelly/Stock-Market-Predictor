from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.core.cache import cache

User = get_user_model()

class EmbeddedAiAssistantTests(TestCase):
    def setUp(self):
        # Clean cache memory prior to each run
        cache.clear()
        
        self.user = User.objects.create_user(
            username='cognitive_trader',
            email='cognitive@example.com',
            password='securepassword123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_greetings_and_casual_conversation(self):
        """Verify greetings produce warm, professional natural responses without financial advice."""
        response = self.client.post('/api/ai/assistant/chat', {"prompt": "Hello there! How are you?"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertEqual(response.data.get('intent'), 'general_conversation')
        self.assertIn("Embedded AI Assistant", response.data.get('response'))
        self.assertNotIn("Ensemble Stacking", response.data.get('response')) # Standard non-trading response

    def test_platform_help_queries(self):
        """Verify queries asking about system usage route to platform help instructions."""
        response = self.client.post('/api/ai/assistant/chat', {"prompt": "How do I deploy a model to production?"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertEqual(response.data.get('intent'), 'platform_help')
        self.assertIn("navigational guide", response.data.get('response'))
        self.assertIn("/model-metrics", response.data.get('response'))

    def test_trading_analysis_intent(self):
        """Verify ticker symbols map directly to specialized technical and ML summaries."""
        response = self.client.post('/api/ai/assistant/chat', {"prompt": "Analyze EURUSD trend"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertEqual(response.data.get('intent'), 'trading_analysis')
        self.assertIn("EURUSD", response.data.get('response'))
        self.assertIn("Fair Value Gap", response.data.get('response'))

    def test_portfolio_analysis_intent(self):
        """Verify risk inquiries return active Sharpe Ratio and Allocation telemetry."""
        response = self.client.post('/api/ai/assistant/chat', {"prompt": "Show my portfolio Sharpe Ratio and drawdown metrics"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertEqual(response.data.get('intent'), 'portfolio_analysis')
        self.assertIn("Sharpe Ratio", response.data.get('response'))
        self.assertIn("4.2%", response.data.get('response'))

    def test_mlops_platform_intent(self):
        """Verify inquiries about models return drift indicators and version configurations."""
        response = self.client.post('/api/ai/assistant/chat', {"prompt": "Compare model performance and check drift"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertEqual(response.data.get('intent'), 'model_mlops')
        self.assertIn("Stacking Ensemble Predictor", response.data.get('response'))
        self.assertIn("STABLE", response.data.get('response'))

    def test_operations_intent(self):
        """Verify operations checks pull real-time database and Redis state summaries."""
        response = self.client.post('/api/ai/assistant/chat', {"prompt": "Are all backend services healthy and is Redis connected?"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertEqual(response.data.get('intent'), 'operations')
        self.assertIn("Redis Cache", response.data.get('response'))
        self.assertIn("FastAPI", response.data.get('response'))

    def test_documentation_intent(self):
        """Verify knowledge queries reference proper Trading Supervisor rules and SOE designs."""
        response = self.client.post('/api/ai/assistant/chat', {"prompt": "Explain how Smart Order Execution and Trading Supervisor work"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertEqual(response.data.get('intent'), 'documentation')
        self.assertIn("Smart Order Execution", response.data.get('response'))
        self.assertIn("Supervisor", response.data.get('response'))

    def test_unknown_intent_clarifying_prompt(self):
        """Verify random outside queries politely ask for classification focus."""
        response = self.client.post('/api/ai/assistant/chat', {"prompt": "What is the capital of France?"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('ok'))
        self.assertEqual(response.data.get('intent'), 'unknown')
        self.assertIn("I want to make sure I understand your request correctly", response.data.get('response'))

    def test_conversational_short_term_context_memory_inheritance(self):
        """Verify that a sequential conversation propagates intent context to follow-ups."""
        # Step 1: Initial trading query
        resp1 = self.client.post('/api/ai/assistant/chat', {"prompt": "Analyze Apple"})
        self.assertEqual(resp1.status_code, 200)
        self.assertEqual(resp1.data.get('intent'), 'trading_analysis')
        self.assertIn("AAPL", resp1.data.get('response'))

        # Step 2: Follow-up query leveraging conversational memory
        resp2 = self.client.post('/api/ai/assistant/chat', {"prompt": "What about Microsoft?"})
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data.get('intent'), 'trading_analysis')
        self.assertIn("MSFT", resp2.data.get('response'))
