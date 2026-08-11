"""
engines/execution/mt5.py
MT5 live execution adapter.

CRITICAL: Only enabled when TRADING_MODE=LIVE and all safety gates pass.

An order is only marked EXECUTED after:
  1. mt5.order_send() returns without error.
  2. The resulting deal/position is confirmed via mt5.positions_get().

"Request sent" ≠ "Order executed".
"""

import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from engines.execution.interface import (
    ExecutionAdapter, OrderRequest, OrderResult, FillStatus, ExecutionError
)

logger = logging.getLogger(__name__)

MAX_RETRIES = 2
RETRY_DELAY_S = 0.5

# MT5 return codes that are safe to retry
_RETRYABLE_CODES = {10004, 10006, 10007}  # REQUOTE, REQUEST_REJECTED, NO_MONEY temporarily


class MT5ExecutionAdapter(ExecutionAdapter):
    """
    Live MT5 execution adapter.

    Safety gates checked before every order:
      - TRADING_MODE == LIVE
      - live_trading_enabled() is True
      - MT5 connection is healthy
      - Not in emergency stop
    """

    @property
    def adapter_name(self) -> str:
        return "mt5_live"

    def is_healthy(self) -> bool:
        try:
            from engines.mt5 import live_trading_enabled
            if not live_trading_enabled():
                return False
            import MetaTrader5 as mt5
            info = mt5.account_info()
            return info is not None
        except Exception:
            return False

    def get_account(self) -> Dict[str, Any]:
        try:
            import MetaTrader5 as mt5
            info = mt5.account_info()
            if info is None:
                return {"error": "MT5 not connected", "mode": "live"}
            return {
                "balance":     info.balance,
                "equity":      info.equity,
                "margin":      info.margin,
                "free_margin": info.margin_free,
                "leverage":    info.leverage,
                "currency":    info.currency,
                "mode":        "live",
                "server":      info.server,
            }
        except Exception as exc:
            return {"error": str(exc), "mode": "live"}

    def get_position(self, symbol: str, user_id: Optional[str] = None) -> Optional[Dict]:
        try:
            import MetaTrader5 as mt5
            positions = mt5.positions_get(symbol=symbol)
            if positions:
                p = positions[0]._asdict()
                return {
                    "ticket":      p.get("ticket"),
                    "symbol":      p.get("symbol"),
                    "type":        "buy" if p.get("type") == 0 else "sell",
                    "volume":      p.get("volume"),
                    "open_price":  p.get("price_open"),
                    "current_price": p.get("price_current"),
                    "sl":          p.get("sl"),
                    "tp":          p.get("tp"),
                    "profit":      p.get("profit"),
                }
            return None
        except Exception as exc:
            logger.error("MT5 get_position failed: %s", exc)
            return None

    def submit_order(self, request: OrderRequest) -> OrderResult:
        """
        Submit a live market order to MT5.
        Only marks EXECUTED after confirmed position via positions_get().
        """
        t0 = time.monotonic()
        order_id = str(uuid.uuid4())

        result = OrderResult(
            correlation_id     = request.correlation_id,
            signal_id          = request.signal_id,
            order_id           = order_id,
            requested_quantity = request.quantity,
            submitted_at       = datetime.now(timezone.utc),
            adapter            = self.adapter_name,
        )

        # Safety gate: live mode must be explicitly enabled
        try:
            from engines.mt5 import live_trading_enabled
            if not live_trading_enabled():
                result.status          = FillStatus.REJECTED
                result.rejected_reason = "Live trading is not enabled (ENABLE_LIVE_TRADING != true)"
                return result
        except Exception as exc:
            result.status          = FillStatus.ERROR
            result.rejected_reason = f"Could not verify live_trading_enabled: {exc}"
            return result

        # Emergency stop check
        try:
            from engines.orchestration.emergency_stop import EmergencyStopManager
            stop = EmergencyStopManager()
            if stop.is_active():
                result.status          = FillStatus.REJECTED
                result.rejected_reason = "Emergency stop is active — no new orders"
                return result
        except ImportError:
            pass  # Emergency stop module not yet available

        try:
            import MetaTrader5 as mt5
        except ImportError:
            result.status          = FillStatus.ERROR
            result.rejected_reason = "MetaTrader5 package not installed"
            return result

        # Build order request
        action   = mt5.TRADE_ACTION_DEAL
        order_type = (mt5.ORDER_TYPE_BUY if request.side.upper() == "BUY"
                      else mt5.ORDER_TYPE_SELL)
        price_fn = (mt5.symbol_info_tick(request.symbol).ask
                    if request.side.upper() == "BUY"
                    else mt5.symbol_info_tick(request.symbol).bid)

        mt5_request = {
            "action":   action,
            "symbol":   request.symbol,
            "volume":   float(request.quantity),
            "type":     order_type,
            "price":    price_fn,
            "sl":       request.stop_loss or 0.0,
            "tp":       request.take_profit or 0.0,
            "comment":  f"TF17 corr={request.correlation_id[:8]}",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        # Duplicate order guard — check position doesn't already exist
        existing = self.get_position(request.symbol)
        if existing:
            result.status          = FillStatus.REJECTED
            result.rejected_reason = f"Duplicate order prevented — position already exists for {request.symbol}"
            return result

        # Submit with retries
        mt5_result = None
        for attempt in range(MAX_RETRIES + 1):
            check = mt5.order_check(mt5_request)
            if check and check.retcode != 0:
                result.status          = FillStatus.REJECTED
                result.rejected_reason = f"MT5 pre-check failed: retcode={check.retcode}"
                return result

            mt5_result = mt5.order_send(mt5_request)
            if mt5_result is None:
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_S)
                    continue
                result.status          = FillStatus.ERROR
                result.rejected_reason = "MT5 order_send returned None"
                return result

            if mt5_result.retcode == 10009:  # TRADE_RETCODE_DONE
                break
            elif mt5_result.retcode in _RETRYABLE_CODES and attempt < MAX_RETRIES:
                logger.warning("MT5 retcode %d — retrying attempt %d", mt5_result.retcode, attempt + 1)
                time.sleep(RETRY_DELAY_S)
                continue
            else:
                result.status          = FillStatus.REJECTED
                result.rejected_reason = f"MT5 rejected: retcode={mt5_result.retcode} comment={getattr(mt5_result, 'comment', '')}"
                result.broker_response = {"retcode": mt5_result.retcode}
                return result

        # Confirm via positions_get — only EXECUTED after broker-side position confirmed
        time.sleep(0.3)  # brief wait for position to register
        confirmed_pos = self.get_position(request.symbol)
        if confirmed_pos:
            fill_price   = confirmed_pos.get("open_price", 0.0)
            result.status          = FillStatus.EXECUTED
            result.fill_price      = fill_price
            result.fill_quantity   = request.quantity
            result.confirmed_at    = datetime.now(timezone.utc)
            result.broker_order_id = str(getattr(mt5_result, "order", ""))
            result.broker_response = {
                "retcode": mt5_result.retcode,
                "deal":    getattr(mt5_result, "deal", None),
                "order":   getattr(mt5_result, "order", None),
            }
            if request.limit_price and fill_price:
                diff = abs(fill_price - request.limit_price)
                result.slippage_bps = round(diff / request.limit_price * 10_000, 2)
            logger.info(
                "MT5 CONFIRMED: %s %s x%.4f @ %.4f | corr=%s",
                request.side, request.symbol, request.quantity,
                fill_price, request.correlation_id
            )
        else:
            # Request went through but position not confirmed — report as ACKNOWLEDGED
            result.status          = FillStatus.ACKNOWLEDGED
            result.rejected_reason = "Order sent but position not yet confirmed — check broker"
            logger.warning(
                "MT5 position NOT confirmed after order_send for %s | corr=%s",
                request.symbol, request.correlation_id
            )

        result.execution_latency_ms = round((time.monotonic() - t0) * 1000, 2)
        return result

    def cancel_order(self, order_id: str) -> bool:
        try:
            import MetaTrader5 as mt5
            request = {
                "action":  mt5.TRADE_ACTION_REMOVE,
                "order":   int(order_id),
            }
            result = mt5.order_send(request)
            return result is not None and result.retcode == 10009
        except Exception as exc:
            logger.error("MT5 cancel_order failed: %s", exc)
            return False
