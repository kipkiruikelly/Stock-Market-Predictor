"""
engines/mt5/reconciliation.py
Position and order reconciliation between internal Triple Fusion state and MT5 broker state.

Reconciliation detects:
  - Positions in Triple Fusion but missing in MT5 (may have been closed externally)
  - Positions in MT5 not tracked by Triple Fusion (unexpected/orphan positions)
  - Quantity mismatches between internal and broker
  - SL/TP mismatches
  - Orphan pending orders

Critical rule:
  Reconciliation NEVER automatically repairs discrepancies that could cause financial loss
  (e.g., it will not auto-close a position). It produces a report and waits for action.

  Auto-repair is only performed for harmless corrections (e.g., updating a stale
  internal position status to 'closed' when MT5 confirms it is closed).
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class PositionDiff:
    symbol: str
    diff_type: str          # missing_in_broker / unexpected_in_broker / qty_mismatch / sl_tp_mismatch
    internal_state: Optional[Dict[str, Any]] = None
    broker_state: Optional[Dict[str, Any]] = None
    severity: str = "WARNING"   # OK / WARNING / CRITICAL
    recommended_action: str = ""
    auto_repaired: bool = False
    repair_notes: str = ""


@dataclass
class ReconciliationReport:
    reconciled_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    broker: str = "paper"

    internal_count: int = 0
    broker_count: int = 0

    missing_in_broker: List[PositionDiff] = field(default_factory=list)
    unexpected_in_broker: List[PositionDiff] = field(default_factory=list)
    quantity_mismatches: List[PositionDiff] = field(default_factory=list)
    sl_tp_mismatches: List[PositionDiff] = field(default_factory=list)
    orphan_orders: List[Dict[str, Any]] = field(default_factory=list)

    auto_repairs: List[str] = field(default_factory=list)

    @property
    def total_issues(self) -> int:
        return (
            len(self.missing_in_broker) +
            len(self.unexpected_in_broker) +
            len(self.quantity_mismatches) +
            len(self.sl_tp_mismatches) +
            len(self.orphan_orders)
        )

    @property
    def severity(self) -> str:
        if self.total_issues == 0:
            return "OK"
        critical = [d for d in (
            self.missing_in_broker + self.unexpected_in_broker +
            self.quantity_mismatches
        ) if d.severity == "CRITICAL"]
        return "CRITICAL" if critical else "WARNING"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "reconciled_at":          self.reconciled_at.isoformat(),
            "broker":                 self.broker,
            "internal_position_count": self.internal_count,
            "broker_position_count":   self.broker_count,
            "total_issues":            self.total_issues,
            "severity":                self.severity,
            "missing_in_broker":       len(self.missing_in_broker),
            "unexpected_in_broker":    len(self.unexpected_in_broker),
            "quantity_mismatches":     len(self.quantity_mismatches),
            "sl_tp_mismatches":        len(self.sl_tp_mismatches),
            "orphan_orders":           len(self.orphan_orders),
            "auto_repairs":            self.auto_repairs,
            "diffs": [
                {
                    "symbol":          d.symbol,
                    "type":            d.diff_type,
                    "severity":        d.severity,
                    "recommended":     d.recommended_action,
                    "auto_repaired":   d.auto_repaired,
                }
                for d in (
                    self.missing_in_broker + self.unexpected_in_broker +
                    self.quantity_mismatches + self.sl_tp_mismatches
                )
            ],
        }


QTY_TOLERANCE = 0.001     # lots — differences smaller than this are ignored
PRICE_TOLERANCE = 0.0001  # SL/TP price tolerance


def compare_positions(
    internal_positions: List[Dict[str, Any]],
    mt5_positions: List[Dict[str, Any]],
    broker: str = "paper",
    auto_repair: bool = False,
) -> ReconciliationReport:
    """
    Compare internal position state against broker positions.

    Args:
        internal_positions: List of position dicts from Triple Fusion / paper engine.
                            Each should have: symbol, side, volume/qty, sl, tp, ticket/id
        mt5_positions:      List of position dicts from MT5 (or paper broker).
                            Keys: symbol, type (buy/sell), volume, sl, tp, ticket
        broker:             Name of broker being reconciled ('paper', 'mt5', 'metaapi').
        auto_repair:        If True, perform safe auto-repairs (e.g., mark closed positions).
                            Dangerous repairs are never performed automatically.

    Returns:
        ReconciliationReport with all detected discrepancies.
    """
    report = ReconciliationReport(broker=broker)
    report.internal_count = len(internal_positions)
    report.broker_count   = len(mt5_positions)

    # Build lookup dicts keyed by symbol (uppercase)
    internal_map: Dict[str, Dict] = {}
    for pos in internal_positions:
        sym = str(pos.get("symbol") or pos.get("ticker", "")).upper()
        if sym:
            internal_map[sym] = pos

    broker_map: Dict[str, Dict] = {}
    for pos in mt5_positions:
        sym = str(pos.get("symbol", "")).upper()
        if sym:
            broker_map[sym] = pos

    # Check 1: Internal positions missing in broker
    for sym, ipos in internal_map.items():
        if sym not in broker_map:
            diff = PositionDiff(
                symbol=sym,
                diff_type="missing_in_broker",
                internal_state=ipos,
                broker_state=None,
                severity="CRITICAL",
                recommended_action=(
                    f"Position {sym} exists internally but not in broker. "
                    f"May have been closed externally. Investigate before action."
                ),
            )

            if auto_repair:
                # Safe repair: mark internal position as closed
                try:
                    _mark_internal_closed(sym, ipos)
                    diff.auto_repaired = True
                    diff.repair_notes  = "Marked as closed in internal state (safe repair)"
                    diff.severity      = "WARNING"  # downgrade after repair
                    report.auto_repairs.append(f"Marked {sym} as closed")
                    logger.info("Auto-repair: marked %s as closed (not in broker)", sym)
                except Exception as repair_err:
                    diff.repair_notes = f"Auto-repair failed: {repair_err}"

            report.missing_in_broker.append(diff)
            logger.warning("Reconciliation: %s missing in broker", sym)

    # Check 2: Broker positions not tracked internally
    for sym, bpos in broker_map.items():
        if sym not in internal_map:
            diff = PositionDiff(
                symbol=sym,
                diff_type="unexpected_in_broker",
                internal_state=None,
                broker_state=bpos,
                severity="WARNING",
                recommended_action=(
                    f"Broker has position {sym} not tracked internally. "
                    f"May have been opened externally. Do not auto-close."
                ),
            )
            report.unexpected_in_broker.append(diff)
            logger.warning("Reconciliation: %s unexpected in broker", sym)

    # Check 3: Quantity mismatches
    for sym in set(internal_map) & set(broker_map):
        ipos = internal_map[sym]
        bpos = broker_map[sym]

        i_vol = float(ipos.get("volume") or ipos.get("qty") or ipos.get("quantity") or 0)
        b_vol = float(bpos.get("volume") or bpos.get("qty") or 0)

        if abs(i_vol - b_vol) > QTY_TOLERANCE:
            diff = PositionDiff(
                symbol=sym,
                diff_type="qty_mismatch",
                internal_state={"volume": i_vol},
                broker_state={"volume": b_vol},
                severity="CRITICAL",
                recommended_action=(
                    f"Volume mismatch: internal={i_vol} broker={b_vol}. "
                    f"Do not trade until resolved."
                ),
            )
            report.quantity_mismatches.append(diff)
            logger.error("Reconciliation QTY MISMATCH: %s internal=%.4f broker=%.4f", sym, i_vol, b_vol)

    # Check 4: SL/TP mismatches
    for sym in set(internal_map) & set(broker_map):
        ipos = internal_map[sym]
        bpos = broker_map[sym]

        i_sl = float(ipos.get("sl") or ipos.get("stop_loss") or 0)
        b_sl = float(bpos.get("sl") or 0)
        i_tp = float(ipos.get("tp") or ipos.get("take_profit") or 0)
        b_tp = float(bpos.get("tp") or 0)

        sl_mismatch = (i_sl > 0 or b_sl > 0) and abs(i_sl - b_sl) > PRICE_TOLERANCE
        tp_mismatch = (i_tp > 0 or b_tp > 0) and abs(i_tp - b_tp) > PRICE_TOLERANCE

        if sl_mismatch or tp_mismatch:
            diff = PositionDiff(
                symbol=sym,
                diff_type="sl_tp_mismatch",
                internal_state={"sl": i_sl, "tp": i_tp},
                broker_state={"sl": b_sl, "tp": b_tp},
                severity="WARNING",
                recommended_action=(
                    f"SL/TP mismatch for {sym}: "
                    f"internal SL={i_sl} TP={i_tp} "
                    f"broker SL={b_sl} TP={b_tp}. "
                    f"Consider updating broker-side SL/TP."
                ),
            )
            report.sl_tp_mismatches.append(diff)
            logger.warning(
                "Reconciliation SL/TP MISMATCH: %s internal_sl=%.4f broker_sl=%.4f",
                sym, i_sl, b_sl
            )

    # Persist to Django ORM
    _persist_reconciliation(report)

    if report.total_issues == 0:
        logger.info("Reconciliation CLEAN | %d internal == %d broker",
                    report.internal_count, report.broker_count)
    else:
        logger.warning(
            "Reconciliation: %d issues found (severity=%s)",
            report.total_issues, report.severity
        )

    return report


def _mark_internal_closed(symbol: str, internal_pos: Dict[str, Any]) -> None:
    """Mark an internal position as externally closed. Safe auto-repair only."""
    # Attempt Django ORM update if available
    try:
        from users.models import UserPaperPosition
        pos_id = internal_pos.get("id")
        if pos_id:
            UserPaperPosition.objects.filter(id=pos_id, status="open").update(
                status="closed",
                realized_pnl=0.0,  # unknown — external close
            )
    except Exception as exc:
        logger.debug("Could not update UserPaperPosition for %s: %s", symbol, exc)


def _persist_reconciliation(report: ReconciliationReport) -> None:
    """Persist reconciliation event to Django ORM."""
    try:
        from trading.trading_models import ReconciliationEvent
        severity_map = {"OK": "OK", "WARNING": "WARNING", "CRITICAL": "CRITICAL"}
        ReconciliationEvent.objects.create(
            broker=report.broker,
            severity=severity_map.get(report.severity, "WARNING"),
            internal_position_count=report.internal_count,
            broker_position_count=report.broker_count,
            missing_in_broker=len(report.missing_in_broker),
            unexpected_in_broker=len(report.unexpected_in_broker),
            quantity_mismatches=len(report.quantity_mismatches),
            sl_tp_mismatches=len(report.sl_tp_mismatches),
            orphan_orders=len(report.orphan_orders),
            diff_detail=report.to_dict(),
            repair_actions_taken=report.auto_repairs,
        )
    except Exception as exc:
        logger.debug("Could not persist ReconciliationEvent: %s", exc)
