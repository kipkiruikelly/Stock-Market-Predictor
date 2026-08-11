"""
django_backend/trading/trading_models.py
Phase 17 — Institutional Trading Pipeline Models.

All new models for the live trading pipeline:
  TradingSignal, RiskDecision, PipelineRun, ReconciliationEvent,
  TradeOutcome, ModelVersion, EmergencyStop.

These models live in the 'users' app migration (same pattern as the
existing codebase) but are defined here for separation of concerns.
"""

from django.db import models
from django.utils import timezone
import uuid


class TradingSignal(models.Model):
    """
    Canonical trading signal produced by the prediction engine.
    A signal moves through a state machine — do not alter status directly,
    use the state machine in engines/signals/state_machine.py.
    """

    class Status(models.TextChoices):
        GENERATED = 'GENERATED', 'Generated'
        VALIDATING = 'VALIDATING', 'Validating'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        EXPIRED = 'EXPIRED', 'Expired'
        QUEUED = 'QUEUED', 'Queued'
        EXECUTING = 'EXECUTING', 'Executing'
        EXECUTED = 'EXECUTED', 'Executed'
        PARTIALLY_FILLED = 'PARTIALLY_FILLED', 'Partially Filled'
        CANCELLED = 'CANCELLED', 'Cancelled'
        FAILED = 'FAILED', 'Failed'

    class Source(models.TextChoices):
        ML_ENGINE = 'ml_engine', 'ML Engine'
        TRADINGVIEW = 'tradingview', 'TradingView'
        ICT_BOT = 'ict_bot', 'ICT Bot'
        MANUAL = 'manual', 'Manual'
        API = 'api', 'API'

    # Identity
    signal_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    correlation_id = models.UUIDField(default=uuid.uuid4, db_index=True)

    # Asset
    symbol = models.CharField(max_length=32, db_index=True)
    asset_class = models.CharField(max_length=32, default='equity')
    timeframe = models.CharField(max_length=8, default='1d')

    # Signal direction & confidence
    direction = models.CharField(max_length=8)  # BUY / SELL / HOLD
    confidence = models.FloatField(null=True, blank=True)  # 0.0–1.0
    entry_price = models.FloatField(null=True, blank=True)
    stop_loss = models.FloatField(null=True, blank=True)
    take_profit = models.FloatField(null=True, blank=True)
    risk_reward = models.FloatField(null=True, blank=True)

    # Model provenance
    model_name = models.CharField(max_length=64, default='unknown')
    model_version = models.CharField(max_length=32, default='unknown')
    model_family = models.CharField(max_length=32, default='unknown')
    feature_version = models.CharField(max_length=32, default='unknown')
    regime = models.CharField(max_length=32, null=True, blank=True)

    # Data quality
    data_freshness = models.CharField(max_length=16, default='unknown')  # live/stale/synthetic
    feature_snapshot_ref = models.CharField(max_length=255, null=True, blank=True)

    # Timestamps
    prediction_timestamp = models.DateTimeField(default=timezone.now)
    expiration_timestamp = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Source
    source = models.CharField(
        max_length=32, choices=Source.choices, default=Source.ML_ENGINE
    )
    strategy_id = models.CharField(max_length=64, null=True, blank=True)

    # State
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.GENERATED, db_index=True
    )
    validation_status = models.CharField(max_length=20, null=True, blank=True)
    validation_reason = models.TextField(null=True, blank=True)
    risk_status = models.CharField(max_length=20, null=True, blank=True)
    execution_status = models.CharField(max_length=20, null=True, blank=True)

    # User link (optional)
    user = models.ForeignKey(
        'users.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='trading_signals'
    )

    class Meta:
        app_label = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['symbol', 'status']),
            models.Index(fields=['correlation_id']),
        ]

    def __str__(self):
        return f"Signal {self.signal_id} | {self.symbol} {self.direction} @ {self.entry_price}"


class RiskDecision(models.Model):
    """Risk engine evaluation result for a TradingSignal."""

    signal = models.OneToOneField(
        TradingSignal, on_delete=models.CASCADE, related_name='risk_decision'
    )
    approved = models.BooleanField(default=False)
    reason = models.TextField(default='')
    position_size = models.FloatField(null=True, blank=True)  # lots or shares
    max_loss_amount = models.FloatField(null=True, blank=True)
    stop_loss = models.FloatField(null=True, blank=True)
    take_profit = models.FloatField(null=True, blank=True)
    kelly_fraction = models.FloatField(null=True, blank=True)
    portfolio_exposure_pct = models.FloatField(null=True, blank=True)
    correlation_exposure_pct = models.FloatField(null=True, blank=True)
    daily_loss_used_pct = models.FloatField(null=True, blank=True)
    circuit_breaker_active = models.BooleanField(default=False)
    evaluated_at = models.DateTimeField(auto_now_add=True)
    latency_ms = models.FloatField(null=True, blank=True)

    class Meta:
        app_label = 'users'

    def __str__(self):
        return f"RiskDecision for {self.signal_id} | {'APPROVED' if self.approved else 'REJECTED'}"


