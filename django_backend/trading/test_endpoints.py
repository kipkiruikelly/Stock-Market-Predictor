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

    def test_pipeline_run_dispatches_celery_task(self):
        """Verify POST /api/pipeline/run dispatches a non-blocking background task."""
        response = self.client.post('/api/pipeline/run', {"mode": "ingest", "symbol": "AAPL", "interval": "1d"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("task_id", response.data)
        self.assertEqual(response.data.get("status"), "PENDING")

    def test_pipeline_task_status_polling(self):
        """Verify GET /api/pipeline/task/<task_id> returns proper polling structure."""
        response = self.client.get('/api/pipeline/task/mock-task-id-123')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("status", response.data)
        self.assertIn("logs", response.data)

    def test_platform_health_graph(self):
        """Verify GET /api/operations/health returns backward compatible services and the dependency graph."""
        response = self.client.get('/api/operations/health')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("services", response.data)
        self.assertIn("nodes", response.data)
        self.assertIn("links", response.data)
        self.assertIn("overall_status", response.data)

    def test_predictive_warnings(self):
        """Verify GET /api/operations/performance returns stability scores and predictive failure forecasts."""
        response = self.client.get('/api/operations/performance')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertIn("executive_stability_scores", response.data)
        self.assertIn("predictive_forecast", response.data)
        
        forecast = response.data.get("predictive_forecast")
        self.assertTrue(forecast.get("ok"))
        self.assertIn("cpu_forecast", forecast)
        self.assertIn("memory_forecast", forecast)

    def test_model_drift_triggers_retraining_incident(self):
        """Verify GET /api/model/health detects data drift, triggers retraining, and writes SRE SQLite ledger audits."""
        from trading.autonomous_engine import get_db_connection
        response = self.client.get('/api/model/health')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertTrue(response.data.get("drift_detection").get("exceeds_threshold"))
        self.assertEqual(response.data.get("drift_detection").get("status"), "degraded")
        
        # Verify incident was logged in local SQLite DB
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM incidents WHERE title='Data Drift Threshold Exceeded'")
            row = cur.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row["status"], "PENDING_APPROVAL")

    def test_aiops_assistant_diagnostics(self):
        """Verify POST /api/ai/assistant/chat resolves SRE queries by correlating local incident logs."""
        response = self.client.post('/api/ai/assistant/chat', {"prompt": "explain current system incidents and why was my model retrained?"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("ok"))
        self.assertEqual(response.data.get("intent"), "operations_sre")
        self.assertIn("AI Operations SRE Cognitive Correlation Diagnostic Report", response.data.get("response"))

    def test_trading_supervisor_circuit_breaker(self):
        """Verify AutonomousTradingSupervisor risk evaluations and circuit breakers."""
        from trading.autonomous_engine import AutonomousTradingSupervisor
        
        # Scenario A: Normal trade passes
        eval_ok = AutonomousTradingSupervisor.evaluate_trade("AAPL", "BUY", 10.0)
        self.assertEqual(eval_ok["status"], "APPROVED")
        self.assertTrue(eval_ok["checkpoints"]["portfolio_exposure_ok"])
        
        # Scenario B: Large size breaches allocation limit and blocks order
        eval_blocked = AutonomousTradingSupervisor.evaluate_trade("AAPL", "BUY", 150.0)
        self.assertEqual(eval_blocked["status"], "BLOCKED")
        self.assertFalse(eval_blocked["checkpoints"]["portfolio_exposure_ok"])
        self.assertIn("Portfolio risk allocation exceeded", eval_blocked["explanations"][0])


