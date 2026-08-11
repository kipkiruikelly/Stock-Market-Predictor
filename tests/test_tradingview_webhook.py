import pytest
import hmac
import hashlib
import json
from unittest.mock import patch, MagicMock

import django_backend.trading.tradingview_webhook_views as tv_views

@pytest.fixture
def mock_settings():
    with patch("django_backend.trading.tradingview_webhook_views.TV_WEBHOOK_SECRET", "test_secret"):
        yield

@pytest.fixture
def mock_cache():
    with patch("django_backend.trading.tradingview_webhook_views.cache") as cache_mock:
        cache_mock.get.return_value = None
        yield cache_mock

def test_hmac_signature_validation(mock_settings):
    payload = b'{"ticker": "AAPL"}'
    valid_sig = hmac.new(b"test_secret", payload, hashlib.sha256).hexdigest()
    
    # Check valid
    assert tv_views._validate_signature(payload, valid_sig) is True
    
    # Check invalid
    assert tv_views._validate_signature(payload, "invalid_sig") is False

def test_replay_protection(mock_cache):
    nonce = "test-nonce-123"
    
    # First time, should be True
    assert tv_views._check_replay(nonce) is True
    mock_cache.set.assert_called_with(f"tv_webhook_nonce:{nonce}", 1, timeout=600)
    
    # Second time, cache returns something, should be False
    mock_cache.get.return_value = 1
    assert tv_views._check_replay(nonce) is False

@patch("django_backend.trading.tradingview_webhook_views.TradingViewWebhookView._queue_pipeline")
def test_valid_alert_creates_signal(mock_queue, mock_settings, mock_cache):
    from rest_framework.test import APIRequestFactory
    import time
    factory = APIRequestFactory()
    
    payload = {
        "ticker": "AAPL",
        "action": "BUY",
        "interval": "1h",
        "timestamp": int(time.time()),
        "nonce": "unique-123"
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    sig = hmac.new(b"test_secret", payload_bytes, hashlib.sha256).hexdigest()
    
    request = factory.post("/webhook", data=payload_bytes, content_type="application/json")
    request.META["HTTP_X_TRADINGVIEW_TOKEN"] = sig
    request.META["REMOTE_ADDR"] = "127.0.0.1"
    
    view = tv_views.TradingViewWebhookView.as_view()
    response = view(request)
    
    assert response.status_code == 200
    mock_queue.assert_called_once()
    
    # Verify the signal object passed to queue
    signal_arg = mock_queue.call_args[0][0]
    assert signal_arg.symbol == "AAPL"
    assert signal_arg.direction == "BUY"

@patch("django_backend.trading.tradingview_webhook_views.TradingViewWebhookView._queue_pipeline")
def test_timestamp_drift_check(mock_queue, mock_settings, mock_cache):
    from rest_framework.test import APIRequestFactory
    import time
    factory = APIRequestFactory()
    
    # Create payload with old timestamp (more than 300s)
    payload = {
        "ticker": "AAPL",
        "action": "BUY",
        "interval": "1h",
        "timestamp": int(time.time()) - 400,
        "nonce": "unique-123"
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    sig = hmac.new(b"test_secret", payload_bytes, hashlib.sha256).hexdigest()
    
    request = factory.post("/webhook", data=payload_bytes, content_type="application/json")
    request.META["HTTP_X_TRADINGVIEW_TOKEN"] = sig
    request.META["REMOTE_ADDR"] = "127.0.0.1"
    
    view = tv_views.TradingViewWebhookView.as_view()
    response = view(request)
    
    assert response.status_code == 400
    assert "timestamp" in response.data["error"].lower()
    mock_queue.assert_not_called()
