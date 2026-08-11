import pytest
from engines.mt5.reconciliation import compare_positions, PositionDiff, ReconciliationReport

def test_compare_positions_missing_in_broker():
    internal_positions = [
        {"symbol": "AAPL", "qty": 10.0, "side": "buy"}
    ]
    mt5_positions = []
    
    report = compare_positions(internal_positions, mt5_positions)
    assert report.total_issues == 1
    assert len(report.missing_in_broker) == 1
    assert report.missing_in_broker[0].symbol == "AAPL"

def test_compare_positions_unexpected_in_broker():
    internal_positions = []
    mt5_positions = [
        {"symbol": "MSFT", "qty": 5.0, "side": "buy"}
    ]
    
    report = compare_positions(internal_positions, mt5_positions)
    assert report.total_issues == 1
    assert len(report.unexpected_in_broker) == 1
    assert report.unexpected_in_broker[0].symbol == "MSFT"

def test_compare_positions_qty_mismatch():
    internal_positions = [
        {"symbol": "TSLA", "qty": 10.0, "side": "buy"}
    ]
    mt5_positions = [
        {"symbol": "TSLA", "qty": 5.0, "side": "buy"}
    ]
    
    report = compare_positions(internal_positions, mt5_positions)
    assert report.total_issues == 1
    assert len(report.quantity_mismatches) == 1
    assert report.quantity_mismatches[0].symbol == "TSLA"

def test_compare_positions_perfect_match():
    internal_positions = [
        {"symbol": "AMZN", "qty": 10.0, "side": "buy", "sl": 100, "tp": 200}
    ]
    mt5_positions = [
        {"symbol": "AMZN", "qty": 10.0, "side": "buy", "sl": 100, "tp": 200}
    ]
    
    report = compare_positions(internal_positions, mt5_positions)
    assert report.total_issues == 0
    assert report.severity == "OK"
