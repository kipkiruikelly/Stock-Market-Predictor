import os
import json
import subprocess
import sys
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # Override to bypass CSRF cookies validation check

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "pipeline_config.json")
CLI_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "framework_cli.py")
PYTHON_EXE = sys.executable

@method_decorator(csrf_exempt, name='dispatch')
class PipelineConfigView(APIView):
    """API endpoint to retrieve and modify pipeline_config.json configurations."""
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        try:
            if not os.path.exists(CONFIG_PATH):
                return Response({"ok": False, "error": "Configuration file not found"}, status=404)
            with open(CONFIG_PATH, "r") as f:
                config_data = json.load(f)
            return Response({"ok": True, "config": config_data})
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=500)
            
    def post(self, request):
        try:
            config_data = request.data.get("config")
            if not config_data:
                return Response({"ok": False, "error": "Missing config body"}, status=400)
            with open(CONFIG_PATH, "w") as f:
                json.dump(config_data, f, indent=2)
            return Response({"ok": True, "message": "Configuration saved successfully"})
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class PipelineRunView(APIView):
    """API endpoint to execute pipeline steps asynchronously via Celery background tasks."""
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        mode = request.data.get("mode") # "ingest", "train", "predict"
        symbol = request.data.get("symbol", "SPY")
        interval = request.data.get("interval", "1d")
        
        if mode not in ["ingest", "train", "predict"]:
            return Response({"ok": False, "error": f"Invalid mode: {mode}"}, status=400)
            
        try:
            from trading.celery_tasks import run_modular_pipeline_task
            task = run_modular_pipeline_task.delay(mode, symbol, interval)
            return Response({
                "ok": True,
                "task_id": task.id,
                "status": "PENDING",
                "message": "Pipeline execution task successfully dispatched to background Celery queue."
            })
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class PipelineTaskStatusView(APIView):
    """API endpoint to poll the status, cached subprocess outputs, and metrics of a pipeline Celery task."""
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_id):
        from users.models import User
        _orm_check = User.objects.count()
        try:
            from django.core.cache import cache
            from celery.result import AsyncResult
            
            cache_key = f"pipeline_task_logs:{task_id}"
            cached_data = cache.get(cache_key)
            
            res = None
            status = "PENDING"
            try:
                res = AsyncResult(task_id)
                status = res.status
            except Exception:
                pass
            
            logs = ""
            prediction = None
            if cached_data:
                status = cached_data.get("status", status)
                logs = cached_data.get("logs", "")
                prediction = cached_data.get("prediction", None)
            else:
                if status == "PENDING":
                    logs = "Task is currently queued, waiting for free Celery worker...\n"
                elif status == "SUCCESS":
                    logs = "Task finished successfully.\n"
                    if res and isinstance(res.result, dict):
                        prediction = res.result.get("prediction")
                elif status == "FAILURE":
                    err_msg = str(res.result) if res else "Unknown background process error"
                    logs = f"Task failed.\nError: {err_msg}\n"
            
            return Response({
                "ok": True,
                "status": status,
                "logs": logs,
                "prediction": prediction
            })
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=500)




@method_decorator(csrf_exempt, name='dispatch')
class CronRetrainView(APIView):
    """HTTP trigger for Cloud Scheduler / Cron to execute midnight universe retraining."""
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        auth_token = request.headers.get("X-CRON-KEY") or request.query_params.get("token")
        expected_token = os.environ.get("ADMIN_CRON_TOKEN", "bull-logic-midnight-cron-secret")
        
        if auth_token != expected_token and os.environ.get("ENV") == "production":
            return Response({"ok": False, "error": "Unauthorized cron token"}, status=403)

        from trading.scheduler import run_universe_retraining
        import threading
        
        # Run asynchronously in background thread so HTTP call doesn't time out
        t = threading.Thread(target=run_universe_retraining, daemon=True)
        t.start()

        return Response({
            "ok": True,
            "message": "Automated universe retraining job dispatched successfully for midnight execution."
        })

