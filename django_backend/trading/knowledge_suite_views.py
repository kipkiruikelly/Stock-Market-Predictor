"""
django_backend/trading/knowledge_suite_views.py
Knowledge Center REST Endpoints: Documentation, API Explorer, Runbooks, User Guide, Admin Guide.
"""

import logging
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

logger = logging.getLogger(__name__)


class KnowledgeDocumentationView(APIView):
    """
    GET /api/knowledge/documentation/dashboard
    Returns system architecture documentation, REST API references, and developer guides.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            docs = [
                {"doc_id": "DOC-01", "category": "Architecture", "title": "Triple Fusion OS Microservices & Event Bus Architecture", "updated": "2026-07-28"},
                {"doc_id": "DOC-02", "category": "Trading Engine", "title": "MT5 & Interactive Brokers ECN Bridge FIX Spec", "updated": "2026-07-29"},
                {"doc_id": "DOC-03", "category": "AI / ML Platform", "title": "Numba CUDA Neural Net & SHAP Explainability Engine", "updated": "2026-07-30"}
            ]

            return Response({
                "ok": True,
                "docs": docs,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in KnowledgeDocumentationView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class KnowledgeApiExplorerView(APIView):
    """
    GET /api/knowledge/api-explorer/dashboard
    Returns Swagger-style REST endpoint schemas, request builders, and rate limits.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            endpoints = [
                {"method": "GET", "path": "/api/trading/signals", "description": "Fetch live quantitative signals stream", "rate_limit": "1,000 req/min"},
                {"method": "POST", "path": "/api/trading/orders/oms", "description": "Dispatch market/limit order to OMS engine", "rate_limit": "5,000 req/min"},
                {"method": "GET", "path": "/api/trading/positions/dashboard", "description": "Fetch live mark-to-market positions and risk Greeks", "rate_limit": "2,000 req/min"}
            ]

            return Response({
                "ok": True,
                "endpoints": endpoints,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in KnowledgeApiExplorerView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class KnowledgeRunbooksView(APIView):
    """
    GET /api/knowledge/runbooks/dashboard
    Returns SRE operational runbooks (Redis, DB, MT5, Chaos, Disaster Recovery).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            runbooks = [
                {"rb_id": "RB-101", "category": "Database SRE", "title": "PostgreSQL Pool Limit Exhaustion Recovery Procedure", "severity": "CRITICAL"},
                {"rb_id": "RB-102", "category": "Broker Connectivity", "title": "MT5 Gateway Reconnection & Heartbeat Verification", "severity": "HIGH"},
                {"rb_id": "RB-103", "category": "Chaos Recovery", "title": "Self-Healing Circuit Breaker Emergency Reset Protocol", "severity": "HIGH"}
            ]

            return Response({
                "ok": True,
                "runbooks": runbooks,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in KnowledgeRunbooksView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class KnowledgeUserGuideView(APIView):
    """
    GET /api/knowledge/user-guide/dashboard
    Returns interactive product guides for traders, portfolio managers, and analysts.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            guides = [
                {"guide_id": "UG-01", "module": "Trading Terminal", "title": "How to execute Smart Orders and view SOR routing"},
                {"guide_id": "UG-02", "module": "Position PMS", "title": "Managing SL/TP, Partial Closures, and Portfolio Greeks"},
                {"guide_id": "UG-03", "module": "Strategy SMS", "title": "Designing, Backtesting, and Deploying AI Trading Strategies"}
            ]

            return Response({
                "ok": True,
                "guides": guides,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in KnowledgeUserGuideView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class KnowledgeAdminGuideView(APIView):
    """
    GET /api/knowledge/admin-guide/dashboard
    Returns operations manual for SREs, system administrators, and security leads.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            now = datetime.utcnow()

            manuals = [
                {"manual_id": "AG-01", "section": "System Security", "title": "Configuring RBAC Roles, MFA Enforcement, and API Key Scopes"},
                {"manual_id": "AG-02", "section": "SaaS Infrastructure", "title": "Managing Multi-Tenant Organizations, Billing Seats, and Cloud Costs"},
                {"manual_id": "AG-03", "section": "SRE & Chaos", "title": "Disaster Recovery Protocols, Database Backups, and Chaos Drills"}
            ]

            return Response({
                "ok": True,
                "manuals": manuals,
                "timestamp": now.isoformat()
            })

        except Exception as e:
            logger.error("Error in KnowledgeAdminGuideView: %s", str(e), exc_info=True)
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
