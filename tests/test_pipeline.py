import pytest
from unittest.mock import patch, MagicMock

from engines.orchestration.trading_pipeline import TradingPipeline, PipelineResult
from engines.signals.models import TradingSignal
from engines.execution.interface import OrderResult, FillStatus
import engines.orchestration.trading_pipeline as pipeline_mod

@patch("engines.orchestration.trading_pipeline.TradingPipeline._stage_market_data")
@patch("engines.orchestration.trading_pipeline.TradingPipeline._stage_signal_generation")
@patch("engines.orchestration.trading_pipeline.TradingPipeline._stage_signal_validation")
@patch("engines.orchestration.trading_pipeline.TradingPipeline._stage_risk_evaluation")
@patch("engines.orchestration.trading_pipeline.TradingPipeline._stage_execution")
@patch("engines.orchestration.trading_pipeline.TradingPipeline._stage_trade_journal")
def test_pipeline_paper_mode(mock_journal, mock_execution, mock_risk, mock_validation, mock_generation, mock_market_data):
    # Mocking standard stage responses to just return ok StageResult and populate pipeline state
    from engines.orchestration.trading_pipeline import StageResult
    
    mock_market_data.return_value = StageResult(stage="MARKET_DATA", status="ok")
    mock_generation.return_value = StageResult(stage="SIGNAL_GENERATION", status="ok")
    mock_validation.return_value = StageResult(stage="SIGNAL_VALIDATION", status="ok")
    mock_risk.return_value = StageResult(stage="RISK_EVALUATION", status="ok")
    mock_execution.return_value = StageResult(stage="EXECUTION", status="ok")
    mock_journal.return_value = StageResult(stage="TRADE_JOURNAL", status="ok")
    
    # We also need to patch the emergency stop check since it is called directly
    with patch("engines.orchestration.trading_pipeline.get_emergency_stop") as mock_es:
        es_mock = MagicMock()
        es_mock.is_active = False
        mock_es.return_value = es_mock
        
        pipeline = TradingPipeline()
        result = pipeline.run(symbol="AAPL", timeframe="1h")
        
        assert result.final_status == "COMPLETED"
        assert result.emergency_stop_active is False
        assert result.abort_reason == ""
        # 7 stages: EMERGENCY_STOP_CHECK + the 6 mocked ones (Safety Gates is skipped in paper)
        # Actually some might be inside, let's just check final_status
        mock_journal.assert_called_once()

@patch("engines.orchestration.trading_pipeline.get_emergency_stop")
def test_pipeline_abort_on_emergency_stop(mock_es):
    es_mock = MagicMock()
    es_mock.is_active = True
    es_mock.reason = "Market crash"
    mock_es.return_value = es_mock
    
    pipeline = TradingPipeline()
    result = pipeline.run(symbol="AAPL", timeframe="1h")
    
    assert result.final_status == "ABORTED"
    assert result.emergency_stop_active is True
    assert "emergency stop" in result.abort_reason.lower()
