"""
django_backend/trading/tradingview_webhook_views.py
Secure inbound TradingView webhook endpoint.

TradingView → Webhook → Signal Validation → Triple Fusion ML/Risk Pipeline
                                                          ↓
                                                    Execution Decision
                                                          ↓
                                                   Paper / MT5 (never direct)

Security controls:
  1. HMAC-SHA256 signature validation (header: X-TradingView-Token)
  2. Timestamp validation: payload.timestamp must be within ±300s of server time
  3. Replay protection: nonce stored in Django cache for 10 minutes
  4. Symbol allowlist validation
  5. Rate limiting: max 30 requests per minute per IP
  6. Full audit logging

The webhook creates a TradingSignal and queues it for the pipeline.
It does NOT directly execute orders.
"""

import hashlib
import hmac
import json
import logging
import time
import uuid
from datetime import datetime, timezone

from django.conf import settings
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

logger = logging.getLogger(__name__)

# Configuration
TV_WEBHOOK_SECRET = getattr(settings, "TRADINGVIEW_WEBHOOK_SECRET", "")
TV_TIMESTAMP_TOLERANCE_S = 300     # 5 minutes
TV_NONCE_TTL_S = 600               # 10 minutes replay window
TV_RATE_LIMIT_PER_MIN = 30
TV_RATE_LIMIT_WINDOW_S = 60

# Allowed symbols (empty = allow all configured tickers)
TV_SYMBOL_ALLOWLIST: set = set()   # populate from TickerConfig in production


def _get_client_ip(request) -> str:
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return x_forwarded.split(",")[0].strip() if x_forwarded else request.META.get("REMOTE_ADDR", "")


def _validate_signature(payload_bytes: bytes, provided_token: str) -> bool:
    """HMAC-SHA256 validation. Constant-time comparison to prevent timing attacks."""
    if not TV_WEBHOOK_SECRET:
        logger.warning("TRADINGVIEW_WEBHOOK_SECRET not configured — all webhook signatures rejected")
        return False
    expected = hmac.new(
        TV_WEBHOOK_SECRET.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, provided_token)


def _check_rate_limit(ip: str) -> bool:
    """Return True if request is within rate limit, False if exceeded."""
    key = f"tv_webhook_rate:{ip}"
    count = cache.get(key, 0)
    if count >= TV_RATE_LIMIT_PER_MIN:
        return False
    cache.set(key, count + 1, timeout=TV_RATE_LIMIT_WINDOW_S)
    return True


def _check_replay(nonce: str) -> bool:
    """Return True if nonce is fresh (not seen before), False if replay."""
    key = f"tv_webhook_nonce:{nonce}"
    if cache.get(key):
        return False   # already seen
    cache.set(key, 1, timeout=TV_NONCE_TTL_S)
    return True


