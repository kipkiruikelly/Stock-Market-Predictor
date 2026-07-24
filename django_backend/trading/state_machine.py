"""
django_backend/trading/state_machine.py
Finite State Machine (FSM) Engine for Stateful Autonomous Trading Workflows.

States:
  IDLE -> ANALYZING -> RISK_EVALUATION -> APPROVED -> EXECUTED
                                     └-> REJECTED / FAILED
"""

import os
import sys
import logging
from enum import Enum
from pathlib import Path
from datetime import datetime, timezone

from trading.audit_logger import log_workflow_step

logger = logging.getLogger("trading_fsm")

_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)


class WorkflowState(Enum):
    IDLE = "IDLE"
    ANALYZING = "ANALYZING"
    RISK_EVALUATION = "RISK_EVALUATION"
    APPROVED = "APPROVED"
    EXECUTED = "EXECUTED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


class TradingWorkflow:
    """Manages state transitions, ML prediction execution, risk checks, and trade execution."""

    def __init__(self, ticker: str, interval: str = "1d", account_balance: float = 10000.0, user=None):
        self.ticker = ticker.upper().strip()
        self.interval = interval
        self.account_balance = account_balance
        self.user = user
        self.state = WorkflowState.IDLE
        self.context = {
            "ticker": self.ticker,
            "interval": self.interval,
            "start_time": datetime.now(timezone.utc).isoformat(),
        }

    def _transition_to(self, new_state: WorkflowState, reason: str = ""):
        old_state_str = self.state.value
        self.state = new_state
        self.context["state"] = new_state.value
        self.context["reason"] = reason

        logger.info("[%s] State: %s -> %s | %s", self.ticker, old_state_str, new_state.value, reason)
        log_workflow_step(
            action=f"WORKFLOW_{new_state.value}",
            details=self.context,
            user=self.user
        )

    def execute(self) -> dict:
        """Executes the full state machine workflow sequentially."""
        try:
            # 1. State: ANALYZING
            self._transition_to(WorkflowState.ANALYZING, "Running quantitative ML model inference")
            import predictor
            prediction = predictor.run_prediction(self.ticker, self.interval)
            
            self.context["prediction"] = prediction
            confidence = prediction.get("confidence", 0.0)
            direction = prediction.get("direction", "HOLD")
            self.context["confidence"] = confidence
            self.context["direction"] = direction

            # Gate Check 1: Confidence threshold (e.g. >= 60%)
            MIN_CONFIDENCE = 60.0
            if confidence < MIN_CONFIDENCE or direction == "HOLD":
                self._transition_to(
                    WorkflowState.REJECTED,
                    f"Confidence ({confidence:.1f}%) below threshold ({MIN_CONFIDENCE}%) or neutral signal."
                )
                return self.context

            # 2. State: RISK_EVALUATION
            self._transition_to(WorkflowState.RISK_EVALUATION, "Evaluating portfolio risk & position sizing")
            current_price = prediction.get("current_price", 0.0)
            
            if current_price <= 0:
                self._transition_to(WorkflowState.FAILED, "Invalid zero/negative current price.")
                return self.context

            # Gate Check 2: Position sizing & risk limit (1% risk per trade)
            RISK_PCT = 0.01
            max_risk_amount = self.account_balance * RISK_PCT
            stop_loss = prediction.get("stop_loss", current_price * 0.98)
            risk_per_share = max(abs(current_price - stop_loss), current_price * 0.01)
            position_shares = round(max_risk_amount / risk_per_share, 2)

            self.context["position_shares"] = position_shares
            self.context["max_risk_amount"] = max_risk_amount

            # 3. State: APPROVED
            self._transition_to(WorkflowState.APPROVED, f"Approved for execution. Size: {position_shares} shares.")

            # 4. State: EXECUTED (Simulated paper engine placement)
            from users.models import PortfolioPosition
            
            position, created = PortfolioPosition.objects.get_or_create(
                user=self.user,
                ticker=self.ticker,
                status="open",
                defaults={
                    "side": "buy" if direction == "BUY" else "sell",
                    "quantity": position_shares if position_shares > 0 else 1.0,
                    "entry_price": current_price,
                    "note": f"FSM Auto Trade | Target: ${prediction.get('target_price', current_price*1.04):.2f} | SL: ${stop_loss:.2f}",
                }
            )

            self.context["position_id"] = position.id
            self._transition_to(WorkflowState.EXECUTED, f"Order placed into portfolio position #{position.id}.")
            return self.context

        except Exception as exc:
            logger.exception("Workflow execution crashed for %s: %s", self.ticker, exc)
            self._transition_to(WorkflowState.FAILED, f"Execution exception: {str(exc)}")
            return self.context
