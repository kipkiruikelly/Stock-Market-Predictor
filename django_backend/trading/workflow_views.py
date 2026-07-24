"""
django_backend/trading/workflow_views.py
REST API endpoints for monitoring stateful workflows and managing the 15-minute scanner.
"""

import threading
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from users.models import AdminAuditLog
from trading.background_scanner import set_scanner_enabled, run_market_scan_cycle

class WorkflowStatusView(APIView):
    """GET /api/workflow/status -> Returns recent state machine audit logs & workflow executions."""
    permission_classes = [AllowAny]

    def get(self, request):
        logs = AdminAuditLog.objects.filter(
            action__startswith="WORKFLOW_"
        ).order_by("-created_at")[:50]

        items = []
        for log in logs:
            items.append({
                "id": log.id,
                "action": log.action,
                "details": log.detail or log.action,
                "timestamp": log.created_at.isoformat() if log.created_at else None,
            })

        return Response({
            "ok": True,
            "count": len(items),
            "workflows": items
        })

class WorkflowToggleScannerView(APIView):
    """POST /api/workflow/toggle-scanner -> Pauses or resumes the 15-minute market scanner."""
    permission_classes = [AllowAny]

    def post(self, request):
        enabled = request.data.get("enabled", True)
        current_status = set_scanner_enabled(bool(enabled))
        return Response({
            "ok": True,
            "scanner_enabled": current_status,
            "message": f"Background market scanner is now {'ENABLED' if current_status else 'PAUSED'}."
        })

class WorkflowTriggerScanView(APIView):
    """POST /api/workflow/trigger-scan -> Asynchronously triggers a 15-minute market scan cycle."""
    permission_classes = [AllowAny]

    def post(self, request):
        # Offload 18s scan cycle to background thread to prevent HTTP worker gateway timeouts
        t = threading.Thread(target=run_market_scan_cycle, daemon=True, name="ManualScanTriggerThread")
        t.start()
        return Response({
            "ok": True,
            "message": "Autonomous market scan cycle triggered in background.",
            "status": "PROCESSING"
        })
