"""
engines/execution/paper.py
Paper trading execution adapter.

Wraps engines.paper_trading to provide the ExecutionAdapter interface.
All orders are simulated — no real broker is involved.
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


class PaperExecutionAdapter(ExecutionAdapter):
    """
    Simulated execution adapter using the paper trading engine.
    This is the DEFAULT adapter (TRADING_MODE=PAPER).
    """

    @property
    def adapter_name(self) -> str:
        return "paper"

    def is_healthy(self) -> bool:
        try:
            from engines.paper_trading import engine_enabled
            return True  # Paper engine is always available
        except Exception:
            return False

    def get_account(self) -> Dict[str, Any]:
        try:
            from engines.paper_trading import load_config
            cfg = load_config()
            return {
                "balance":      cfg.get("starting_balance", 1_000_000.0),
                "equity":       cfg.get("starting_balance", 1_000_000.0),
                "margin":       0.0,
                "free_margin":  cfg.get("starting_balance", 1_000_000.0),
                "mode":         "paper",
                "currency":     cfg.get("currency", "USD"),
            }
        except Exception as exc:
            logger.error("Paper account info failed: %s", exc)
            return {"mode": "paper", "error": str(exc)}

    def get_position(self, symbol: str, user_id: Optional[str] = None) -> Optional[Dict]:
        try:
            from engines.paper_trading import open_positions
            positions = open_positions(user_id=user_id or "platform")
            sym_upper = symbol.upper()
            for pos in positions:
                if pos.get("ticker", "").upper() == sym_upper:
                    return pos
            return None
        except Exception as exc:
            logger.error("Paper get_position failed for %s: %s", symbol, exc)
            return None

    def submit_order(self, request: OrderRequest) -> OrderResult:
        """
        Submit a paper order through the paper trading engine.
        Status is EXECUTED only after try_open() confirms the fill.
        """
        t0 = time.monotonic()
        order_id = str(uuid.uuid4())

        result = OrderResult(
            correlation_id    = request.correlation_id,
            signal_id         = request.signal_id,
            order_id          = order_id,
            requested_quantity = request.quantity,
            submitted_at      = datetime.now(timezone.utc),
            adapter           = self.adapter_name,
        )

        try:
            from engines.paper_trading import try_open, load_config
            cfg = load_config()

            fill = try_open(
                user_id  = request.user_id or "platform",
                ticker   = request.symbol,
                side     = request.side.lower(),
                qty      = request.quantity,
                price    = request.limit_price or 0.0,  # 0 = market order
                strategy = request.strategy_id or "pipeline",
                cfg      = cfg,
            )

            if fill is not None:
                fill_price = fill.get("fill_price") or fill.get("entry_price") or 0.0
                result.status       = FillStatus.EXECUTED
                result.fill_price   = fill_price
                result.fill_quantity = request.quantity
                result.confirmed_at  = datetime.now(timezone.utc)

                # Compute slippage if we had a limit price
                if request.limit_price and fill_price and request.limit_price > 0:
                    diff = abs(fill_price - request.limit_price)
                    result.slippage_bps = round(diff / request.limit_price * 10_000, 2)

                result.broker_response = fill
                logger.info(
                    "Paper fill CONFIRMED: %s %s x%.4f @ %.4f | corr=%s",
                    request.side, request.symbol, request.quantity,
                    fill_price, request.correlation_id
                )
            else:
                # try_open returned None — engine rejected (market closed, circuit breaker, etc.)
                result.status          = FillStatus.REJECTED
                result.rejected_reason = "Paper engine rejected the order (circuit breaker or market closed)"
                logger.warning(
                    "Paper order REJECTED: %s %s | corr=%s",
                    request.side, request.symbol, request.correlation_id
                )

        except Exception as exc:
            result.status          = FillStatus.ERROR
            result.rejected_reason = str(exc)
            logger.exception(
                "Paper execution ERROR: %s %s | %s",
                request.side, request.symbol, exc
            )

        result.execution_latency_ms = round((time.monotonic() - t0) * 1000, 2)
        return result

    def cancel_order(self, order_id: str) -> bool:
        # Paper orders execute synchronously — nothing to cancel
        logger.info("Paper cancel_order called for %s (paper orders are synchronous)", order_id)
        return False
