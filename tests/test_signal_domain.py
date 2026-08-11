import pytest
import time
from datetime import datetime, timezone, timedelta

from engines.signals.models import SignalStatus, TradingSignal, DataFreshness, SignalSource
from engines.signals.state_machine import transition, SignalTransitionError
from engines.signals.validator import validate_signal, clear_duplicate_cache
from engines.signals.generator import generate_signal

def test_signal_status_transitions():
    signal = TradingSignal(symbol="AAPL")
    assert signal.status == SignalStatus.GENERATED
    
    # Valid transition
    transition(signal, SignalStatus.VALIDATING, reason="Start validation")
    assert signal.status == SignalStatus.VALIDATING
    
    # Invalid transition
    with pytest.raises(SignalTransitionError):
        transition(signal, SignalStatus.EXECUTED, reason="Should fail")

def test_validate_signal_freshness_rejection():
    # If SYNTHETIC, it should be rejected.
    signal = TradingSignal(symbol="AAPL", direction="BUY", confidence=0.8, data_freshness=DataFreshness.SYNTHETIC)
    result = validate_signal(signal)
    assert result.passed is False
    assert "synthetic" in result.reason.lower()

def test_validate_signal_confidence_threshold():
    signal = TradingSignal(symbol="AAPL", direction="BUY", confidence=0.1, data_freshness=DataFreshness.LIVE)
    result = validate_signal(signal, min_confidence=0.5)
    assert result.passed is False
    assert "confidence" in result.reason.lower()

def test_validate_signal_duplicate_detection():
    clear_duplicate_cache()
    signal1 = TradingSignal(symbol="MSFT", direction="BUY", confidence=0.8, data_freshness=DataFreshness.LIVE, timeframe="1h")
    signal2 = TradingSignal(symbol="MSFT", direction="BUY", confidence=0.8, data_freshness=DataFreshness.LIVE, timeframe="1h")
    
    res1 = validate_signal(signal1, duplicate_window_s=60)
    assert res1.passed is True
    
    res2 = validate_signal(signal2, duplicate_window_s=60)
    assert res2.passed is False
    assert "duplicate" in res2.reason.lower()

def test_generate_signal():
    # Test generate_signal returning a TradingSignal
    signal = generate_signal(symbol="TSLA", direction="BUY", confidence=0.9)
    assert isinstance(signal, TradingSignal)
    assert signal.symbol == "TSLA"
    assert signal.direction == "BUY"
    assert signal.confidence == 0.9
