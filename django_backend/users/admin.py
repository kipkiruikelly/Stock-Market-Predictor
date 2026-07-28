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
class TradingBotAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'strategy', 'status', 'is_active', 'created_at')
    list_filter = ('strategy', 'status', 'is_active')
    search_fields = ('user__username', 'name')
    select_related_fields = ['user']

class UserPaperAccountAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'balance', 'margin', 'equity', 'currency', 'status', 'created_at')
    list_filter = ('currency', 'status')
    search_fields = ('user__username', 'user__email')
    select_related_fields = ['user']

class UserPaperOrderAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'account', 'ticker', 'side', 'type', 'quantity', 'price', 'status', 'created_at')
    list_filter = ('side', 'type', 'status', 'created_at')
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
    list_display = ('id', 'user', 'trade', 'event_type', 'details', 'created_at')
    list_filter = ('event_type', 'created_at')
    search_fields = ('user__username', 'details')
    select_related_fields = ['user', 'trade']

class PaperEquitySnapshotAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'balance', 'equity', 'timestamp')
    list_filter = ('timestamp',)
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
    list_display = ('ticker', 'name', 'asset_class', 'is_active', 'last_polled')
    list_filter = ('asset_class', 'is_active')
    search_fields = ('ticker', 'name')

class PythFeedAdmin(admin.ModelAdmin):
    list_display = ('feed_id', 'ticker', 'price_account', 'exponent', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('ticker', 'feed_id')

class ResourceLinkAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'url', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'url')

# ── 4. Machine Learning & Forecasting ModelAdmins ─────────────────────────────
class ModelVersionAdmin(AuditLoggingAdminMixin, admin.ModelAdmin):
    list_display = ('version_tag', 'name', 'framework', 'accuracy', 'is_active', 'trained_at')
    list_filter = ('framework', 'is_active', 'trained_at')
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
    list_display = ('id', 'user', 'title', 'channel', 'status', 'created_at')
    list_filter = ('channel', 'status', 'created_at')
    search_fields = ('user__username', 'title')
    select_related_fields = ['user']

class BroadcastAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'target_audience', 'sent', 'sent_at')
    list_filter = ('target_audience', 'sent', 'sent_at')
    search_fields = ('title', 'message')

class TelegramConfigAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'chat_id', 'is_active', 'updated_at')
    list_filter = ('is_active', 'updated_at')
    search_fields = ('user__username', 'chat_id')
    select_related_fields = ['user']

class WhatsappConfigAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'phone_number', 'is_active', 'updated_at')
    list_filter = ('is_active', 'updated_at')
    search_fields = ('user__username', 'phone_number')
    select_related_fields = ['user']

class DiscordConfigAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'webhook_url', 'is_active', 'updated_at')
    list_filter = ('is_active', 'updated_at')
    search_fields = ('user__username', 'webhook_url')
    select_related_fields = ['user']

class UserWebhookAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'url', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__username', 'name')
    select_related_fields = ['user']

# ── 6. Billing & System Configurations ────────────────────────────────────────
class PaymentAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'currency', 'status', 'provider', 'transaction_id', 'created_at')
    list_filter = ('status', 'provider', 'currency', 'created_at')
    search_fields = ('user__username', 'transaction_id')
    select_related_fields = ['user']

class GiftCodeAdmin(AuditLoggingAdminMixin, OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('code', 'discount_pct', 'max_uses', 'times_used', 'is_active', 'used_by')
    list_filter = ('is_active', 'times_used')
    search_fields = ('code',)
    select_related_fields = ['used_by']

class AppSettingAdmin(AuditLoggingAdminMixin, admin.ModelAdmin):
    list_display = ('key', 'value', 'description', 'updated_at')
    search_fields = ('key', 'description')

# ── 7. Audit Logging & Compliance ─────────────────────────────────────────────
class ActivityLogAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'action', 'ip_address', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__username', 'action', 'ip_address')
    select_related_fields = ['user']

class AdminAuditLogAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'admin', 'action', 'target_type', 'target_id', 'detail', 'ip', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('admin__username', 'target_type', 'detail')
    select_related_fields = ['admin']

class ErrorLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'exception_type', 'message', 'module', 'resolved', 'timestamp')
    list_filter = ('exception_type', 'module', 'resolved', 'timestamp')
    search_fields = ('exception_type', 'message', 'stack_trace')

# ── 8. Remaining Model Registrations ──────────────────────────────────────────
class TwoFactorAuthAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'is_enabled', 'updated_at')
    list_filter = ('is_enabled',)
    select_related_fields = ['user']

class FeedbackAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'category', 'text', 'rating', 'created_at')
    list_filter = ('category', 'rating', 'created_at')
    search_fields = ('user__username', 'text')
    select_related_fields = ['user']

class UserPreferencesAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'theme', 'notify_level')
    select_related_fields = ['user']

class UserPortfolioAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at')
    select_related_fields = ['user']

class UserAchievementAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'achievement_name', 'unlocked_at')
    list_filter = ('achievement_name', 'unlocked_at')
    select_related_fields = ['user']

class CompetitionModelAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'name', 'created_by', 'is_active', 'end_date')
    list_filter = ('is_active', 'end_date')
    select_related_fields = ['created_by']

class CompetitionEntryAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'competition', 'user', 'score', 'submitted_at')
    list_filter = ('submitted_at',)
    select_related_fields = ['competition', 'user']

class UserBotSubscriptionAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'bot', 'is_active', 'subscribed_at')
    list_filter = ('is_active', 'subscribed_at')
    select_related_fields = ['user', 'bot']

class SmartOrderExecutionAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'bot', 'execution_type', 'target_qty', 'filled_qty', 'status', 'created_at')
    list_filter = ('execution_type', 'status', 'created_at')
    select_related_fields = ['bot']

class TradeJournalAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'created_at')
    select_related_fields = ['user']

class PasswordResetTokenAdmin(OptimizeQueryMixin, admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at')
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
