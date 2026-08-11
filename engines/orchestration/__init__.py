"""
engines/orchestration/
Trading pipeline orchestrator and safety control.

Public API:
    from engines.orchestration import TradingPipeline, EmergencyStopManager
    from engines.orchestration.trading_pipeline import PipelineResult, StageResult
"""

from engines.orchestration.emergency_stop import EmergencyStopManager
from engines.orchestration.trading_pipeline import TradingPipeline, PipelineResult, StageResult

__all__ = [
    "EmergencyStopManager",
    "TradingPipeline",
    "PipelineResult",
    "StageResult",
]
