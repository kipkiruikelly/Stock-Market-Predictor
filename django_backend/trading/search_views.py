import sys
from pathlib import Path
from django.views import View
from django.http import JsonResponse
from django.contrib.auth.mixins import UserPassesTestMixin
from django.db.models import Q
from users.models import (
    User, Portfolio, PredictionHistory, PaperTrade, AdminAuditLog,
    ModelVersion, TradingBot, Watchlist, Notification, ApiKey
)

class AdminRoleRequiredMixin(UserPassesTestMixin):
    raise_exception = True
    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.role_level >= 3

class AdminGlobalSearchView(AdminRoleRequiredMixin, View):
    """
    Fuzzy search JSON endpoint across 10+ core model tables and Platform documentation.
    Used by the Cmd+K universal search palette in the admin dashboard.
    """
    def get(self, request):
        query = request.GET.get('q', '').strip()
        if not query or len(query) < 2:
            return JsonResponse({'results': []})

        results = []
        lower_query = query.lower()

        # ── 1. Static Documentation Runbooks Matches ─────────────────────────
        doc_topics = [
            {
                'name': 'Infrastructure Health Runbook',
                'description': 'Guides for monitoring Redis, Gunicorn, Celery queues, and PostgreSQL pools.',
                'keywords': ['infra', 'health', 'celery', 'redis', 'database', 'sql', 'runbook', 'gunicorn'],
                'url': '/admin/#docs-hub',
                'icon': 'fas fa-book-open'
            },
            {
                'name': 'Disaster Recovery (DR) Protocol',
                'description': 'Disaster mitigation, database rollbacks, replication failovers, and backup restorations.',
                'keywords': ['disaster', 'dr', 'recovery', 'backup', 'rollback', 'failover', 'restore'],
                'url': '/admin/#docs-hub',
                'icon': 'fas fa-fire-extinguisher'
            },
            {
                'name': 'System Architecture Overview',
                'description': 'Design specs of Triple-Fusion-Engine, FastAPI bridges, and relational ledgers.',
                'keywords': ['architecture', 'design', 'fastapi', 'django', 'bridge', 'engine', 'structure'],
                'url': '/admin/#docs-hub',
                'icon': 'fas fa-project-diagram'
            },
            {
                'name': 'MLOps & Drift Mitigation Guides',
                'description': 'Feature importance checks, SHAP thresholds, and model retraining pipelines.',
                'keywords': ['ml', 'mlops', 'drift', 'shap', 'feature', 'retrain', 'pipeline', 'accuracy'],
                'url': '/admin/#docs-hub',
                'icon': 'fas fa-brain'
            },
            {
                'name': 'Incident Management Desk',
                'description': 'View active infrastructure incident logs, assign handlers, or close issues.',
                'keywords': ['incident', 'inc', 'ticket', 'outage', 'mttd', 'mttr'],
                'url': '/admin/#incidents-center',
                'icon': 'fas fa-fire-extinguisher'
            },
            {
                'name': 'Celery Task Supervisor',
                'description': 'Monitor backlogged queues, running background training tasks, cancel or retry.',
                'keywords': ['celery', 'task', 'queue', 'backlog', 'retry', 'daemon'],
                'url': '/admin/#celery-center',
                'icon': 'fas fa-tasks'
            },
            {
                'name': 'Enforced Sessions Desk',
                'description': 'See authenticated admin and staff browser sessions with force eviction tools.',
                'keywords': ['session', 'evict', 'logout', 'terminal', 'device'],
                'url': '/admin/#sessions-center',
                'icon': 'fas fa-user-shield'
            },
            {
                'name': 'Executive Reports Compiler',
                'description': 'Generate downloadable PDF summaries, Excel templates, and strategy CSVs.',
                'keywords': ['report', 'excel', 'pdf', 'csv', 'download', 'compile'],
                'url': '/admin/#executive-analytics',
                'icon': 'fas fa-file-invoice-dollar'
            }
        ]

        for topic in doc_topics:
            if any(keyword in lower_query for keyword in topic['keywords']):
                results.append({
                    'category': 'Platform Documentation',
                    'name': topic['name'],
                    'description': topic['description'],
                    'url': topic['url'],
                    'icon': topic['icon']
                })

        # ── 2. Query Users ───────────────────────────────────────────────────
        try:
            users = User.objects.filter(
                Q(username__icontains=query) | Q(email__icontains=query)
            )[:5]
            for u in users:
                results.append({
                    'category': 'Identity & Access',
                    'name': u.username,
                    'description': f"Operator Account · {u.email} ({u.role|upper} · {u.plan or 'Free'} plan)",
                    'url': f"/admin/users/user/{u.id}/change/",
                    'icon': 'fas fa-user-circle'
                })
        except Exception:
            pass

        # ── 3. Query Portfolios ──────────────────────────────────────────────
        try:
            portfolios = Portfolio.objects.filter(
                Q(name__icontains=query) | Q(base_currency__icontains=query)
            )[:5]
            for p in portfolios:
                results.append({
                    'category': 'Portfolio Management',
                    'name': p.name,
                    'description': f"Asset Pool · {p.base_currency} · Total Equity: ${p.total_equity:.2f}",
                    'url': f"/admin/users/portfolio/{p.id}/change/",
                    'icon': 'fas fa-briefcase'
                })
        except Exception:
            pass

        # ── 4. Query Prediction History ──────────────────────────────────────
        try:
            predictions = PredictionHistory.objects.filter(
                Q(ticker__icontains=query) | Q(direction__icontains=query)
            ).order_by('-created_at')[:5]
            for pred in predictions:
                results.append({
                    'category': 'Machine Learning',
                    'name': f"Prediction: {pred.ticker}",
                    'description': f"Ensemble Signal · {pred.direction} · Confidence: {pred.confidence}%",
                    'url': f"/admin/users/predictionhistory/{pred.id}/change/",
                    'icon': 'fas fa-brain'
                })
        except Exception:
            pass

        # ── 5. Query Paper Trades ────────────────────────────────────────────
        try:
            trades = PaperTrade.objects.filter(
                Q(ticker__icontains=query) | Q(strategy__icontains=query) | Q(status__icontains=query)
            ).order_by('-created_at')[:5]
            for t in trades:
                results.append({
                    'category': 'Trading & Execution',
                    'name': f"{t.side} on {t.ticker}",
                    'description': f"Simulated Order · Qty: {t.qty} · PnL: ${t.pnl or 0.0:.2f} ({t.status})",
                    'url': f"/admin/users/papertrade/{t.id}/change/",
                    'icon': 'fas fa-chart-line'
                })
        except Exception:
            pass

        # ── 6. Query Trading Bot Strategies ──────────────────────────────────
        try:
            bots = TradingBot.objects.filter(
                Q(name__icontains=query) | Q(slug__icontains=query) | Q(asset_class__icontains=query)
            )[:5]
            for b in bots:
                results.append({
                    'category': 'Trading & Execution',
                    'name': b.name,
                    'description': f"Algorithmic Bot · {b.asset_class} ({b.interval}) · Active: {b.is_active}",
                    'url': f"/admin/users/tradingbot/{b.id}/change/",
                    'icon': 'fas fa-robot'
                })
        except Exception:
            pass

        # ── 7. Query Model Versions ──────────────────────────────────────────
        try:
            models = ModelVersion.objects.filter(
                Q(version__icontains=query) | Q(ticker__icontains=query) | Q(model_type__icontains=query)
            )[:5]
            for m in models:
                results.append({
                    'category': 'Machine Learning',
                    'name': f"Model: {m.version}",
                    'description': f"Type: {m.model_type} · Ticker: {m.ticker} · Production Active: {m.is_active}",
                    'url': f"/admin/users/modelversion/{m.id}/change/",
                    'icon': 'fas fa-layer-group'
                })
        except Exception:
            pass

        # ── 8. Query User Watchlists ─────────────────────────────────────────
        try:
            watchlists = Watchlist.objects.filter(
                Q(name__icontains=query)
            )[:5]
            for w in watchlists:
                results.append({
                    'category': 'Market Intelligence',
                    'name': w.name,
                    'description': f"Symbols: {', '.join(w.symbols[:4])} · Owner: {w.user.username}",
                    'url': f"/admin/users/watchlist/{w.id}/change/",
                    'icon': 'fas fa-list-ul'
                })
        except Exception:
            pass

        # ── 9. Query System Notifications ─────────────────────────────────────
        try:
            notifications = Notification.objects.filter(
                Q(title__icontains=query) | Q(body__icontains=query) | Q(type__icontains=query)
            ).order_by('-created_at')[:5]
            for n in notifications:
                results.append({
                    'category': 'Centralized Alerts',
                    'name': n.title,
                    'description': f"Alert type: {n.type} · Read: {n.read} ({n.created_at.strftime('%Y-%m-%d')})",
                    'url': f"/admin/users/notification/{n.id}/change/",
                    'icon': 'fas fa-bell'
                })
        except Exception:
            pass

        # ── 10. Query Developer API Keys ──────────────────────────────────────
        try:
            keys = ApiKey.objects.filter(
                Q(name__icontains=query) | Q(user__username__icontains=query)
            )[:5]
            for k in keys:
                results.append({
                    'category': 'Developer Tools',
                    'name': f"Key: {k.name}",
                    'description': f"API Key · Owner: {k.user.username} · Calls Today: {k.calls_today}",
                    'url': f"/admin/users/apikey/{k.id}/change/",
                    'icon': 'fas fa-key'
                })
        except Exception:
            pass

        # ── 11. Query System Audit Logs ──────────────────────────────────────
        try:
            audit_logs = AdminAuditLog.objects.filter(
                Q(action_name__icontains=query) | Q(details__icontains=query)
            ).order_by('-created_at')[:5]
            for log in audit_logs:
                results.append({
                    'category': 'Audit & Compliance',
                    'name': f"Audit: {log.action_name}",
                    'description': f"By {log.user.username if log.user else 'System'} · Client IP: {log.ip_address}",
                    'url': f"/admin/users/adminauditlog/{log.id}/change/",
                    'icon': 'fas fa-user-shield'
                })
        except Exception:
            pass

        return JsonResponse({'results': results})
