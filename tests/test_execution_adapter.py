import pytest
from unittest.mock import patch
from datetime import datetime, timezone

from engines.execution.interface import OrderRequest, FillStatus
from engines.execution.paper import PaperExecutionAdapter
from engines.execution.mt5 import MT5ExecutionAdapter

@patch("engines.paper_trading.try_open")
@patch("engines.paper_trading.load_config")
def test_paper_execution_adapter_open(mock_load_config, mock_try_open):
    mock_load_config.return_value = {"starting_balance": 1000000.0}
    mock_try_open.return_value = {"fill_price": 150.0, "qty": 10.0}
    
    adapter = PaperExecutionAdapter()
    req = OrderRequest(
        correlation_id="corr-1",
        signal_id="sig-1",
        symbol="AAPL",
        side="BUY",
        quantity=10.0,
        order_type="MARKET"
    )
    
    res = adapter.submit_order(req)
    assert res.status == FillStatus.FILLED
    assert res.filled_quantity == 10.0
    assert res.average_fill_price == 150.0

@patch("engines.paper_trading.try_open")
@patch("engines.paper_trading.load_config")
def test_paper_execution_adapter_reject(mock_load_config, mock_try_open):
    mock_load_config.return_value = {"starting_balance": 1000000.0}
    mock_try_open.return_value = None  # means rejected or failed
    
    adapter = PaperExecutionAdapter()
    req = OrderRequest(
        correlation_id="corr-1",
        signal_id="sig-1",
        symbol="AAPL",
        side="BUY",
        quantity=10.0,
        order_type="MARKET"
    )
    
    res = adapter.submit_order(req)
    assert res.status == FillStatus.REJECTED

@patch("engines.mt5.live_trading_enabled", return_value=False)
def test_mt5_execution_adapter_live_safety_gate(mock_live_trading_enabled):
    adapter = MT5ExecutionAdapter()
    req = OrderRequest(
        correlation_id="corr-2",
        signal_id="sig-2",
        symbol="EURUSD",
        side="BUY",
        quantity=0.1,
        order_type="MARKET"
    )
    
    res = adapter.submit_order(req)
    assert res.status == FillStatus.REJECTED
    assert "safety gate" in res.error_message.lower() or "enable_live_trading" in res.error_message.lower()

