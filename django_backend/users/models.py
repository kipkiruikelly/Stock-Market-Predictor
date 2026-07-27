"""users/models.py — Django ORM models ported from Flask SQLAlchemy.

All 27+ models from models.py are defined here. Trading-specific models
(PaperTrade, TradingBot, etc.) are also kept here for simplicity; trading/
models.py imports from here.
"""

from datetime import date, datetime
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin

from .managers import UserManager

FREE_DAILY_LIMIT = 5
PLUS_BACKTEST_PERIODS = {"6mo", "1y"}
PLUS_BACKTEST_DAILY = 1

# Role hierarchy for admin access control (higher = more privileged)
ROLE_LEVELS = {'user': 0, 'viewer': 1, 'support': 2, 'admin': 3}


# ── User ─────────────────────────────────────────────────────────────────────

class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model — extends AbstractBaseUser for full control.

    Mirrors every column from the Flask SQLAlchemy User model so that
    migrate_data.py can copy rows verbatim (Werkzeug password hashes are
    handled transparently by WerkzeugPBKDF2Hasher).
    """

    username                = models.CharField(max_length=80, unique=True, null=True, blank=True)
    email                   = models.EmailField(max_length=120, unique=True)
    first_name              = models.CharField(max_length=50, null=True, blank=True)
    last_name               = models.CharField(max_length=50, null=True, blank=True)
    phone_number            = models.CharField(max_length=20, null=True, blank=True)
    country                 = models.CharField(max_length=50, null=True, blank=True)
    timezone                = models.CharField(max_length=50, default='UTC')
    preferred_language      = models.CharField(max_length=10, default='en')
    is_deleted              = models.BooleanField(default=False)
    # 'password' field inherited from AbstractBaseUser; we store the raw
    # Werkzeug hash here on import; Django will upgrade it on next login.

    plan                    = models.CharField(max_length=20, default='free')
    role                    = models.CharField(max_length=10, default='user')   # user|viewer|support|admin
    status                  = models.CharField(max_length=12, default='active') # active|deactivated|banned
    created_at              = models.DateTimeField(default=datetime.utcnow)
    last_seen               = models.DateTimeField(null=True, blank=True)
    email_verified          = models.BooleanField(default=False)
    auth_provider           = models.CharField(max_length=10, default='local')  # local|google
    google_sub              = models.CharField(max_length=64, unique=True, null=True, blank=True)
    session_token           = models.CharField(max_length=32, null=True, blank=True)
    ban_reason              = models.CharField(max_length=200, null=True, blank=True)

    predictions_today       = models.IntegerField(default=0)
    last_prediction_date    = models.DateField(null=True, blank=True)
    stripe_customer_id      = models.CharField(max_length=64, null=True, blank=True)
    stripe_subscription_id  = models.CharField(max_length=64, null=True, blank=True)
    alerts_enabled          = models.BooleanField(default=True)
    pro_expires_at          = models.DateField(null=True, blank=True)
    theme_preference        = models.CharField(max_length=10, default='system') # light|dark|system

    ai_analyses_today       = models.IntegerField(default=0)
    last_ai_analysis_date   = models.DateField(null=True, blank=True)
    backtests_today         = models.IntegerField(default=0)
    last_backtest_date      = models.DateField(null=True, blank=True)

    xp                      = models.IntegerField(default=0)
    current_streak          = models.IntegerField(default=0)
    longest_streak          = models.IntegerField(default=0)
    last_active_date        = models.DateField(null=True, blank=True)
    paper_trading_opted_in  = models.BooleanField(default=True)

    # Extended Trader Profile Fields
    avatar                  = models.CharField(max_length=500, null=True, blank=True)
    bio                     = models.TextField(null=True, blank=True)
    trading_style           = models.CharField(max_length=30, default='algo_trader')
    twitter_handle          = models.CharField(max_length=50, null=True, blank=True)
    discord_handle          = models.CharField(max_length=50, null=True, blank=True)
    is_profile_public       = models.BooleanField(default=False)

    # Security & Verification Fields
    email_verification_pin  = models.CharField(max_length=6, null=True, blank=True)
    failed_login_attempts   = models.IntegerField(default=0)
    lockout_until           = models.DateTimeField(null=True, blank=True)

    # Django admin / auth requirements
    is_staff                = models.BooleanField(default=False)
    is_active               = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users_user'

    def __str__(self):
        return self.username

    # ── Properties mirroring the Flask model ─────────────────────────────────

    @property
    def role_level(self):
        return ROLE_LEVELS.get(self.role or 'user', 0)

    @property
    def is_pro(self):
        if self.plan in ('pro', 'enterprise'):
            if self.pro_expires_at is None:
                return True
            return self.pro_expires_at >= date.today()
        return False

    @property
    def is_plus(self):
        """True for plus, pro, or enterprise — at least the Plus tier."""
        if self.plan in ('plus', 'pro', 'enterprise'):
            if self.pro_expires_at is None:
                return True
            return self.pro_expires_at >= date.today()
        return False

    @property
    def is_enterprise(self):
        if self.plan == 'enterprise':
            if self.pro_expires_at is None:
                return True
            return self.pro_expires_at >= date.today()
        return False

    @property
    def predictions_remaining(self):
        if self.is_plus:
            return None
        today = date.today()
        if self.last_prediction_date != today:
            return FREE_DAILY_LIMIT
        return max(0, FREE_DAILY_LIMIT - self.predictions_today)

    @property
    def level(self):
        """XP → level: flat 100 XP per level, Level 1 starts at 0 XP."""
        return (self.xp or 0) // 100 + 1

    @property
    def xp_into_level(self):
        return (self.xp or 0) % 100

    @property
    def xp_progress_pct(self):
        return self.xp_into_level


# ── Prediction History ────────────────────────────────────────────────────────

class PredictionHistory(models.Model):
    user            = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    ticker          = models.CharField(max_length=12)
    interval        = models.CharField(max_length=4)
    current_price   = models.FloatField()
    lr_pred         = models.FloatField()
    rf_pred         = models.FloatField()
    direction       = models.CharField(max_length=8)
    confidence      = models.FloatField()
    predicted_at    = models.DateTimeField(default=datetime.utcnow)
    # Data-quality context captured at prediction time (nullable, best effort)
    src_source      = models.CharField(max_length=12, null=True, blank=True)   # yfinance|pyth|both
    src_conf_pct    = models.FloatField(null=True, blank=True)                 # Pyth conf / price * 100
    src_divergence  = models.FloatField(null=True, blank=True)                 # % gap between sources

    class Meta:
        db_table = 'prediction_history'
        verbose_name = 'Prediction History'
        verbose_name_plural = 'Prediction Histories'


# ── Watchlist Item ────────────────────────────────────────────────────────────

class WatchlistItem(models.Model):
    user     = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    ticker   = models.CharField(max_length=12)
    added_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'watchlist_item'
        unique_together = [('user', 'ticker')]


# ── Price Alert ───────────────────────────────────────────────────────────────

class PriceAlert(models.Model):
    user         = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    ticker       = models.CharField(max_length=12)
    price        = models.FloatField()
    direction    = models.CharField(max_length=8)
    note         = models.CharField(max_length=100, null=True, blank=True)
    triggered    = models.BooleanField(default=False)
    created_at   = models.DateTimeField(default=datetime.utcnow)
    triggered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'price_alert'


# ── Portfolio Position ────────────────────────────────────────────────────────

class PortfolioPosition(models.Model):
    user        = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    ticker      = models.CharField(max_length=12)
    side        = models.CharField(max_length=8)
    entry_price = models.FloatField()
    quantity    = models.FloatField()
    exit_price  = models.FloatField(null=True, blank=True)
    status      = models.CharField(max_length=8, default='open')
    opened_at   = models.DateTimeField(default=datetime.utcnow)
    closed_at   = models.DateTimeField(null=True, blank=True)
    note        = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        db_table = 'portfolio_position'


# ── API Key ───────────────────────────────────────────────────────────────────

class ApiKey(models.Model):
    user        = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    key         = models.CharField(max_length=64, unique=True)
    name        = models.CharField(max_length=50, default='Default')
    created_at  = models.DateTimeField(default=datetime.utcnow)
    last_used   = models.DateTimeField(null=True, blank=True)
    calls_today = models.IntegerField(default=0)
    calls_date  = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'api_key'


# ── Prediction Accuracy ───────────────────────────────────────────────────────

class PredictionAccuracy(models.Model):
    prediction   = models.ForeignKey(PredictionHistory, on_delete=models.CASCADE, db_column='prediction_id')
    actual_price = models.FloatField(null=True, blank=True)
    direction_ok = models.BooleanField(null=True, blank=True)
    pct_error    = models.FloatField(null=True, blank=True)
    checked_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'prediction_accuracy'
        verbose_name = 'Prediction Accuracy Record'
        verbose_name_plural = 'Prediction Accuracy Records'


# ── Password Reset Token ──────────────────────────────────────────────────────

class PasswordResetToken(models.Model):
    user       = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    token      = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    used       = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_token'


# ── MLOps & Model Registry Architecture ──────────────────────────────────────

class UploadedDataset(models.Model):
    user        = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    filename    = models.CharField(max_length=255)
    file_path   = models.CharField(max_length=500)
    uploaded_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'uploaded_datasets'

class DatasetProperty(models.Model):
    dataset     = models.ForeignKey(UploadedDataset, on_delete=models.SET_NULL, null=True, blank=True)
    ticker      = models.CharField(max_length=20)
    interval    = models.CharField(max_length=10, default='5m')
    total_rows  = models.IntegerField(default=0)
    total_cols  = models.IntegerField(default=0)
    date_start  = models.DateTimeField(null=True, blank=True)
    date_end    = models.DateTimeField(null=True, blank=True)
    null_count  = models.IntegerField(default=0)

    class Meta:
        db_table = 'dataset_properties'

class ModelEvaluation(models.Model):
    model_version            = models.ForeignKey('users.ModelVersion', on_delete=models.CASCADE, related_name='evaluations')
    mae                      = models.FloatField(default=0.0) # Mean Absolute Error
    mse                      = models.FloatField(default=0.0) # Mean Squared Error
    rmse                     = models.FloatField(default=0.0) # Root Mean Squared Error
    r2_score                 = models.FloatField(default=0.0) # R^2 Score
    directional_accuracy_pct = models.FloatField(default=0.0)
    evaluated_at             = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'model_evaluations'


# ── Telegram Config ───────────────────────────────────────────────────────────

class TelegramConfig(models.Model):
    user    = models.OneToOneField('users.User', on_delete=models.CASCADE, db_column='user_id')
    chat_id = models.CharField(max_length=32)
    enabled = models.BooleanField(default=True)

    class Meta:
        db_table = 'telegram_config'


# ── WhatsApp Config ───────────────────────────────────────────────────────────

class WhatsappConfig(models.Model):
    user         = models.OneToOneField('users.User', on_delete=models.CASCADE, db_column='user_id')
    phone_number = models.CharField(max_length=32)
    enabled      = models.BooleanField(default=True)

    class Meta:
        db_table = 'whatsapp_config'


# ── Notification ──────────────────────────────────────────────────────────────

class Notification(models.Model):
    user       = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    type       = models.CharField(max_length=20, default='info')
    title      = models.CharField(max_length=100)
    body       = models.CharField(max_length=300, null=True, blank=True)
    read       = models.BooleanField(default=False)
    link       = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'notification'


# ── Trade Journal ─────────────────────────────────────────────────────────────

class TradeJournal(models.Model):
    user       = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    ticker     = models.CharField(max_length=12, null=True, blank=True)
    title      = models.CharField(max_length=100)
    body       = models.TextField()
    mood       = models.CharField(max_length=10, null=True, blank=True)
    tags       = models.CharField(max_length=200, null=True, blank=True)
    trade_type = models.CharField(max_length=10, null=True, blank=True)
    created_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'trade_journal'


# ── Discord Config ────────────────────────────────────────────────────────────

class DiscordConfig(models.Model):
    user        = models.OneToOneField('users.User', on_delete=models.CASCADE, db_column='user_id')
    webhook_url = models.CharField(max_length=400)
    enabled     = models.BooleanField(default=True)
    created_at  = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'discord_config'


# ── Payment ───────────────────────────────────────────────────────────────────

class Payment(models.Model):
    """Audit record for every payment attempt (Stripe, M-Pesa, gift code)."""
    user         = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    provider     = models.CharField(max_length=10)          # 'stripe' | 'mpesa' | 'gift'
    plan         = models.CharField(max_length=10, null=True, blank=True)   # 'monthly' | 'annual'
    tier         = models.CharField(max_length=10, null=True, blank=True)   # 'plus' | 'pro'
    amount       = models.FloatField(null=True, blank=True)
    currency     = models.CharField(max_length=8, null=True, blank=True)
    days         = models.IntegerField(null=True, blank=True)
    phone        = models.CharField(max_length=15, null=True, blank=True)
    reference    = models.CharField(max_length=80, unique=True, null=True, blank=True)
    receipt      = models.CharField(max_length=40, null=True, blank=True)
    status       = models.CharField(max_length=10, default='pending')  # pending|paid|cancelled|failed|refunded
    flagged      = models.BooleanField(default=False)
    notes        = models.CharField(max_length=300, null=True, blank=True)
    created_at   = models.DateTimeField(default=datetime.utcnow)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payment'


# ── Gift Code ─────────────────────────────────────────────────────────────────

class GiftCode(models.Model):
    code       = models.CharField(max_length=24, unique=True)
    days       = models.IntegerField(default=30)
    used       = models.BooleanField(default=False)
    used_by    = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, db_column='used_by')
    created_at = models.DateTimeField(default=datetime.utcnow)
    used_at    = models.DateTimeField(null=True, blank=True)
    note       = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'gift_code'


# ── User Webhook ──────────────────────────────────────────────────────────────

class UserWebhook(models.Model):
    user       = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    url        = models.CharField(max_length=500)
    name       = models.CharField(max_length=50, default='My Webhook')
    events     = models.CharField(max_length=100, null=True, blank=True)
    secret     = models.CharField(max_length=32, null=True, blank=True)
    active     = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=datetime.utcnow)
    last_fired = models.DateTimeField(null=True, blank=True)
    fire_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'user_webhook'


# ── Activity Log ──────────────────────────────────────────────────────────────

class ActivityLog(models.Model):
    user       = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    action     = models.CharField(max_length=50)
    detail     = models.CharField(max_length=200, null=True, blank=True)
    ip         = models.CharField(max_length=45, null=True, blank=True)
    ua         = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'activity_log'


# ── Two Factor Auth ───────────────────────────────────────────────────────────

class TwoFactorAuth(models.Model):
    user         = models.OneToOneField('users.User', on_delete=models.CASCADE, db_column='user_id')
    secret       = models.CharField(max_length=32)
    enabled      = models.BooleanField(default=False)
    backup_codes = models.CharField(max_length=300, null=True, blank=True)

    class Meta:
        db_table = 'two_factor_auth'


# ── Admin Audit Log ───────────────────────────────────────────────────────────

class AdminAuditLog(models.Model):
    """Immutable log of every admin action. Enforced append-only at the model level."""
    admin       = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='admin_id')
    action      = models.CharField(max_length=50)
    target_type = models.CharField(max_length=30, null=True, blank=True)
    target_id   = models.CharField(max_length=40, null=True, blank=True)
    detail      = models.CharField(max_length=400, null=True, blank=True)
    ip          = models.CharField(max_length=45, null=True, blank=True)
    created_at  = models.DateTimeField(default=datetime.utcnow, db_index=True)

    class Meta:
        db_table = 'admin_audit_log'

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError("admin_audit_log is append-only: update refused")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("admin_audit_log is append-only: delete refused")


# ── App Setting ───────────────────────────────────────────────────────────────

class AppSetting(models.Model):
    """Key-value store for app settings and feature flags."""
    key        = models.CharField(max_length=50, primary_key=True)
    value      = models.CharField(max_length=500, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, db_column='updated_by')

    class Meta:
        db_table = 'app_setting'


# ── Ticker Config ─────────────────────────────────────────────────────────────

class TickerConfig(models.Model):
    """Admin-managed list of supported tickers."""
    symbol   = models.CharField(max_length=12, unique=True)
    name     = models.CharField(max_length=60, null=True, blank=True)
    enabled  = models.BooleanField(default=True)
    added_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'ticker_config'


# ── Broadcast ─────────────────────────────────────────────────────────────────

class Broadcast(models.Model):
    """History of admin announcements sent to users."""
    admin      = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='admin_id')
    title      = models.CharField(max_length=100)
    body       = models.CharField(max_length=1000)
    segment    = models.CharField(max_length=10, default='all')     # all|free|pro
    channel    = models.CharField(max_length=10, default='in-app')  # in-app|email|both
    sent_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'broadcast'


# ── Error Log ─────────────────────────────────────────────────────────────────

class ErrorLog(models.Model):
    """Application errors captured by the global error handler."""
    severity   = models.CharField(max_length=10, default='error', db_index=True)  # error|warning
    endpoint   = models.CharField(max_length=120, null=True, blank=True)
    method     = models.CharField(max_length=8, null=True, blank=True)
    message    = models.CharField(max_length=500)
    trace      = models.TextField(null=True, blank=True)
    ip         = models.CharField(max_length=45, null=True, blank=True)
    created_at = models.DateTimeField(default=datetime.utcnow, db_index=True)

    class Meta:
        db_table = 'error_log'


# ── Pyth Feed ─────────────────────────────────────────────────────────────────

class PythFeed(models.Model):
    """Mapping from ticker symbols to Pyth Network price feed ids."""
    symbol      = models.CharField(max_length=12, unique=True)
    feed_id     = models.CharField(max_length=70)
    pyth_symbol = models.CharField(max_length=40, null=True, blank=True)
    active      = models.BooleanField(default=True)
    updated_at  = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'pyth_feed'


# ── Resource Link ─────────────────────────────────────────────────────────────

class ResourceLink(models.Model):
    """Curated external links shown on the Resources hub, admin managed."""
    category    = models.CharField(max_length=40)
    title       = models.CharField(max_length=80)
    url         = models.CharField(max_length=300)
    description = models.CharField(max_length=200, null=True, blank=True)
    icon        = models.CharField(max_length=10, null=True, blank=True)  # emoji
    sort        = models.IntegerField(default=0)
    active      = models.BooleanField(default=True)
    created_at  = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'resource_link'


# ── Feedback ──────────────────────────────────────────────────────────────────

class Feedback(models.Model):
    """User feedback from the in-app widget, scored for sentiment."""
    user       = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    page       = models.CharField(max_length=50, null=True, blank=True)
    rating     = models.IntegerField()  # 1..5
    comment    = models.CharField(max_length=500, null=True, blank=True)
    sentiment  = models.FloatField(null=True, blank=True)   # -1..1 word-list score
    resolved   = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=datetime.utcnow, db_index=True)

    class Meta:
        db_table = 'feedback'


# ── Paper Trade ───────────────────────────────────────────────────────────────

class PaperTrade(models.Model):
    """One simulated (VIRTUAL money) trade in the platform paper trading engine.
    Append-only: rows are inserted at open, and exit fields are written once at close.
    user_id NULL = platform demo stream; a real id = that user's isolated portfolio.
    """
    user           = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, db_index=True, db_column='user_id')
    strategy       = models.CharField(max_length=20, db_index=True)    # 'ml_ensemble' | 'alpha_rules'
    model          = models.CharField(max_length=40, null=True, blank=True)
    ticker         = models.CharField(max_length=12, db_index=True)
    asset_class    = models.CharField(max_length=12)                    # equity|etf|index|crypto|forex|commodity
    side           = models.CharField(max_length=5)                     # LONG | SHORT
    qty            = models.FloatField()
    entry_time     = models.DateTimeField()
    entry_price    = models.FloatField()
    entry_mkt      = models.FloatField()
    price_source   = models.CharField(max_length=20, null=True, blank=True)
    stop_price     = models.FloatField()
    target_price   = models.FloatField()
    max_hold_hours = models.IntegerField()
    confidence     = models.FloatField(null=True, blank=True)
    rationale      = models.CharField(max_length=300, null=True, blank=True)
    commission     = models.FloatField(default=0.0)
    status         = models.CharField(max_length=8, default='open', db_index=True)
    exit_time      = models.DateTimeField(null=True, blank=True)
    exit_price     = models.FloatField(null=True, blank=True)
    exit_mkt       = models.FloatField(null=True, blank=True)
    exit_reason    = models.CharField(max_length=12, null=True, blank=True)  # target|stop|reversal|timeout|manual
    pnl            = models.FloatField(null=True, blank=True)
    created_at     = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'paper_trade'


# ── Paper Trade Event ─────────────────────────────────────────────────────────

class PaperTradeEvent(models.Model):
    """Append-only audit trail for the paper trading engine."""
    user       = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, db_index=True, db_column='user_id')
    trade      = models.ForeignKey(PaperTrade, on_delete=models.SET_NULL, null=True, blank=True, db_index=True, db_column='trade_id')
    event      = models.CharField(max_length=20)   # open|close|reject|breaker|toggle|config
    detail     = models.CharField(max_length=400, null=True, blank=True)
    created_at = models.DateTimeField(default=datetime.utcnow, db_index=True)

    class Meta:
        db_table = 'paper_trade_event'


# ── Paper Equity Snapshot ─────────────────────────────────────────────────────

class PaperEquitySnapshot(models.Model):
    """Mark-to-market VIRTUAL equity per strategy, taken every engine cycle.
    user_id NULL = platform demo stream; a real id = that user's equity curve.
    """
    user       = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, db_index=True, db_column='user_id')
    strategy   = models.CharField(max_length=20, db_index=True)
    equity     = models.FloatField()
    open_count = models.IntegerField(default=0)
    taken_at   = models.DateTimeField(default=datetime.utcnow, db_index=True)

    class Meta:
        db_table = 'paper_equity_snapshot'


# ── User Preferences ──────────────────────────────────────────────────────────

class UserPreferences(models.Model):
    user                 = models.OneToOneField('users.User', on_delete=models.CASCADE, db_column='user_id')
    digest_enabled       = models.BooleanField(default=False)
    theme                = models.CharField(max_length=10, default='dark')
    default_ticker       = models.CharField(max_length=12, default='AAPL')
    timezone             = models.CharField(max_length=50, default='UTC')
    risk_intro_seen      = models.BooleanField(default=False)
    usage_notice_enabled = models.BooleanField(default=True)

    class Meta:
        db_table = 'user_preferences'
        verbose_name = 'User Preferences'
        verbose_name_plural = 'User Preferences Records'


# ── User Portfolio ────────────────────────────────────────────────────────────

class UserPortfolio(models.Model):
    """Tracks user portfolio snapshots for performance history."""
    user           = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    equity         = models.FloatField()
    balance        = models.FloatField()
    open_positions = models.IntegerField(default=0)
    snapshot_at    = models.DateTimeField(default=datetime.utcnow, db_index=True)

    class Meta:
        db_table = 'user_portfolio'


# ── User Achievement ──────────────────────────────────────────────────────────

class UserAchievement(models.Model):
    """Tracks achievements/badges earned by users."""
    user           = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    achievement_id = models.CharField(max_length=32)
    earned_at      = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'user_achievement'
        unique_together = [('user', 'achievement_id')]


# ── Competition Model ─────────────────────────────────────────────────────────

class CompetitionModel(models.Model):
    """Paper trading competition."""
    name            = models.CharField(max_length=100)
    start_date      = models.DateField()
    end_date        = models.DateField()
    initial_balance = models.FloatField(default=10000.0)
    status          = models.CharField(max_length=12, default='upcoming')  # upcoming|active|completed
    created_by      = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, db_column='created_by')
    created_at      = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'competition_model'


# ── Competition Entry ─────────────────────────────────────────────────────────

class CompetitionEntry(models.Model):
    """User entry in a competition."""
    competition    = models.ForeignKey(CompetitionModel, on_delete=models.CASCADE, db_column='competition_id')
    user           = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    start_equity   = models.FloatField()
    current_equity = models.FloatField()
    joined_at      = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'competition_entry'
        unique_together = [('competition', 'user')]
        verbose_name = 'Competition Entry'
        verbose_name_plural = 'Competition Entries'


# ── Model Version ─────────────────────────────────────────────────────────────

class ModelVersion(models.Model):
    """Tracks trained model versions for reproducibility."""
    ticker        = models.CharField(max_length=12, db_index=True)
    model_type    = models.CharField(max_length=20)  # lr, rf, xgb, lgb, lstm, stacking
    version       = models.CharField(max_length=16)
    file_path     = models.CharField(max_length=256)
    metrics_json  = models.TextField(null=True, blank=True)
    feature_hash  = models.CharField(max_length=64, null=True, blank=True)
    data_hash     = models.CharField(max_length=64, null=True, blank=True)
    trained_at    = models.DateTimeField(default=datetime.utcnow)
    is_active     = models.BooleanField(default=True)

    class Meta:
        db_table = 'model_version'
        unique_together = [('ticker', 'model_type', 'version')]


# ── Trading Bot ───────────────────────────────────────────────────────────────

class TradingBot(models.Model):
    slug        = models.CharField(max_length=32, unique=True)
    name        = models.CharField(max_length=100)
    description = models.CharField(max_length=300, null=True, blank=True)
    asset_class = models.CharField(max_length=20, null=True, blank=True)  # "Stocks", "Crypto", etc.
    interval    = models.CharField(max_length=10, null=True, blank=True)  # "1d", "1h"
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'trading_bot'

    def __str__(self):
        return self.name


# ── User Bot Subscription ─────────────────────────────────────────────────────

class UserBotSubscription(models.Model):
    user               = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    bot                = models.ForeignKey(TradingBot, on_delete=models.CASCADE, db_column='bot_id')
    auto_trade_enabled = models.BooleanField(default=False)
    auto_trade_mode    = models.CharField(max_length=20, default='paper')
    max_risk_pct       = models.FloatField(default=1.0)
    created_at         = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'user_bot_subscription'
        unique_together = [('user', 'bot')]


# ── User Paper Account ────────────────────────────────────────────────────────

class UserPaperAccount(models.Model):
    user             = models.OneToOneField('users.User', on_delete=models.CASCADE, db_column='user_id')
    starting_balance = models.FloatField(default=10000.0)
    balance          = models.FloatField(default=10000.0)
    equity           = models.FloatField(default=10000.0)
    created_at       = models.DateTimeField(default=datetime.utcnow)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_paper_account'


# ── User Paper Order ──────────────────────────────────────────────────────────

class UserPaperOrder(models.Model):
    account      = models.ForeignKey(UserPaperAccount, on_delete=models.CASCADE, db_column='account_id')
    ticker       = models.CharField(max_length=12)
    order_type   = models.CharField(max_length=10)  # 'market', 'limit', 'stop'
    side         = models.CharField(max_length=5)   # 'buy', 'sell'
    quantity     = models.FloatField()
    target_price = models.FloatField(null=True, blank=True)  # for limit/stop orders
    sl           = models.FloatField(null=True, blank=True)
    tp           = models.FloatField(null=True, blank=True)
    status       = models.CharField(max_length=15, default='pending')  # 'pending', 'filled', 'canceled'
    created_at   = models.DateTimeField(default=datetime.utcnow)
    filled_at    = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'user_paper_order'


# ── User Paper Position ───────────────────────────────────────────────────────

class UserPaperPosition(models.Model):
    account       = models.ForeignKey(UserPaperAccount, on_delete=models.CASCADE, db_column='account_id')
    ticker        = models.CharField(max_length=12)
    side          = models.CharField(max_length=5)    # 'buy', 'sell'
    quantity      = models.FloatField()
    entry_price   = models.FloatField()
    current_price = models.FloatField()
    sl            = models.FloatField(null=True, blank=True)
    tp            = models.FloatField(null=True, blank=True)
    realized_pnl  = models.FloatField(default=0.0)
    status        = models.CharField(max_length=10, default='open')  # 'open', 'closed'
    opened_at     = models.DateTimeField(default=datetime.utcnow)
    closed_at     = models.DateTimeField(null=True, blank=True)


# ── Institutional Smart Order Execution (JPMorgan DNA Architecture) ───────────

class SmartOrderExecution(models.Model):
    user               = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    ticker             = models.CharField(max_length=20)
    side               = models.CharField(max_length=10) # BUY or SELL
    total_quantity     = models.FloatField()
    executed_quantity  = models.FloatField(default=0.0)
    execution_style    = models.CharField(max_length=20, default='twap') # twap, vwap, iceberg
    execution_mode     = models.CharField(max_length=20, default='PASSIVE_LIMIT') # PASSIVE_LIMIT or AGGRESSIVE_TAKER
    benchmark_price    = models.FloatField() # Arrival price
    avg_fill_price     = models.FloatField(default=0.0)
    slippage_saved_usd = models.FloatField(default=0.0)
    status             = models.CharField(max_length=20, default='executing') # executing, completed, cancelled
    created_at         = models.DateTimeField(default=datetime.utcnow)
    completed_at       = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'smart_order_executions'


# Alias SystemConfig to AppSetting for backward compatibility
SystemConfig = AppSetting


# ── Portfolio Management Service Models ───────────────────────────────────────

class Portfolio(models.Model):
    owner                     = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='portfolios', db_column='owner_id')
    name                      = models.CharField(max_length=100, default='New Portfolio')
    description               = models.TextField(null=True, blank=True)
    base_currency             = models.CharField(max_length=10, default='USD')
    initial_balance           = models.FloatField(default=10000.0)
    current_balance           = models.FloatField(default=10000.0)
    total_equity              = models.FloatField(default=10000.0)
    total_profit_loss         = models.FloatField(default=0.0)
    realized_profit_loss      = models.FloatField(default=0.0)
    unrealized_profit_loss    = models.FloatField(default=0.0)
    total_return_percentage   = models.FloatField(default=0.0)
    status                    = models.CharField(max_length=20, default='active') # active, archived
    created_at                = models.DateTimeField(default=datetime.utcnow)
    updated_at                = models.DateTimeField(default=datetime.utcnow)
    archived_at               = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'portfolio'
        verbose_name = 'User Investment Portfolio'
        verbose_name_plural = 'User Investment Portfolios'

    def __str__(self):
        return f"{self.name} ({self.owner.email})"


class Holding(models.Model):
    portfolio                 = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='holdings')
    symbol                    = models.CharField(max_length=20, default='')
    asset_class               = models.CharField(max_length=20, default='stock') # stock, crypto, forex
    quantity                  = models.FloatField(default=0.0)
    average_entry_price       = models.FloatField(default=0.0)
    current_market_price      = models.FloatField(default=0.0)
    market_value              = models.FloatField(default=0.0)
    unrealized_profit_loss    = models.FloatField(default=0.0)
    allocation_percentage     = models.FloatField(default=0.0)
    last_updated              = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'portfolio_holding'
        unique_together = [('portfolio', 'symbol')]
        verbose_name = 'Portfolio Holding'
        verbose_name_plural = 'Portfolio Holdings'

    def __str__(self):
        return f"{self.symbol} in {self.portfolio.name}"


class Transaction(models.Model):
    transaction_id            = models.CharField(max_length=64, unique=True, default=uuid.uuid4)
    portfolio                 = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='transactions')
    transaction_type          = models.CharField(max_length=20, default='Deposit') # Deposit, Withdrawal, Buy, Sell, Dividend, Fee, Interest, Adjustment
    asset                     = models.CharField(max_length=20, null=True, blank=True)
    quantity                  = models.FloatField(default=0.0)
    execution_price           = models.FloatField(default=0.0)
    total_amount              = models.FloatField(default=0.0)
    fees                      = models.FloatField(default=0.0)
    timestamp                 = models.DateTimeField(default=datetime.utcnow)
    notes                     = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'portfolio_transaction'
        verbose_name = 'Portfolio Transaction'
        verbose_name_plural = 'Portfolio Transactions'

    def __str__(self):
        return f"{self.transaction_type} - {self.asset} in {self.portfolio.name}"


class Watchlist(models.Model):
    user                      = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='watchlists', db_column='user_id')
    name                      = models.CharField(max_length=100, default='My Watchlist')
    symbols                   = models.JSONField(default=list) # List of symbols e.g. ["AAPL", "BTC", "EURUSD"]
    created_at                = models.DateTimeField(default=datetime.utcnow)

    class Meta:
        db_table = 'portfolio_watchlist'
        verbose_name = 'User Watchlist'
        verbose_name_plural = 'User Watchlists'

    def __str__(self):
        return f"{self.name} ({self.user.email})"


