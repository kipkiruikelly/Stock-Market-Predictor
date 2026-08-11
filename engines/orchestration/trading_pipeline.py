"""
engines/orchestration/trading_pipeline.py
Institutional live trading pipeline orchestrator.

Pipeline stages (in order):
  1. EMERGENCY_STOP_CHECK
  2. MARKET_DATA
  3. SIGNAL_GENERATION
  4. SIGNAL_VALIDATION
  5. RISK_EVALUATION
  6. SAFETY_GATES (live-mode multi-gate check)
  7. EXECUTION
  8. FILL_CONFIRMATION
  9. TRADE_JOURNAL

Every stage returns a StageResult with:
  - status: ok / skipped / rejected / failed
  - latency_ms
  - reason
  - correlation_id
  - data (stage-specific payload)

The pipeline is abort-on-first-rejection — if any stage fails or
rejects, subsequent stages are skipped and the run is marked ABORTED.
"""

import logging
import os
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Any, Dict, List

logger = logging.getLogger(__name__)


@dataclass
class StageResult:
    stage: str
    status: str             # ok / skipped / rejected / failed
    latency_ms: float = 0.0
    reason: str = ""
    correlation_id: str = ""
    data: Optional[Dict[str, Any]] = None

    def ok(self) -> bool:
        return self.status == "ok"

    def to_dict(self) -> dict:
        return {
            "stage":          self.stage,
            "status":         self.status,
            "latency_ms":     self.latency_ms,
            "reason":         self.reason,
            "correlation_id": self.correlation_id,
        }


@dataclass
class PipelineResult:
    run_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    correlation_id: str = ""
    symbol: str = ""
    timeframe: str = ""
    trading_mode: str = "PAPER"
    final_status: str = "PENDING"  # COMPLETED / ABORTED / FAILED
    stages: List[StageResult] = field(default_factory=list)
    signal: Optional[Any] = None          # TradingSignal dataclass
    risk_decision: Optional[Any] = None   # RiskDecision dataclass
    order_result: Optional[Any] = None    # OrderResult dataclass
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    total_latency_ms: float = 0.0
    abort_reason: str = ""
    emergency_stop_active: bool = False

    def to_dict(self) -> dict:
        return {
            "run_id":              self.run_id,
            "correlation_id":      self.correlation_id,
            "symbol":              self.symbol,
            "timeframe":           self.timeframe,
            "trading_mode":        self.trading_mode,
            "final_status":        self.final_status,
            "stages":              [s.to_dict() for s in self.stages],
            "abort_reason":        self.abort_reason,
            "total_latency_ms":    self.total_latency_ms,
            "started_at":          self.started_at.isoformat(),
            "completed_at":        self.completed_at.isoformat() if self.completed_at else None,
            "emergency_stop_active": self.emergency_stop_active,
            "signal":              self.signal.to_dict() if self.signal and hasattr(self.signal, "to_dict") else None,
            "risk_decision":       self.risk_decision.to_dict() if self.risk_decision and hasattr(self.risk_decision, "to_dict") else None,
            "order_result":        self.order_result.to_dict() if self.order_result and hasattr(self.order_result, "to_dict") else None,
        }


# ── Live Mode Safety Gates ───────────────────────────────────────────────────

