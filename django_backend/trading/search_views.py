import sys
from pathlib import Path
from django.views import View
from django.http import JsonResponse
from django.contrib.auth.mixins import UserPassesTestMixin
from django.db.models import Q
from users.models import User, Portfolio, PredictionHistory, PaperTrade, AdminAuditLog

class AdminRoleRequiredMixin(UserPassesTestMixin):
    raise_exception = True
    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.role_level >= 3

class AdminGlobalSearchView(AdminRoleRequiredMixin, View):
    """
    Fuzzy search JSON endpoint across core model tables for Cmd+K search palette.
    """
    def get(self, request):
        query = request.GET.get('q', '').strip()
        if not query or len(query) < 2:
            return JsonResponse({'results': []})

        results = []

        # 1. Search Users
        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        )[:5]
        for user in users:
            results.append({
                'category': 'Identity & Access',
                'name': user.username,
                'description': f"User · {user.email} ({user.plan or 'Free'} plan)",
                'url': f"/admin/users/user/{user.id}/change/",
                'icon': 'fas fa-user-circle'
            })

        # 2. Search Portfolios
        portfolios = Portfolio.objects.filter(
            Q(name__icontains=query) | Q(base_currency__icontains=query)
        )[:5]
        for portfolio in portfolios:
            results.append({
                'category': 'Portfolio Management',
                'name': portfolio.name,
                'description': f"Portfolio · {portfolio.base_currency} · Bal: ${portfolio.current_balance}",
                'url': f"/admin/users/portfolio/{portfolio.id}/change/",
                'icon': 'fas fa-briefcase'
            })

        # 3. Search Predictions
        predictions = PredictionHistory.objects.filter(
            Q(ticker__icontains=query) | Q(direction__icontains=query)
        ).order_by('-created_at')[:5]
        for pred in predictions:
            results.append({
                'category': 'Machine Learning',
                'name': f"Prediction for {pred.ticker}",
                'description': f"LSTM/Ensemble forecast · {pred.direction} · Confidence: {pred.confidence}%",
                'url': f"/admin/users/predictionhistory/{pred.id}/change/",
                'icon': 'fas fa-brain'
            })

        # 4. Search Paper Trades
        trades = PaperTrade.objects.filter(
            Q(ticker__icontains=query) | Q(strategy__icontains=query) | Q(status__icontains=query)
        ).order_by('-created_at')[:5]
        for trade in trades:
            results.append({
                'category': 'Trading & Execution',
                'name': f"{trade.side} trade on {trade.ticker}",
                'description': f"Simulated paper trade · Qty: {trade.qty} · PnL: ${trade.pnl or 0.0} ({trade.status})",
                'url': f"/admin/users/papertrade/{trade.id}/change/",
                'icon': 'fas fa-chart-line'
            })

        # 5. Search Audit Logs
        audit_logs = AdminAuditLog.objects.filter(
            Q(action_name__icontains=query) | Q(details__icontains=query)
        ).order_by('-created_at')[:5]
        for log in audit_logs:
            results.append({
                'category': 'Audit & Compliance',
                'name': f"Log: {log.action_name}",
                'description': f"By {log.user.username if log.user else 'System'} · IP: {log.ip_address} ({log.created_at})",
                'url': f"/admin/users/adminauditlog/{log.id}/change/",
                'icon': 'fas fa-shield-alt'
            })

        return JsonResponse({'results': results})
