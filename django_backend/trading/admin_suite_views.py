"""
django_backend/trading/admin_suite_views.py
Administration Suite REST Endpoints: Users, Roles, Organizations, Feature Flags, API Keys, Billing, Settings.
"""

import logging
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

logger = logging.getLogger(__name__)


class AdminUsersView(APIView):
    """
    GET /api/admin/users/dashboard
    Returns enterprise user registry table and security status.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            users = [
                {"user_id": "USR-101", "name": "Kelvin Kipkirui", "email": "kelvin@tfos.io", "role": "QUANT_ADMIN", "org": "Alpha Capital Desk", "mfa": "ENABLED", "status": "ACTIVE", "last_login": (now - timedelta(minutes=12)).strftime("%Y-%m-%d %H:%M UTC")},
                {"user_id": "USR-102", "name": "Sarah Connor", "email": "s.connor@skyquant.com", "role": "PORTFOLIO_MANAGER", "org": "SkyQuant Hedge", "mfa": "ENABLED", "status": "ACTIVE", "last_login": (now - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M UTC")},
                {"user_id": "USR-103", "name": "Alex Mercer", "email": "a.mercer@apex.io", "role": "RESEARCHER", "org": "Apex Capital", "mfa": "ENABLED", "status": "ACTIVE", "last_login": (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M UTC")}
            ]

            return Response({
                "ok": True,
                "users": users,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in AdminUsersView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminRolesView(APIView):
    """
    GET /api/admin/roles/dashboard
    Returns RBAC roles matrix and hierarchy.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            roles = [
                {"role": "QUANT_ADMIN", "description": "Full administrative control over trading, risk, models, and billing", "users_count": 4, "permissions": ["ALL_ACCESS"]},
                {"role": "PORTFOLIO_MANAGER", "description": "Positions PMS, OMS, risk controls, and rebalancing execution", "users_count": 18, "permissions": ["TRADING_EXECUTE", "POSITIONS_READ_WRITE", "RISK_READ"]},
                {"role": "RESEARCHER", "description": "Research Lab, Datasets, Experiments, and Model Training", "users_count": 42, "permissions": ["RESEARCH_READ_WRITE", "PIPELINE_EXECUTE"]}
            ]

            return Response({
                "ok": True,
                "roles": roles,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in AdminRolesView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminOrganizationsView(APIView):
    """
    GET /api/admin/organizations/dashboard
    Returns multi-tenant enterprise organization inventory.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            orgs = [
                {"org_id": "ORG-01", "name": "Alpha Capital Desk", "plan": "ENTERPRISE_PRO", "seats": "12 / 20", "aum": "$120,000,000.00", "monthly_mrr": "$24,500.00", "status": "HEALTHY"},
                {"org_id": "ORG-02", "name": "SkyQuant Hedge", "plan": "ENTERPRISE_PRO", "seats": "18 / 25", "aum": "$85,000,000.00", "monthly_mrr": "$18,000.00", "status": "HEALTHY"},
                {"org_id": "ORG-03", "name": "Apex Capital", "plan": "GROWTH_INSTITUTIONAL", "seats": "6 / 10", "aum": "$43,500,000.00", "monthly_mrr": "$9,500.00", "status": "HEALTHY"}
            ]

            return Response({
                "ok": True,
                "orgs": orgs,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in AdminOrganizationsView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminFeatureFlagsView(APIView):
    """
    GET /api/admin/feature-flags/dashboard
    Returns kill switches, canary percentage rollouts, and targeting rules.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            flags = [
                {"flag_key": "ENABLE_ICT_ORDER_BLOCK_V2", "description": "Smart Money order block detection algorithm v2", "status": "ENABLED", "rollout_pct": "100%", "environment": "PRODUCTION"},
                {"flag_key": "CANARY_STACKING_META_LEARNER", "description": "Stacking ensemble model canary rollout", "status": "CANARY", "rollout_pct": "25%", "environment": "PRODUCTION"},
                {"flag_key": "ENABLE_HFT_MICROSTRUCTURE_SCALPER", "description": "Limit order book imbalance scalper kill switch", "status": "DISABLED", "rollout_pct": "0%", "environment": "STAGING"}
            ]

            return Response({
                "ok": True,
                "flags": flags,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in AdminFeatureFlagsView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminApiKeysView(APIView):
    """
    GET /api/admin/api-keys/dashboard
    Returns enterprise API keys, rate limits, and rotation schedule.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            keys = [
                {"key_id": "KEY-801", "name": "MT5 Production ECN Gateway", "prefix": "tfos_live_ecn_***", "scope": "TRADING_WRITE", "rate_limit": "10,000 req/min", "last_used": "2 mins ago", "status": "ACTIVE"},
                {"key_id": "KEY-802", "name": "Binance WebSocket Market Feed", "prefix": "tfos_spot_bnc_***", "scope": "MARKET_DATA_READ", "rate_limit": "50,000 req/min", "last_used": "100ms ago", "status": "ACTIVE"},
                {"key_id": "KEY-803", "name": "Interactive Brokers FIX Engine", "prefix": "tfos_ib_fix_***", "scope": "ORDERS_WRITE", "rate_limit": "5,000 req/min", "last_used": "1 min ago", "status": "ACTIVE"}
            ]

            return Response({
                "ok": True,
                "keys": keys,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in AdminApiKeysView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminBillingView(APIView):
    """
    GET /api/admin/billing/dashboard
    Returns subscription invoices, payment history, and Stripe integration status.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            invoices = [
                {"invoice_id": "INV-2026-07", "org": "Alpha Capital Desk", "amount": "$24,500.00", "date": "2026-07-01", "status": "PAID"},
                {"invoice_id": "INV-2026-07-B", "org": "SkyQuant Hedge", "amount": "$18,000.00", "date": "2026-07-01", "status": "PAID"},
                {"invoice_id": "INV-2026-07-C", "org": "Apex Capital", "amount": "$9,500.00", "date": "2026-07-01", "status": "PAID"}
            ]

            return Response({
                "ok": True,
                "invoices": invoices,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in AdminBillingView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminSettingsView(APIView):
    """
    GET /api/admin/settings/dashboard
    Returns unified system configuration across Security, Trading, AI, and Infrastructure.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            settings_config = {
                "security": {"mfa_required": True, "password_expiry_days": 90, "session_timeout_mins": 30},
                "trading": {"max_drawdown_circuit_breaker_pct": 5.0, "auto_hedge_enabled": True},
                "ai": {"confidence_threshold_pct": 85.0, "shap_explanation_enabled": True},
                "cloud": {"auto_scaling_enabled": True, "gpu_cluster_max_nodes": 8}
            }

            return Response({
                "ok": True,
                "settings": settings_config,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in AdminSettingsView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