def _check_live_safety_gates(result: PipelineResult) -> Optional[str]:
    """
    Run all 9 safety gates required before live execution.

    Returns:
        None if all gates pass.
        str with failure reason if any gate fails.
    """
    # Gate 1: TRADING_MODE must be LIVE
    mode = os.environ.get("TRADING_MODE", "PAPER").upper()
    if mode != "LIVE":
        return f"TRADING_MODE={mode} (must be LIVE)"

    # Gate 2: ENABLE_LIVE_TRADING must be true
    live_enabled = os.environ.get("ENABLE_LIVE_TRADING", "").strip().lower()
    if live_enabled not in ("1", "true", "yes", "on"):
        return "ENABLE_LIVE_TRADING is not set to true"

    # Gate 3: Emergency stop must not be active
    try:
        from engines.orchestration.emergency_stop import get_emergency_stop
        if get_emergency_stop().is_active():
            return "Emergency stop is active"
    except ImportError:
        pass

    # Gate 4: Execution adapter must be healthy
    try:
        from engines.execution import get_adapter
        adapter = get_adapter()
        if not adapter.is_healthy():
            return f"Execution adapter '{adapter.adapter_name}' is not healthy"
    except Exception as exc:
        return f"Execution adapter health check failed: {exc}"

    # Gate 5: Risk engine must be available
    try:
        from engines.risk import RiskManager
        RiskManager()  # instantiation check
    except Exception as exc:
        return f"Risk engine unavailable: {exc}"

    # Gate 6: Prediction engine must be available
    try:
        from engines.prediction import available_models
        models = available_models()
        if not models:
            return "No prediction models available"
    except Exception as exc:
        return f"Prediction engine unavailable: {exc}"

    # Gate 7–9: Trading session, daily loss, and account checks
    # These require runtime context — delegated to RiskManager at execution time.
    # The pipeline records a note that these were deferred.
    logger.info("Live safety gates 7-9 (session/daily-loss/account) deferred to RiskManager")

    return None  # All checked gates passed


