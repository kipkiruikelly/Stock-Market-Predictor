"""
engines/execution/interface.py
Abstract base class and typed models for the execution layer.

Critical invariant:
  An OrderResult.status is only set to FillStatus.EXECUTED after confirmed
  broker-side state. "Request sent" is NOT "Order executed".
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any


class FillStatus(Enum):
    PENDING          = "pending"           # submitted, awaiting response
    ACKNOWLEDGED     = "acknowledged"      # broker accepted, awaiting fill
    EXECUTED         = "executed"          # confirmed fill
    PARTIALLY_FILLED = "partially_filled"  # partial fill received
    REJECTED         = "rejected"          # broker rejected
    CANCELLED        = "cancelled"         # cancelled before fill
    TIMEOUT          = "timeout"           # no response in time
    ERROR            = "error"             # internal error


class ExecutionError(Exception):
    """Raised when an execution attempt fails definitively."""


@dataclass
class OrderRequest:
    """Typed execution request. Built from a RiskDecision + TradingSignal."""
    correlation_id: str
    signal_id: str
    symbol: str
    side: str                    # "BUY" or "SELL"
    quantity: float              # shares / lots
    order_type: str = "MARKET"   # MARKET / LIMIT / STOP
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    strategy_id: Optional[str] = None
    user_id: Optional[str] = None
    time_in_force: str = "GTC"   # GTC / IOC / FOK / DAY
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OrderResult:
    """Result of an order submission — only EXECUTED if broker confirmed."""
    correlation_id: str
    signal_id: str
    order_id: Optional[str] = None
    broker_order_id: Optional[str] = None
    status: FillStatus = FillStatus.PENDING
    fill_price: Optional[float] = None
    fill_quantity: Optional[float] = None
    requested_quantity: Optional[float] = None
    slippage_bps: Optional[float] = None
    execution_latency_ms: Optional[float] = None
    rejected_reason: Optional[str] = None
    broker_response: Optional[Dict[str, Any]] = None
    submitted_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None
    adapter: str = "unknown"

    def is_filled(self) -> bool:
        return self.status in (FillStatus.EXECUTED, FillStatus.PARTIALLY_FILLED)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "correlation_id": self.correlation_id,
            "signal_id": self.signal_id,
            "order_id": self.order_id,
            "broker_order_id": self.broker_order_id,
            "status": self.status.value,
            "fill_price": self.fill_price,
            "fill_quantity": self.fill_quantity,
            "slippage_bps": self.slippage_bps,
            "execution_latency_ms": self.execution_latency_ms,
            "rejected_reason": self.rejected_reason,
            "submitted_at": self.submitted_at.isoformat(),
            "confirmed_at": self.confirmed_at.isoformat() if self.confirmed_at else None,
            "adapter": self.adapter,
        }


class ExecutionAdapter(ABC):
    """Abstract base class. All adapters must implement these methods."""

    @abstractmethod
    def submit_order(self, request: OrderRequest) -> OrderResult:
        """
        Submit an order and return a result.
        Status is EXECUTED only after broker-side confirmation.
        """
        ...

    @abstractmethod
    def cancel_order(self, order_id: str) -> bool:
        """Cancel a pending order. Returns True if cancellation succeeded."""
        ...

    @abstractmethod
    def get_position(self, symbol: str, user_id: Optional[str] = None) -> Optional[Dict]:
        """Return current position dict for symbol, or None."""
        ...

    @abstractmethod
    def get_account(self) -> Dict[str, Any]:
        """Return account info: balance, equity, margin, free_margin."""
        ...

    @property
    @abstractmethod
    def adapter_name(self) -> str:
        ...

    @abstractmethod
    def is_healthy(self) -> bool:
        """Return True if the adapter can accept orders right now."""
        ...
