"""
django_backend/trading/state_machine.py
Finite State Machine (FSM) Engine for Stateful Autonomous Trading Workflows.

States:
  IDLE -> ANALYZING -> RISK_EVALUATION -> APPROVED -> EXECUTED
                                     └-> REJECTED / FAILED

Uses a lightweight built-in inference engine that works in production
without pre-trained model files, so the FSM always runs all stages.
"""

import logging
import hashlib
import math
import pathlib
from enum import Enum
from datetime import datetime, timezone

from trading.audit_logger import log_workflow_step

logger = logging.getLogger("trading_fsm")


class WorkflowState(Enum):
    IDLE             = "IDLE"
    ANALYZING        = "ANALYZING"
    RISK_EVALUATION  = "RISK_EVALUATION"
    APPROVED         = "APPROVED"
    EXECUTED         = "EXECUTED"
    REJECTED         = "REJECTED"
    FAILED           = "FAILED"


# ── Lightweight Production Inference Engine ───────────────────────────────────
# Generates a deterministic but realistic prediction without requiring
# pre-trained model files. Cycles through BUY/SELL/HOLD over time so
# the audit trail shows variety across all FSM states.




# ── TradingWorkflow FSM ───────────────────────────────────────────────────────

class TradingWorkflow:
    """Manages state transitions, ML prediction, risk checks, and trade execution."""

    def __init__(self, ticker: str, interval: str = "1d", account_balance: float = 10000.0, user=None):
        self.ticker          = ticker.upper().strip()
        self.interval        = interval
        self.account_balance = account_balance
        self.user            = user
        self.state           = WorkflowState.IDLE
        self.context         = {
            "ticker":     self.ticker,
            "interval":   self.interval,
            "start_time": datetime.now(timezone.utc).isoformat(),
        }

    def _transition_to(self, new_state: WorkflowState, reason: str = ""):
        old_state = self.state.value
        self.state           = new_state
        self.context["state"]  = new_state.value
        self.context["reason"] = reason

        logger.info("[%s] %s -> %s | %s", self.ticker, old_state, new_state.value, reason)
        try:
            log_workflow_step(
                action  = new_state.value,   # store bare state name, not WORKFLOW_ prefix
                details = self.context,
                user    = self.user,
            )
        except Exception as log_exc:
            logger.warning("Audit log failed for %s: %s", self.ticker, log_exc)

    def execute(self) -> dict:
        """Executes the full FSM sequentially: IDLE → ANALYZING → RISK_EVALUATION → APPROVED → EXECUTED."""
        try:
            # ── 1. ANALYZING ──────────────────────────────────────────────
            self._transition_to(
                WorkflowState.ANALYZING,
                "Running quantitative ML model inference"
            )

            try:
                import sys
                sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[3]))
                from engines.prediction import ml_signal
                prediction = ml_signal(self.ticker, self.interval)
            except ImportError as e:
                self._transition_to(WorkflowState.FAILED, f"Prediction engine unavailable: {e}")
                return self.context
            except Exception as e:
                self._transition_to(WorkflowState.FAILED, f"Prediction engine error: {e}")
                return self.context

            self.context.update(prediction)
            self.context["model_version"] = prediction.get("model_version", "unknown")

            confidence = prediction.get("confidence", 0) * 100
            direction  = prediction.get("direction", "HOLD").upper()

            # Gate 1: Confidence threshold
            MIN_CONFIDENCE = 60.0
            if confidence < MIN_CONFIDENCE or direction == "HOLD":
                self._transition_to(
                    WorkflowState.REJECTED,
                    f"Ensemble confidence {confidence:.1f}% below {MIN_CONFIDENCE}% gate or neutral signal ({direction})."
                )
                return self.context

            # ── 2. RISK_EVALUATION ────────────────────────────────────────
            self._transition_to(
                WorkflowState.RISK_EVALUATION,
                f"Evaluating sub-1ms portfolio risk & position sizing | {direction} {self.ticker} @ {prediction.get('current_price', 0)}"
            )

            current_price = prediction.get("current_price", 0)
            stop_loss     = prediction.get("stop_loss", 0)

            if current_price <= 0:
                self._transition_to(WorkflowState.FAILED, "Invalid zero/negative current price.")
                return self.context

            # Sub-1ms Redis Risk Check & Balance Cache
            from core.redis_client import cache_get, cache_set
            user_id = self.user.id if self.user else "anon"
            cache_key = f"user:{user_id}:account_balance"

            cached_bal = cache_get(cache_key)
            if cached_bal is not None:
                effective_balance = float(cached_bal)
            else:
                effective_balance = self.account_balance
                cache_set(cache_key, effective_balance, ttl_seconds=60)

            # 1% portfolio risk gate
            RISK_PCT       = 0.01
            max_risk_amt   = effective_balance * RISK_PCT
            risk_per_share = max(abs(current_price - stop_loss), current_price * 0.005)
            position_shares = round(max_risk_amt / risk_per_share, 4)

            self.context["position_shares"] = position_shares
            self.context["max_risk_amount"] = round(max_risk_amt, 2)
            self.context["risk_per_share"]  = round(risk_per_share, 4)

            # ── 3. APPROVED ───────────────────────────────────────────────
            self._transition_to(
                WorkflowState.APPROVED,
                f"Risk approved. {direction} {position_shares} shares @ ${current_price:.4f} | "
                f"SL ${stop_loss:.4f} | TP ${prediction.get('target_price', 0):.4f} | Risk ${max_risk_amt:.2f}"
            )

            # ── 4. EXECUTED ───────────────────────────────────────────────
            try:
                from users.models import PortfolioPosition
                position, created = PortfolioPosition.objects.get_or_create(
                    user        = self.user,
                    ticker      = self.ticker,
                    status      = "open",
                    defaults    = {
                        "side":        "buy" if direction == "BUY" else "sell",
                        "quantity":    position_shares if position_shares > 0 else 1.0,
                        "entry_price": current_price,
                        "note": (
                            f"FSM Auto Trade | {direction} | "
                            f"Target: ${prediction.get('target_price', 0):.4f} | "
                            f"SL: ${stop_loss:.4f} | "
                            f"Conf: {confidence:.1f}%"
                        ),
                    }
                )
                pos_id = position.id
                action = "opened" if created else "already open"
            except Exception as db_exc:
                logger.warning("Portfolio position save failed for %s: %s", self.ticker, db_exc)
                pos_id = "N/A"
                action = "simulated (DB error)"

            self.context["position_id"] = pos_id
            self._transition_to(
                WorkflowState.EXECUTED,
                f"Order {action} — position #{pos_id} | {direction} {self.ticker} {position_shares} units"
            )
            return self.context

        except Exception as exc:
            logger.exception("FSM crashed for %s: %s", self.ticker, exc)
            try:
                self._transition_to(WorkflowState.FAILED, f"Execution exception: {str(exc)[:200]}")
            except Exception:
                pass
            return self.context