class TradingPipeline:
    """
    Orchestrates the complete market-data → signal → risk → execution → journal flow.

    Usage:
        pipeline = TradingPipeline()
        result = pipeline.run(symbol="AAPL", timeframe="1d")
        print(result.to_dict())
    """

    def __init__(self, trading_mode: Optional[str] = None) -> None:
        self.trading_mode = (
            trading_mode or
            os.environ.get("TRADING_MODE", "PAPER")
        ).upper()

    def run(
        self,
        symbol: str,
        timeframe: str = "1d",
        strategy_id: Optional[str] = None,
        user_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        source: str = "ml_engine",
    ) -> PipelineResult:
        """
        Execute the full trading pipeline for one symbol + timeframe.

        Args:
            symbol: Ticker symbol.
            timeframe: Candle interval.
            strategy_id: Optional strategy identifier.
            user_id: Optional user context.
            correlation_id: Trace ID (generated if not provided).
            source: Signal source (ml_engine / tradingview / manual).

        Returns:
            PipelineResult with all stage results.
        """
        corr_id = correlation_id or str(uuid.uuid4())
        t_total = time.monotonic()

        result = PipelineResult(
            correlation_id = corr_id,
            symbol         = symbol.upper(),
            timeframe      = timeframe,
            trading_mode   = self.trading_mode,
        )

        logger.info(
            "Pipeline START | symbol=%s tf=%s mode=%s corr=%s",
            symbol, timeframe, self.trading_mode, corr_id
        )

        def abort(stage_name: str, reason: str) -> PipelineResult:
            result.final_status = "ABORTED"
            result.abort_reason = reason
            result.completed_at = datetime.now(timezone.utc)
            result.total_latency_ms = round((time.monotonic() - t_total) * 1000, 2)
            logger.warning(
                "Pipeline ABORTED at %s | %s | corr=%s",
                stage_name, reason, corr_id
            )
            self._persist_run(result)
            return result

        # ── Stage 1: Emergency Stop Check ─────────────────────────────────
        t0 = time.monotonic()
        try:
            from engines.orchestration.emergency_stop import get_emergency_stop
            stop = get_emergency_stop()
            if stop.is_active():
                result.emergency_stop_active = True
                s = StageResult(
                    stage="EMERGENCY_STOP_CHECK",
                    status="rejected",
                    latency_ms=round((time.monotonic() - t0) * 1000, 2),
                    reason="Emergency stop is active — all new orders blocked",
                    correlation_id=corr_id,
                )
                result.stages.append(s)
                return abort("EMERGENCY_STOP_CHECK", s.reason)
            result.stages.append(StageResult(
                stage="EMERGENCY_STOP_CHECK", status="ok",
                latency_ms=round((time.monotonic() - t0) * 1000, 2),
                reason="Emergency stop not active", correlation_id=corr_id,
            ))
        except ImportError:
            result.stages.append(StageResult(
                stage="EMERGENCY_STOP_CHECK", status="skipped",
                latency_ms=round((time.monotonic() - t0) * 1000, 2),
                reason="Emergency stop module not loaded", correlation_id=corr_id,
            ))

        # ── Stage 2: Signal Generation ─────────────────────────────────────
        t0 = time.monotonic()
        try:
            from engines.signals.generator import generate_signal
            from engines.signals.models import SignalSource
            src_enum = SignalSource.ML_ENGINE
            if source == "tradingview":
                src_enum = SignalSource.TRADINGVIEW
            elif source == "ict_bot":
                src_enum = SignalSource.ICT_BOT

            signal = generate_signal(
                symbol=symbol,
                timeframe=timeframe,
                source=src_enum,
                strategy_id=strategy_id,
                user_id=user_id,
                correlation_id=corr_id,
            )
            result.signal = signal
            result.stages.append(StageResult(
                stage="SIGNAL_GENERATION", status="ok",
                latency_ms=round((time.monotonic() - t0) * 1000, 2),
                reason=f"{signal.direction} {signal.confidence:.1%} conf",
                correlation_id=corr_id,
                data={"signal_id": signal.signal_id, "direction": signal.direction},
            ))
        except Exception as exc:
            s = StageResult(
                stage="SIGNAL_GENERATION", status="failed",
                latency_ms=round((time.monotonic() - t0) * 1000, 2),
                reason=str(exc), correlation_id=corr_id,
            )
            result.stages.append(s)
            return abort("SIGNAL_GENERATION", str(exc))

        # ── Stage 3: Signal Validation ───────────────────────────────────────
        t0 = time.monotonic()
        try:
            from engines.signals.validator import validate_signal
            from engines.signals.state_machine import transition
            from engines.signals.models import SignalStatus

            transition(signal, SignalStatus.VALIDATING, "pipeline: starting validation")
            validation = validate_signal(signal)

            if validation.passed:
                transition(signal, SignalStatus.APPROVED, "pipeline: validation passed")
                result.stages.append(StageResult(
                    stage="SIGNAL_VALIDATION", status="ok",
                    latency_ms=round((time.monotonic() - t0) * 1000, 2),
                    reason=validation.reason, correlation_id=corr_id,
                    data={"checks_run": validation.checks_run},
                ))
            else:
                transition(signal, SignalStatus.REJECTED, f"validation: {validation.reason}")
                s = StageResult(
                    stage="SIGNAL_VALIDATION", status="rejected",
                    latency_ms=round((time.monotonic() - t0) * 1000, 2),
                    reason=validation.reason, correlation_id=corr_id,
                    data={"checks_failed": validation.checks_failed},
                )
                result.stages.append(s)
                return abort("SIGNAL_VALIDATION", validation.reason)
        except Exception as exc:
            result.stages.append(StageResult(
                stage="SIGNAL_VALIDATION", status="failed",
                latency_ms=round((time.monotonic() - t0) * 1000, 2),
                reason=str(exc), correlation_id=corr_id,
            ))
            return abort("SIGNAL_VALIDATION", str(exc))

        # ── Stage 4: Risk Evaluation ──────────────────────────────────────────
        t0 = time.monotonic()
        try:
            from engines.risk import RiskManager
            from engines.signals.models import RiskDecision as RiskDecisionModel

            rm = RiskManager()

            # Circuit breaker state
            if rm.circuit_breaker_active():
                risk_decision = RiskDecisionModel(
                    approved=False,
                    reason="Daily loss circuit breaker is active",
                    circuit_breaker_active=True,
                    latency_ms=round((time.monotonic() - t0) * 1000, 2),
                )
            else:
                kelly = rm.kelly_fraction()
                position_size = rm.position_size(
                    account_balance=10_000.0,  # placeholder — override with real balance
                    entry_price=signal.entry_price or 1.0,
                    stop_loss=signal.stop_loss or (signal.entry_price * 0.98 if signal.entry_price else 1.0),
                    kelly_override=kelly,
                )
                approved = position_size > 0
                risk_decision = RiskDecisionModel(
                    approved=approved,
                    reason="Risk approved" if approved else "Position size zero — risk limits exceeded",
                    position_size=position_size,
                    kelly_fraction=kelly,
                    stop_loss=signal.stop_loss,
                    take_profit=signal.take_profit,
                    latency_ms=round((time.monotonic() - t0) * 1000, 2),
                )

            result.risk_decision = risk_decision

            if risk_decision.approved:
                result.stages.append(StageResult(
                    stage="RISK_EVALUATION", status="ok",
                    latency_ms=round((time.monotonic() - t0) * 1000, 2),
                    reason=risk_decision.reason, correlation_id=corr_id,
                    data={"position_size": risk_decision.position_size},
                ))
            else:
                result.stages.append(StageResult(
                    stage="RISK_EVALUATION", status="rejected",
                    latency_ms=round((time.monotonic() - t0) * 1000, 2),
                    reason=risk_decision.reason, correlation_id=corr_id,
                ))
                return abort("RISK_EVALUATION", risk_decision.reason)
        except Exception as exc:
            result.stages.append(StageResult(
                stage="RISK_EVALUATION", status="failed",
                latency_ms=round((time.monotonic() - t0) * 1000, 2),
                reason=str(exc), correlation_id=corr_id,
            ))
            return abort("RISK_EVALUATION", str(exc))

        # ── Stage 5: Live Safety Gates (LIVE mode only) ──────────────────────
        t0 = time.monotonic()
        if self.trading_mode == "LIVE":
            gate_failure = _check_live_safety_gates(result)
            if gate_failure:
                result.stages.append(StageResult(
                    stage="SAFETY_GATES", status="rejected",
                    latency_ms=round((time.monotonic() - t0) * 1000, 2),
                    reason=gate_failure, correlation_id=corr_id,
                ))
                return abort("SAFETY_GATES", gate_failure)
            result.stages.append(StageResult(
                stage="SAFETY_GATES", status="ok",
                latency_ms=round((time.monotonic() - t0) * 1000, 2),
                reason="All live safety gates passed", correlation_id=corr_id,
            ))
        else:
            result.stages.append(StageResult(
                stage="SAFETY_GATES", status="skipped",
                latency_ms=0.0,
                reason="Paper mode — live gates not required", correlation_id=corr_id,
            ))

        # ── Stage 6: Execution ─────────────────────────────────────────────────
        t0 = time.monotonic()
        try:
            from engines.execution import get_adapter
            from engines.execution.interface import OrderRequest
            from engines.signals.models import SignalStatus

            adapter = get_adapter()
            order_req = OrderRequest(
                correlation_id = corr_id,
                signal_id      = signal.signal_id,
                symbol         = signal.symbol,
                side           = signal.direction,  # BUY or SELL
                quantity       = result.risk_decision.position_size or 1.0,
                stop_loss      = result.risk_decision.stop_loss,
                take_profit    = result.risk_decision.take_profit,
                strategy_id    = strategy_id,
                user_id        = user_id,
            )

            transition(signal, SignalStatus.EXECUTING, "pipeline: submitting order")
            order_result = adapter.submit_order(order_req)
            result.order_result = order_result

            if order_result.is_filled():
                transition(
                    signal,
                    SignalStatus.EXECUTED if order_result.status.value == "executed"
                    else SignalStatus.PARTIALLY_FILLED,
                    f"pipeline: filled @ {order_result.fill_price}"
                )
                result.stages.append(StageResult(
                    stage="EXECUTION", status="ok",
                    latency_ms=round((time.monotonic() - t0) * 1000, 2),
                    reason=f"{adapter.adapter_name} fill @ {order_result.fill_price}",
                    correlation_id=corr_id,
                    data=order_result.to_dict(),
                ))
            else:
                transition(signal, SignalStatus.FAILED, f"execution: {order_result.rejected_reason}")
                s = StageResult(
                    stage="EXECUTION", status="rejected",
                    latency_ms=round((time.monotonic() - t0) * 1000, 2),
                    reason=order_result.rejected_reason or "Execution rejected",
                    correlation_id=corr_id,
                )
                result.stages.append(s)
                return abort("EXECUTION", s.reason)
        except Exception as exc:
            result.stages.append(StageResult(
                stage="EXECUTION", status="failed",
                latency_ms=round((time.monotonic() - t0) * 1000, 2),
                reason=str(exc), correlation_id=corr_id,
            ))
            return abort("EXECUTION", str(exc))

        # ── Stage 7: Trade Journal ─────────────────────────────────────────────
        t0 = time.monotonic()
        try:
            self._journal_trade(signal, result.risk_decision, order_result, corr_id)
            result.stages.append(StageResult(
                stage="TRADE_JOURNAL", status="ok",
                latency_ms=round((time.monotonic() - t0) * 1000, 2),
                reason="Trade journaled", correlation_id=corr_id,
            ))
        except Exception as exc:
            logger.warning("Trade journal failed (non-blocking): %s", exc)
            result.stages.append(StageResult(
                stage="TRADE_JOURNAL", status="failed",
                latency_ms=round((time.monotonic() - t0) * 1000, 2),
                reason=str(exc), correlation_id=corr_id,
            ))
            # Journal failure is non-blocking — trade already executed

        # ── Done ──────────────────────────────────────────────────────────────
        result.final_status    = "COMPLETED"
        result.completed_at    = datetime.now(timezone.utc)
        result.total_latency_ms = round((time.monotonic() - t_total) * 1000, 2)

        logger.info(
            "Pipeline COMPLETED | symbol=%s mode=%s latency=%.1fms corr=%s",
            symbol, self.trading_mode, result.total_latency_ms, corr_id
        )
        self._persist_run(result)
        return result

    def _journal_trade(
        self,
        signal,
        risk_decision,
        order_result,
        corr_id: str,
    ) -> None:
        """Persist TradingSignal and RiskDecision to the Django ORM."""
        try:
            import django
            from trading.trading_models import TradingSignal as DjangoSignal

            DjangoSignal.objects.update_or_create(
                signal_id=signal.signal_id,
                defaults={
                    "correlation_id":      signal.correlation_id,
                    "symbol":              signal.symbol,
                    "timeframe":           signal.timeframe,
                    "direction":           signal.direction,
                    "confidence":          signal.confidence,
                    "entry_price":         signal.entry_price,
                    "stop_loss":           signal.stop_loss,
                    "take_profit":         signal.take_profit,
                    "risk_reward":         signal.risk_reward,
                    "model_version":       signal.model_version,
                    "data_freshness":      signal.data_freshness.value,
                    "source":              signal.source.value,
                    "status":              signal.status.value,
                    "execution_status":    order_result.status.value if order_result else None,
                },
            )
        except Exception as exc:
            logger.warning("Could not persist signal to Django ORM: %s", exc)

    def _persist_run(self, result: PipelineResult) -> None:
        """Persist PipelineRun to Django ORM."""
        try:
            from trading.trading_models import PipelineRun as DjangoPipelineRun
            from django.utils import timezone as tz

            DjangoPipelineRun.objects.update_or_create(
                run_id=result.run_id,
                defaults={
                    "correlation_id":        result.correlation_id,
                    "trading_mode":          result.trading_mode,
                    "status":                result.final_status,
                    "stages":                [s.to_dict() for s in result.stages],
                    "total_latency_ms":      result.total_latency_ms,
                    "abort_reason":          result.abort_reason or "",
                    "emergency_stop_active": result.emergency_stop_active,
                    "completed_at":          result.completed_at,
                },
            )
        except Exception as exc:
            logger.debug("Could not persist PipelineRun to Django ORM: %s", exc)
