"""
engines/execution/
Unified execution abstraction layer.

The trading pipeline must NOT call MT5Trader or paper_engine directly.
Instead it calls the ExecutionAdapter interface, which dispatches to
the correct backend (paper or MT5) based on TRADING_MODE.

Public API:
    from engines.execution import get_adapter, ExecutionAdapter
    from engines.execution import OrderRequest, OrderResult, FillStatus
"""

from engines.execution.interface import (
    ExecutionAdapter, OrderRequest, OrderResult, FillStatus, ExecutionError
)
from engines.execution.paper import PaperExecutionAdapter
from engines.execution.mt5 import MT5ExecutionAdapter

import os


def get_adapter() -> ExecutionAdapter:
    """
    Return the appropriate execution adapter based on TRADING_MODE env var.
    Defaults to PAPER — live execution requires explicit opt-in.
    """
    mode = os.environ.get("TRADING_MODE", "PAPER").upper().strip()
    if mode == "LIVE":
        return MT5ExecutionAdapter()
    return PaperExecutionAdapter()


__all__ = [
    "ExecutionAdapter", "OrderRequest", "OrderResult", "FillStatus",
    "ExecutionError", "PaperExecutionAdapter", "MT5ExecutionAdapter",
    "get_adapter",
]