class PipelineRun(models.Model):
    """One record per trading pipeline execution. Captures every stage result."""

    class TradingMode(models.TextChoices):
        PAPER = 'PAPER', 'Paper'
        LIVE = 'LIVE', 'Live'

    class RunStatus(models.TextChoices):
        RUNNING = 'RUNNING', 'Running'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        ABORTED = 'ABORTED', 'Aborted (Emergency Stop)'

    run_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    correlation_id = models.UUIDField(db_index=True)
    signal = models.ForeignKey(
        TradingSignal, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='pipeline_runs'
    )
    trading_mode = models.CharField(
        max_length=8, choices=TradingMode.choices, default=TradingMode.PAPER
    )
    status = models.CharField(
        max_length=12, choices=RunStatus.choices, default=RunStatus.RUNNING
    )

    # Stage results stored as JSON
    stages = models.JSONField(default=dict)

    # Timing
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_latency_ms = models.FloatField(null=True, blank=True)

    # Abort / failure
    abort_reason = models.TextField(null=True, blank=True)
    emergency_stop_active = models.BooleanField(default=False)

    user = models.ForeignKey(
        'users.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='pipeline_runs'
    )

    class Meta:
        app_label = 'users'
        ordering = ['-started_at']

    def __str__(self):
        return f"PipelineRun {self.run_id} | {self.status} | {self.trading_mode}"


class ReconciliationEvent(models.Model):
    """Snapshot diff between internal state and broker state."""

    class Severity(models.TextChoices):
        OK = 'OK', 'OK'
        WARNING = 'WARNING', 'Warning'
        CRITICAL = 'CRITICAL', 'Critical'

    event_id = models.UUIDField(default=uuid.uuid4, unique=True)
    reconciled_at = models.DateTimeField(default=timezone.now)
    broker = models.CharField(max_length=32, default='paper')
    severity = models.CharField(
        max_length=16, choices=Severity.choices, default=Severity.OK
    )

    # Counts
    internal_position_count = models.IntegerField(default=0)
    broker_position_count = models.IntegerField(default=0)
    missing_in_broker = models.IntegerField(default=0)
    unexpected_in_broker = models.IntegerField(default=0)
    quantity_mismatches = models.IntegerField(default=0)
    sl_tp_mismatches = models.IntegerField(default=0)
    orphan_orders = models.IntegerField(default=0)

    # Full diff stored as JSON
    diff_detail = models.JSONField(default=dict)
    repair_actions_taken = models.JSONField(default=list)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        app_label = 'users'
        ordering = ['-reconciled_at']

    def __str__(self):
        return f"Reconciliation {self.event_id} | {self.severity} | {self.reconciled_at.date()}"


class TradeOutcome(models.Model):
    """Post-trade outcome record for model feedback loop. Immutable once set."""

    signal = models.OneToOneField(
        TradingSignal, on_delete=models.CASCADE, related_name='outcome'
    )
    paper_trade = models.ForeignKey(
        'PaperTrade', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='outcome'
    )

    # Entry / exit
    entry_price = models.FloatField()
    exit_price = models.FloatField(null=True, blank=True)
    quantity = models.FloatField(null=True, blank=True)
    side = models.CharField(max_length=8)

    # Returns
    gross_pnl = models.FloatField(null=True, blank=True)
    net_pnl = models.FloatField(null=True, blank=True)
    return_pct = models.FloatField(null=True, blank=True)

    # Execution quality
    entry_slippage_bps = models.FloatField(null=True, blank=True)
    exit_slippage_bps = models.FloatField(null=True, blank=True)
    max_favorable_excursion = models.FloatField(null=True, blank=True)  # MFE
    max_adverse_excursion = models.FloatField(null=True, blank=True)    # MAE
    holding_bars = models.IntegerField(null=True, blank=True)
    holding_seconds = models.FloatField(null=True, blank=True)

    # Context at entry
    market_regime = models.CharField(max_length=32, null=True, blank=True)
    model_version = models.CharField(max_length=32, default='unknown')
    model_confidence = models.FloatField(null=True, blank=True)

    # Timestamps
    entry_time = models.DateTimeField(null=True, blank=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'users'
        ordering = ['-recorded_at']

    def __str__(self):
        return f"TradeOutcome {self.signal_id} | PnL {self.net_pnl}"


class ModelVersion(models.Model):
    """Model governance registry. One record per deployed model version."""

    class Status(models.TextChoices):
        CHALLENGER = 'challenger', 'Challenger'
        CHAMPION = 'champion', 'Champion'
        RETIRED = 'retired', 'Retired'
        SHADOW = 'shadow', 'Shadow (live data, no execution)'

    model_name = models.CharField(max_length=64, db_index=True)
    version = models.CharField(max_length=32)
    model_family = models.CharField(max_length=32, default='unknown')
    feature_version = models.CharField(max_length=32, default='unknown')
    training_dataset_version = models.CharField(max_length=64, null=True, blank=True)
    training_period_start = models.DateField(null=True, blank=True)
    training_period_end = models.DateField(null=True, blank=True)
    validation_period_start = models.DateField(null=True, blank=True)
    validation_period_end = models.DateField(null=True, blank=True)
    oos_accuracy_pct = models.FloatField(null=True, blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.CHALLENGER
    )
    deployed_at = models.DateTimeField(null=True, blank=True)
    retired_at = models.DateTimeField(null=True, blank=True)
    deployed_by = models.CharField(max_length=64, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'users'
        unique_together = [('model_name', 'version')]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.model_name} v{self.version} [{self.status}]"


class EmergencyStop(models.Model):
    """Audit record of global trading kill-switch activations."""

    activated_at = models.DateTimeField(default=timezone.now)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    activated_by = models.CharField(max_length=128)  # username or 'system'
    deactivated_by = models.CharField(max_length=128, null=True, blank=True)
    reason = models.TextField()
    affected_accounts = models.JSONField(default=list)
    new_orders_blocked = models.BooleanField(default=True)
    close_positions = models.BooleanField(default=False)  # explicit opt-in only
    is_active = models.BooleanField(default=True, db_index=True)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        app_label = 'users'
        ordering = ['-activated_at']

    def __str__(self):
        status = 'ACTIVE' if self.is_active else 'RESOLVED'
        return f"EmergencyStop [{status}] by {self.activated_by} at {self.activated_at}"