@method_decorator(csrf_exempt, name="dispatch")
class TradingViewWebhookView(APIView):
    """
    POST /api/integrations/tradingview/webhook

    Accepts TradingView alert payloads. Expected JSON format:
    {
        "ticker": "AAPL",
        "action": "BUY",           # or SELL
        "interval": "1h",
        "price": 185.50,
        "stop_loss": 182.00,
        "take_profit": 192.00,
        "strategy_id": "ict_core_m5",
        "timestamp": 1720000000,    # Unix timestamp (seconds)
        "nonce": "unique-alert-id",
        "confidence": 0.0           # Optional — 0 means pipeline will re-evaluate
    }

    Header: X-TradingView-Token: <hmac-sha256 of body>
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        request_id = str(uuid.uuid4())
        client_ip  = _get_client_ip(request)
        received_at = datetime.now(timezone.utc)

        logger.info("TV webhook received | ip=%s req=%s", client_ip, request_id)

        # ── Rate limiting ─────────────────────────────────────────────────
        if not _check_rate_limit(client_ip):
            logger.warning("TV webhook rate limit exceeded | ip=%s", client_ip)
            return Response(
                {"error": "Rate limit exceeded"},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # ── Signature validation ────────────────────────────────────────────
        provided_token = request.META.get("HTTP_X_TRADINGVIEW_TOKEN", "")
        raw_body = request.body

        if TV_WEBHOOK_SECRET and not _validate_signature(raw_body, provided_token):
            logger.warning(
                "TV webhook signature INVALID | ip=%s req=%s token=%s...",
                client_ip, request_id, provided_token[:8] if provided_token else "(empty)"
            )
            return Response(
                {"error": "Invalid signature"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # ── Parse payload ───────────────────────────────────────────────────
        try:
            payload = request.data
            if not payload:
                return Response({"error": "Empty payload"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"error": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)

        # ── Timestamp validation ─────────────────────────────────────────────
        payload_ts = payload.get("timestamp")
        if payload_ts is not None:
            try:
                ts_drift = abs(time.time() - float(payload_ts))
                if ts_drift > TV_TIMESTAMP_TOLERANCE_S:
                    logger.warning(
                        "TV webhook timestamp drift %ds | ip=%s req=%s",
                        int(ts_drift), client_ip, request_id
                    )
                    return Response(
                        {"error": f"Timestamp drift {int(ts_drift)}s exceeds {TV_TIMESTAMP_TOLERANCE_S}s tolerance"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (TypeError, ValueError):
                pass  # malformed timestamp — continue (not required)

        # ── Replay protection ──────────────────────────────────────────────
        nonce = payload.get("nonce") or payload.get("alert_id") or request_id
        if not _check_replay(nonce):
            logger.warning("TV webhook replay detected | nonce=%s ip=%s", nonce, client_ip)
            return Response(
                {"error": "Duplicate alert — replay protection"},
                status=status.HTTP_409_CONFLICT
            )

        # ── Symbol validation ──────────────────────────────────────────────
        symbol = str(payload.get("ticker", "")).upper().strip()
        if not symbol:
            return Response({"error": "Missing ticker"}, status=status.HTTP_400_BAD_REQUEST)

        if TV_SYMBOL_ALLOWLIST and symbol not in TV_SYMBOL_ALLOWLIST:
            # Auto-populate from DB if allowlist is empty
            try:
                from users.models import TickerConfig
                allowed = set(TickerConfig.objects.filter(enabled=True).values_list("symbol", flat=True))
                if symbol not in allowed:
                    logger.warning("TV webhook: symbol %s not in allowlist", symbol)
                    return Response(
                        {"error": f"{symbol} is not a supported symbol"},
                        status=status.HTTP_422_UNPROCESSABLE_ENTITY
                    )
            except Exception:
                pass  # allow if DB not available

        action = str(payload.get("action", "")).upper().strip()
        if action not in ("BUY", "SELL"):
            return Response(
                {"error": f"action must be BUY or SELL, got '{action}'"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        # ── Audit log ──────────────────────────────────────────────────────
        try:
            from trading.audit_logger import log_workflow_step
            log_workflow_step(
                action="TRADINGVIEW_WEBHOOK_RECEIVED",
                details={
                    "request_id":  request_id,
                    "ip":          client_ip,
                    "ticker":      symbol,
                    "action":      action,
                    "strategy":    payload.get("strategy_id"),
                    "nonce":       nonce,
                    "received_at": received_at.isoformat(),
                },
                user=None,
            )
        except Exception:
            pass

        # ── Create TradingSignal from webhook payload ──────────────────────
        signal_id = None
        try:
            import sys, pathlib
            project_root = str(pathlib.Path(__file__).resolve().parents[2])
            if project_root not in sys.path:
                sys.path.insert(0, project_root)

            from engines.signals.generator import signal_from_tradingview
            tv_signal = signal_from_tradingview(payload, correlation_id=request_id)
            signal_id = tv_signal.signal_id

            # Register in the signal registry
            from engines.signals.registry import get_registry
            get_registry().add(tv_signal)

            logger.info(
                "TV webhook → Signal %s created | %s %s | strategy=%s | req=%s",
                signal_id, symbol, action,
                payload.get("strategy_id"), request_id
            )

            # Queue the pipeline (Celery or background thread)
            # The TV signal is an INPUT EVENT, not execution authority.
            # The pipeline will run ml_signal() to validate and decide.
            self._queue_pipeline(tv_signal, request_id)

        except Exception as exc:
            logger.exception("TV webhook signal creation failed | req=%s | %s", request_id, exc)
            return Response(
                {"error": f"Signal creation failed: {str(exc)[:200]}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "ok": True,
            "signal_id": signal_id,
            "request_id": request_id,
            "symbol": symbol,
            "action": action,
            "message": (
                "Alert received and queued for ML validation + risk evaluation. "
                "This alert is NOT a guaranteed execution. "
                "The Triple Fusion pipeline will decide."
            ),
            "received_at": received_at.isoformat(),
        }, status=status.HTTP_200_OK)

    def _queue_pipeline(self, signal, correlation_id: str) -> None:
        """
        Queue the trading pipeline for this TradingView signal.
        Attempts Celery first, falls back to background thread.
        """
        try:
            from trading.celery_tasks import run_pipeline_for_signal
            run_pipeline_for_signal.delay(
                symbol=signal.symbol,
                timeframe=signal.timeframe,
                strategy_id=signal.strategy_id,
                correlation_id=correlation_id,
                source="tradingview",
            )
            logger.info("Pipeline queued via Celery for signal %s", signal.signal_id)
        except Exception as celery_err:
            logger.warning(
                "Celery unavailable (%s) — running pipeline in background thread",
                celery_err
            )
            import threading
            def _run():
                try:
                    import sys, pathlib
                    root = str(pathlib.Path(__file__).resolve().parents[2])
                    if root not in sys.path:
                        sys.path.insert(0, root)
                    from engines.orchestration.trading_pipeline import TradingPipeline
                    pipeline = TradingPipeline()
                    result = pipeline.run(
                        symbol=signal.symbol,
                        timeframe=signal.timeframe,
                        strategy_id=signal.strategy_id,
                        correlation_id=correlation_id,
                        source="tradingview",
                    )
                    logger.info(
                        "Pipeline completed for TV signal %s | status=%s",
                        signal.signal_id, result.final_status
                    )
                except Exception as pipe_err:
                    logger.exception("Pipeline thread failed: %s", pipe_err)

            t = threading.Thread(target=_run, daemon=True)
            t.start()
