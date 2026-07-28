from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from core.admin_site import enterprise_admin_site
from core.mixins import AuditLoggingAdminMixin
from .models import (
    User, PredictionHistory, Payment, TradingBot, WatchlistItem,
    PriceAlert, PortfolioPosition, ApiKey, PredictionAccuracy,
    PasswordResetToken, TelegramConfig, WhatsappConfig, Notification,
    TradeJournal, DiscordConfig, GiftCode, UserWebhook, ActivityLog,
    TwoFactorAuth, AdminAuditLog, AppSetting, TickerConfig, Broadcast,
    ErrorLog, PythFeed, ResourceLink, Feedback, PaperTrade, PaperTradeEvent,
    PaperEquitySnapshot, UserPreferences, UserPortfolio,
    UserAchievement, CompetitionModel, CompetitionEntry, ModelVersion,
    UserBotSubscription, UserPaperAccount, UserPaperOrder, UserPaperPosition,
    Portfolio, Holding, Transaction, Watchlist, SmartOrderExecution
)

# ── Mixin for query optimizations ─────────────────────────────────────────────
class OptimizeQueryMixin:
    select_related_fields = []
    prefetch_related_fields = []

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if self.select_related_fields:
            qs = qs.select_related(*self.select_related_fields)
        if self.prefetch_related_fields:
            qs = qs.prefetch_related(*self.prefetch_related_fields)
        return qs

# ── 1. User & Portfolio ModelAdmins ───────────────────────────────────────────
class UserAdmin(AuditLoggingAdminMixin, BaseUserAdmin):
    list_display   = ['username', 'email', 'role', 'plan', 'status', 'created_at']
    list_filter    = ['role', 'plan', 'status', 'email_verified']
    search_fields  = ['username', 'email']
    ordering       = ['-created_at']
    fieldsets      = None
    add_fieldsets  = (
        (None, {'fields': ('username', 'email', 'password1', 'password2')}),
    )
    actions = ['suspend_users', 'activate_users']

    @admin.action(description="Suspend selected operator/user accounts")
    def suspend_users(self, request, queryset):
        rows = queryset.update(status='inactive')
        self.message_user(request, f"Successfully suspended {rows} user accounts.")

    @admin.action(description="Reactivate selected user accounts")
    def activate_users(self, request, queryset):
        rows = queryset.update(status='active')
        self.message_user(request, f"Successfully reactivated {rows} user accounts.")

class PortfolioAdmin(AuditLoggingAdminMixin, OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'owner', 'name', 'base_currency', 'current_balance', 'total_equity', 'status', 'created_at')
    list_filter = ('base_currency', 'status', 'created_at')
    search_fields = ('owner__username', 'owner__email', 'name')
    ordering = ('-created_at',)
    select_related_fields = ['owner']

class HoldingAdmin(AuditLoggingAdminMixin, OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'portfolio', 'symbol', 'asset_class', 'quantity', 'average_entry_price', 'market_value', 'last_updated')
    list_filter = ('asset_class', 'last_updated')
    search_fields = ('portfolio__name', 'symbol')
    select_related_fields = ['portfolio']

class TransactionAdmin(AuditLoggingAdminMixin, OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('transaction_id', 'portfolio', 'transaction_type', 'asset', 'quantity', 'execution_price', 'total_amount', 'timestamp')
    list_filter = ('transaction_type', 'timestamp')
    search_fields = ('portfolio__name', 'asset', 'transaction_id')
    ordering = ('-timestamp',)
    select_related_fields = ['portfolio']

class WatchlistAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'user__email', 'name')
    select_related_fields = ['user']

# ── 2. Auxiliary Trading & Execution ModelAdmins ──────────────────────────────
class TradingBotAdmin(admin.ModelAdmin):
    list_display = ('id', 'slug', 'name', 'asset_class', 'interval', 'is_active', 'created_at')
    list_filter = ('asset_class', 'interval', 'is_active')
    search_fields = ('slug', 'name')

class UserPaperAccountAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'starting_balance', 'balance', 'equity', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email')
    select_related_fields = ['user']

class UserPaperOrderAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'account', 'ticker', 'side', 'order_type', 'quantity', 'target_price', 'status', 'created_at')
    list_filter = ('side', 'order_type', 'status', 'created_at')
    search_fields = ('account__user__username', 'ticker')
    select_related_fields = ['account', 'account__user']

class UserPaperPositionAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'account', 'ticker', 'side', 'entry_price', 'quantity', 'status', 'opened_at')
    list_filter = ('side', 'status', 'opened_at')
    search_fields = ('account__user__username', 'ticker')
    select_related_fields = ['account', 'account__user']

class PaperTradeAdmin(AuditLoggingAdminMixin, OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'side', 'qty', 'entry_price', 'pnl', 'status', 'created_at')
    list_filter = ('side', 'status', 'created_at')
    search_fields = ('user__username', 'ticker')
    select_related_fields = ['user']
    actions = ['force_close_trades']

    @admin.action(description="Force-close selected simulated positions")
    def force_close_trades(self, request, queryset):
        rows = queryset.update(status='closed')
        self.message_user(request, f"Successfully forced closed {rows} paper positions.")

class PaperTradeEventAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'trade', 'event', 'detail', 'created_at')
    list_filter = ('event', 'created_at')
    search_fields = ('user__username', 'detail')
    select_related_fields = ['user', 'trade']

class PaperEquitySnapshotAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'strategy', 'equity', 'open_count', 'taken_at')
    list_filter = ('strategy', 'taken_at')
    search_fields = ('user__username', 'user__email')
    select_related_fields = ['user']

# ── 3. Market Intelligence ModelAdmins ────────────────────────────────────────
class WatchlistItemAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('user__username', 'ticker')
    select_related_fields = ['user']

class PriceAlertAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'price', 'direction', 'triggered', 'created_at')
    list_filter = ('direction', 'triggered', 'created_at')
    search_fields = ('user__username', 'ticker')
    select_related_fields = ['user']

class TickerConfigAdmin(admin.ModelAdmin):
    list_display = ('id', 'symbol', 'name', 'enabled', 'added_at')
    list_filter = ('enabled', 'added_at')
    search_fields = ('symbol', 'name')

class PythFeedAdmin(admin.ModelAdmin):
    list_display = ('id', 'symbol', 'feed_id', 'pyth_symbol', 'active', 'updated_at')
    list_filter = ('active', 'updated_at')
    search_fields = ('symbol', 'feed_id', 'pyth_symbol')

class ResourceLinkAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'url', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'url')

# ── 4. Machine Learning & Forecasting ModelAdmins ─────────────────────────────
class ModelVersionAdmin(AuditLoggingAdminMixin, admin.ModelAdmin):
    list_display = ('version', 'ticker', 'model_type', 'is_active', 'trained_at')
    list_filter = ('model_type', 'is_active', 'trained_at')
    search_fields = ('version_tag', 'name')
    actions = ['promote_to_production']

    @admin.action(description="Promote model version to production default")
    def promote_to_production(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, "Selected model versions marked active.")

class PredictionHistoryAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'interval', 'direction', 'confidence', 'predicted_at')
    list_filter = ('interval', 'direction', 'predicted_at')
    search_fields = ('user__username', 'ticker')
    select_related_fields = ['user']

class PredictionAccuracyAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'prediction', 'actual_price', 'direction_ok', 'pct_error', 'checked_at')
    list_filter = ('direction_ok', 'checked_at')
    select_related_fields = ['prediction']

# ── 5. Notifications & Alerts ModelAdmins ─────────────────────────────────────
class NotificationAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'type', 'read', 'created_at')
    list_filter = ('type', 'read', 'created_at')
    search_fields = ('user__username', 'title')
    select_related_fields = ['user']

class BroadcastAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'segment', 'channel', 'sent_count', 'created_at')
    list_filter = ('segment', 'channel', 'created_at')
    search_fields = ('title', 'body')

class TelegramConfigAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'chat_id', 'enabled')
    list_filter = ('enabled',)
    search_fields = ('user__username', 'chat_id')
    select_related_fields = ['user']

class WhatsappConfigAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'phone_number', 'enabled')
    list_filter = ('enabled',)
    search_fields = ('user__username', 'phone_number')
    select_related_fields = ['user']

class DiscordConfigAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'webhook_url', 'enabled', 'created_at')
    list_filter = ('enabled', 'created_at')
    search_fields = ('user__username', 'webhook_url')
    select_related_fields = ['user']

class UserWebhookAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'url', 'active', 'created_at')
    list_filter = ('active', 'created_at')
    search_fields = ('user__username', 'name')
    select_related_fields = ['user']

# ── 6. Billing & System Configurations ────────────────────────────────────────
class PaymentAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'currency', 'status', 'provider', 'reference', 'created_at')
    list_filter = ('status', 'provider', 'currency', 'created_at')
    search_fields = ('user__username', 'reference')
    select_related_fields = ['user']

class GiftCodeAdmin(AuditLoggingAdminMixin, OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('code', 'days', 'used', 'used_by', 'created_at', 'used_at')
    list_filter = ('used', 'created_at', 'used_at')
    search_fields = ('code', 'note')
    select_related_fields = ['used_by']

class AppSettingAdmin(AuditLoggingAdminMixin, admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_at')
    search_fields = ('key',)

# ── 7. Audit Logging & Compliance ─────────────────────────────────────────────
class ActivityLogAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'action', 'ip', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__username', 'action', 'ip')
    select_related_fields = ['user']

class AdminAuditLogAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'admin', 'action', 'target_type', 'target_id', 'detail', 'ip', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('admin__username', 'target_type', 'detail')
    select_related_fields = ['admin']

class ErrorLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'severity', 'endpoint', 'method', 'message', 'created_at')
    list_filter = ('severity', 'method', 'created_at')
    search_fields = ('message', 'trace', 'endpoint', 'ip')

# ── 8. Remaining Model Registrations ──────────────────────────────────────────
class TwoFactorAuthAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'enabled')
    list_filter = ('enabled',)
    select_related_fields = ['user']

class FeedbackAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'page', 'comment', 'rating', 'sentiment', 'resolved', 'created_at')
    list_filter = ('page', 'rating', 'resolved', 'created_at')
    search_fields = ('user__username', 'text')
    select_related_fields = ['user']

class UserPreferencesAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'theme', 'timezone', 'digest_enabled')
    select_related_fields = ['user']

class UserPortfolioAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'equity', 'balance', 'open_positions', 'snapshot_at')
    select_related_fields = ['user']

class UserAchievementAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'achievement_id', 'earned_at')
    list_filter = ('achievement_id', 'earned_at')
    select_related_fields = ['user']

class CompetitionModelAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'name', 'created_by', 'status', 'start_date', 'end_date', 'created_at')
    list_filter = ('status', 'start_date', 'end_date')
    select_related_fields = ['created_by']

class CompetitionEntryAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'competition', 'user', 'start_equity', 'current_equity', 'joined_at')
    list_filter = ('joined_at',)
    select_related_fields = ['competition', 'user']

class UserBotSubscriptionAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'bot', 'auto_trade_enabled', 'auto_trade_mode', 'created_at')
    list_filter = ('auto_trade_enabled', 'auto_trade_mode', 'created_at')
    select_related_fields = ['user', 'bot']

class SmartOrderExecutionAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'side', 'total_quantity', 'executed_quantity', 'execution_style', 'execution_mode', 'benchmark_price', 'avg_fill_price', 'status', 'created_at')
    list_filter = ('side', 'execution_style', 'execution_mode', 'status', 'created_at')
    search_fields = ('user__username', 'ticker')
    select_related_fields = ['user']

class TradeJournalAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'created_at')
    select_related_fields = ['user']

class PasswordResetTokenAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'expires_at', 'used')
    select_related_fields = ['user']

# Register ALL custom model admins to the EnterpriseAdminSite
enterprise_register_map = {
    User: UserAdmin,
    Portfolio: PortfolioAdmin,
    Holding: HoldingAdmin,
    Transaction: TransactionAdmin,
    Watchlist: WatchlistAdmin,
    TradingBot: TradingBotAdmin,
    UserPaperAccount: UserPaperAccountAdmin,
    UserPaperOrder: UserPaperOrderAdmin,
    UserPaperPosition: UserPaperPositionAdmin,
    PaperTrade: PaperTradeAdmin,
    PaperTradeEvent: PaperTradeEventAdmin,
    PaperEquitySnapshot: PaperEquitySnapshotAdmin,
    WatchlistItem: WatchlistItemAdmin,
    PriceAlert: PriceAlertAdmin,
    TickerConfig: TickerConfigAdmin,
    PythFeed: PythFeedAdmin,
    ResourceLink: ResourceLinkAdmin,
    ModelVersion: ModelVersionAdmin,
    PredictionHistory: PredictionHistoryAdmin,
    PredictionAccuracy: PredictionAccuracyAdmin,
    Notification: NotificationAdmin,
    Broadcast: BroadcastAdmin,
    TelegramConfig: TelegramConfigAdmin,
    WhatsappConfig: WhatsappConfigAdmin,
    DiscordConfig: DiscordConfigAdmin,
    UserWebhook: UserWebhookAdmin,
    Payment: PaymentAdmin,
    GiftCode: GiftCodeAdmin,
    AppSetting: AppSettingAdmin,
    ActivityLog: ActivityLogAdmin,
    AdminAuditLog: AdminAuditLogAdmin,
    ErrorLog: ErrorLogAdmin,
    TwoFactorAuth: TwoFactorAuthAdmin,
    Feedback: FeedbackAdmin,
    UserPreferences: UserPreferencesAdmin,
    UserPortfolio: UserPortfolioAdmin,
    UserAchievement: UserAchievementAdmin,
    CompetitionModel: CompetitionModelAdmin,
    CompetitionEntry: CompetitionEntryAdmin,
    UserBotSubscription: UserBotSubscriptionAdmin,
    SmartOrderExecution: SmartOrderExecutionAdmin,
    TradeJournal: TradeJournalAdmin,
    PasswordResetToken: PasswordResetTokenAdmin
}

for model_cls, admin_cls in enterprise_register_map.items():
    try:
        enterprise_admin_site.register(model_cls, admin_cls)
    except admin.sites.AlreadyRegistered:
        pass

# Fallback compatibility with standard admin site in case of raw redirects
for model_cls, admin_cls in enterprise_register_map.items():
    try:
        admin.site.unregister(model_cls)
    except admin.sites.NotRegistered:
        pass
    try:
        admin.site.register(model_cls, admin_cls)
    except admin.sites.AlreadyRegistered:
        pass
