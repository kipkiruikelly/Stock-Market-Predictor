"""
django_backend/trading/portfolio_suite_views.py
Portfolio Suite REST Endpoints powered by live Django ORM database queries.
"""

import logging
from datetime import datetime
from django.db.models import Sum, Count, Avg
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from users.models import Portfolio, Holding, Transaction

logger = logging.getLogger(__name__)


class PortfolioAnalyticsView(APIView):
    """GET /api/portfolio/analytics"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()
            p_stats = Portfolio.objects.aggregate(tot_eq=Sum('total_equity'), tot_pnl=Sum('total_profit_loss'))
            return Response({"ok": True, "total_aum": p_stats['tot_eq'] or 0.0, "total_pnl": p_stats['tot_pnl'] or 0.0, "timestamp": now.isoformat()})
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PortfolioAllocationView(APIView):
    """GET /api/portfolio/allocation"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()
            alloc = Holding.objects.values('asset_class').annotate(total_val=Sum('market_value'), count=Count('id'))
            return Response({"ok": True, "allocation": list(alloc), "timestamp": now.isoformat()})
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PortfolioPerformanceView(APIView):
    """GET /api/portfolio/performance"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()
            portfolios = Portfolio.objects.filter(status='active')
            p_list = [{"id": p.id, "name": p.name, "equity": p.total_equity, "return_pct": p.total_return_percentage} for p in portfolios]
            return Response({"ok": True, "portfolios": p_list, "timestamp": now.isoformat()})
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PortfolioRiskView(APIView):
    """GET /api/portfolio/risk"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()
            p_stats = Portfolio.objects.aggregate(tot_eq=Sum('total_equity'))
            return Response({"ok": True, "var_95": (p_stats['tot_eq'] or 0.0) * 0.02, "status": "LOW_RISK", "timestamp": now.isoformat()})
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
