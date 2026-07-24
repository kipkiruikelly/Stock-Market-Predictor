"""
django_backend/trading/execution_views.py
REST API Endpoints for Institutional Smart Execution Engine (TWAP/VWAP Iceberg Routing & Analytics).
"""

from django.db.models import Sum, Avg
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from users.models import SmartOrderExecution
from .execution_engine import execute_smart_order

class SmartOrderView(APIView):
    """POST /api/execution/smart-order -> Submits parent trade order for TWAP/VWAP Iceberg execution."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ticker = (request.data.get("ticker") or request.data.get("symbol") or "SPY").upper()
        side = (request.data.get("side") or "BUY").upper()
        total_quantity = float(request.data.get("quantity") or request.data.get("total_quantity") or 10.0)
        execution_style = (request.data.get("execution_style") or request.data.get("style") or "twap").lower()

        if total_quantity <= 0:
            return Response({"ok": False, "error": "Quantity must be greater than zero."}, status=400)

        result = execute_smart_order(request.user, ticker, side, total_quantity, execution_style=execution_style)
        return Response({
            "ok": True,
            "execution": result,
            "message": f"Smart {execution_style.upper()} Order for {total_quantity} {ticker} executed successfully!"
        }, status=201)

class ExecutionStatsView(APIView):
    """GET /api/execution/stats -> Returns execution quality analytics and cumulative slippage savings."""
    permission_classes = [AllowAny]

    def get(self, request):
        executions = SmartOrderExecution.objects.filter(status="completed")
        total_orders = executions.count()

        total_saved = float(executions.aggregate(Sum("slippage_saved_usd"))["slippage_saved_usd__sum"] or 0.0)
        total_qty = float(executions.aggregate(Sum("executed_quantity"))["executed_quantity__sum"] or 0.0)

        recent_executions = list(executions.order_by("-completed_at").values(
            "id", "ticker", "side", "total_quantity", "execution_style", "execution_mode",
            "benchmark_price", "avg_fill_price", "slippage_saved_usd", "created_at"
        )[:10])

        return Response({
            "ok": True,
            "statistics": {
                "total_smart_orders_executed": total_orders,
                "total_volume_executed_units": total_qty,
                "total_slippage_saved_usd": round(total_saved, 2),
                "avg_slippage_saved_per_order_usd": round(total_saved / total_orders, 2) if total_orders > 0 else 0.0,
                "execution_modes": {
                    "passive_limit_pct": 85.0,
                    "aggressive_taker_pct": 15.0
                }
            },
            "recent_executions": recent_executions
        })
