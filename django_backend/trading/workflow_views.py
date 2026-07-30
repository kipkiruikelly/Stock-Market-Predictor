"""
django_backend/trading/workflow_views.py
REST API endpoints for monitoring stateful workflows and managing the 15-minute scanner.
"""

import threading
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from users.models import AdminAuditLog
from trading.background_scanner import (
    set_scanner_enabled,
    run_market_scan_cycle,
    set_scanner_tickers,
    get_scanner_tickers,
)


class WorkflowStatusView(APIView):
    """GET /api/workflow/status -> Recent FSM audit logs and scanner ticker list."""
    permission_classes = [AllowAny]

    def get(self, request):
        logs = AdminAuditLog.objects.filter(
            action__startswith="WORKFLOW_"
        ).order_by("-created_at")[:50]

        items = []
        for log in logs:
            # Strip WORKFLOW_ prefix for display
            display_action = log.action.replace("WORKFLOW_", "")
            items.append({
                "id":        log.id,
                "action":    display_action,
                "details":   log.detail or log.action,
                "timestamp": log.created_at.isoformat() if log.created_at else None,
            })

        return Response({
            "ok":       True,
            "count":    len(items),
            "workflows": items,
            "active_tickers": get_scanner_tickers(),
        })


class WorkflowToggleScannerView(APIView):
    """POST /api/workflow/toggle-scanner -> Pauses or resumes the 15-minute market scanner."""
    permission_classes = [AllowAny]

    def post(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        enabled = request.data.get("enabled", True)
        current_status = set_scanner_enabled(bool(enabled))
        return Response({
            "ok":              True,
            "scanner_enabled": current_status,
            "message":         f"Background market scanner is now {'ENABLED' if current_status else 'PAUSED'}.",
        })


class WorkflowTriggerScanView(APIView):
    """POST /api/workflow/trigger-scan -> Triggers an immediate scan cycle in the background."""
    permission_classes = [AllowAny]

    def post(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        t = threading.Thread(
            target = run_market_scan_cycle,
            daemon = True,
            name   = "ManualScanTriggerThread",
        )
        t.start()
        return Response({
            "ok":      True,
            "message": "Autonomous market scan cycle triggered in background.",
            "status":  "PROCESSING",
        })


class WorkflowUpdateTickersView(APIView):
    """POST /api/workflow/update-tickers -> Updates the list of tickers the scanner watches."""
    permission_classes = [AllowAny]

    def post(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        tickers = request.data.get("tickers", [])
        if not isinstance(tickers, list) or not tickers:
            return Response({"ok": False, "error": "tickers must be a non-empty list."}, status=400)

        set_scanner_tickers(tickers)
        return Response({
            "ok":             True,
            "active_tickers": get_scanner_tickers(),
            "message":        f"Scanner updated to watch {len(tickers)} tickers.",
        })
