from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
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
)

# Customize Admin Site Headers for an Enterprise Look
admin.site.site_header = "BullLogic Enterprise Administration Console"
admin.site.site_title = "BullLogic Enterprise Admin"
admin.site.index_title = "Triple-Fusion-Engine v3.0 Master Console"

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display   = ['username', 'email', 'role', 'plan', 'status', 'created_at']
    list_filter    = ['role', 'plan', 'status', 'email_verified']
    search_fields  = ['username', 'email']
    ordering       = ['-created_at']
    fieldsets      = None
    add_fieldsets  = (
        (None, {'fields': ('username', 'email', 'password1', 'password2')}),
    )

@admin.register(PredictionHistory)
class PredictionHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'interval', 'current_price', 'direction', 'confidence', 'predicted_at')
    list_filter = ('ticker', 'interval', 'direction', 'predicted_at')
    search_fields = ('user__username', 'ticker', 'direction')
    ordering = ('-predicted_at',)
    date_hierarchy = 'predicted_at'
    list_per_page = 25
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(PredictionAccuracy)
class PredictionAccuracyAdmin(admin.ModelAdmin):
    list_display = ('id', 'prediction', 'actual_price', 'direction_ok', 'pct_error', 'checked_at')
    list_filter = ('direction_ok', 'checked_at')
    search_fields = ('prediction__ticker', 'prediction__user__username')
    ordering = ('-checked_at',)
    list_per_page = 25
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('prediction', 'prediction__user')

@admin.register(WatchlistItem)
class WatchlistItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'added_at')
    list_filter = ('ticker', 'added_at')
    search_fields = ('user__username', 'ticker')
    ordering = ('-added_at',)
    list_per_page = 25
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(PriceAlert)
class PriceAlertAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'target_price', 'condition', 'triggered', 'created_at')
    list_filter = ('ticker', 'condition', 'triggered', 'created_at')
    search_fields = ('user__username', 'ticker')
    ordering = ('-created_at',)
    list_per_page = 25
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(PortfolioPosition)
class PortfolioPositionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'shares', 'avg_price', 'created_at')
    list_filter = ('ticker', 'created_at')
    search_fields = ('user__username', 'ticker')
    ordering = ('-created_at',)
    list_per_page = 25
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(ApiKey)
class ApiKeyAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'active', 'created_at')
    list_filter = ('active', 'created_at')
    search_fields = ('user__username', 'name')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'token', 'expires_at', 'used')
    list_filter = ('used', 'expires_at')
    search_fields = ('user__username', 'token')
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(TelegramConfig)
class TelegramConfigAdmin(admin.ModelAdmin):
    list_display = ('id', 'chat_id', 'username', 'active', 'updated_at')
    list_filter = ('active', 'updated_at')
    search_fields = ('username', 'chat_id')

@admin.register(WhatsappConfig)
class WhatsappConfigAdmin(admin.ModelAdmin):
    list_display = ('id', 'phone_number', 'active', 'updated_at')
    list_filter = ('active', 'updated_at')
    search_fields = ('phone_number',)

@admin.register(DiscordConfig)
class DiscordConfigAdmin(admin.ModelAdmin):
    list_display = ('id', 'webhook_url', 'active', 'updated_at')
    list_filter = ('active', 'updated_at')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'read', 'created_at')
    list_filter = ('read', 'created_at')
    search_fields = ('user__username', 'title')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(TradeJournal)
class TradeJournalAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'action', 'profit_loss', 'created_at')
    list_filter = ('ticker', 'action', 'created_at')
    search_fields = ('user__username', 'ticker', 'notes')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'currency', 'status', 'provider', 'created_at')
    list_filter = ('status', 'provider', 'currency', 'created_at')
    search_fields = ('user__username', 'transaction_id')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(GiftCode)
class GiftCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'amount', 'active', 'created_by', 'redeemed_by', 'used_at')
    list_filter = ('active', 'used_at')
    search_fields = ('code', 'created_by__username', 'redeemed_by__username')
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by', 'redeemed_by')

@admin.register(UserWebhook)
class UserWebhookAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'url', 'active', 'fire_count', 'last_fired')
    list_filter = ('active', 'last_fired')
    search_fields = ('user__username', 'name', 'url')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'action', 'ip', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__username', 'action', 'detail', 'ip')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(TwoFactorAuth)
class TwoFactorAuthAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'enabled', 'method', 'updated_at')
    list_filter = ('enabled', 'method', 'updated_at')
    search_fields = ('user__username',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'admin_user', 'action', 'table_name', 'row_id', 'created_at')
    list_filter = ('table_name', 'action', 'created_at')
    search_fields = ('admin_user__username', 'table_name', 'action', 'details')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('admin_user')

@admin.register(AppSetting)
class AppSettingAdmin(admin.ModelAdmin):
    list_display = ('id', 'key', 'value', 'updated_at')
    search_fields = ('key', 'value')

@admin.register(TickerConfig)
class TickerConfigAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticker', 'name', 'active', 'last_synced')
    list_filter = ('active', 'last_synced')
    search_fields = ('ticker', 'name')

@admin.register(Broadcast)
class BroadcastAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'target_audience', 'sent_at')
    list_filter = ('target_audience', 'sent_at')
    search_fields = ('title', 'message')

@admin.register(ErrorLog)
class ErrorLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'service', 'severity', 'message_snippet', 'created_at')
    list_filter = ('service', 'severity', 'created_at')
    search_fields = ('service', 'message', 'traceback')
    ordering = ('-created_at',)
    def message_snippet(self, obj):
        return obj.message[:80] + '...' if len(obj.message) > 80 else obj.message
    message_snippet.short_description = 'Message'

@admin.register(PythFeed)
class PythFeedAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticker', 'feed_id', 'active', 'last_updated')
    list_filter = ('active', 'last_updated')
    search_fields = ('ticker', 'feed_id')

@admin.register(ResourceLink)
class ResourceLinkAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'url')
    list_filter = ('category',)
    search_fields = ('title', 'url')

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'category', 'rating', 'created_at')
    list_filter = ('category', 'rating', 'created_at')
    search_fields = ('user__username', 'comment')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(PaperTrade)
class PaperTradeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'ticker', 'action', 'shares', 'price', 'status', 'created_at')
    list_filter = ('ticker', 'action', 'status', 'created_at')
    search_fields = ('user__username', 'ticker')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(PaperTradeEvent)
class PaperTradeEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'paper_trade', 'event_type', 'price', 'created_at')
    list_filter = ('event_type', 'created_at')
    search_fields = ('paper_trade__ticker', 'paper_trade__user__username')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('paper_trade', 'paper_trade__user')

@admin.register(PaperEquitySnapshot)
class PaperEquitySnapshotAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'equity', 'cash', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username',)
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'theme', 'default_ticker', 'timezone', 'digest_enabled')
    list_filter = ('theme', 'timezone', 'digest_enabled')
    search_fields = ('user__username',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(UserPortfolio)
class UserPortfolioAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'equity', 'balance', 'open_positions', 'snapshot_at')
    list_filter = ('snapshot_at',)
    search_fields = ('user__username',)
    ordering = ('-snapshot_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'achievement_name', 'unlocked_at')
    list_filter = ('achievement_name', 'unlocked_at')
    search_fields = ('user__username', 'achievement_name')
    ordering = ('-unlocked_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(CompetitionModel)
class CompetitionModelAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'start_date', 'end_date', 'prize_pool', 'active')
    list_filter = ('active', 'start_date', 'end_date')
    search_fields = ('title', 'description')
    ordering = ('-start_date',)

@admin.register(CompetitionEntry)
class CompetitionEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'competition', 'user', 'start_equity', 'current_equity', 'joined_at')
    list_filter = ('joined_at', 'competition')
    search_fields = ('user__username', 'competition__title')
    ordering = ('-joined_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('competition', 'user')

@admin.register(ModelVersion)
class ModelVersionAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticker', 'model_type', 'version', 'trained_at', 'is_active')
    list_filter = ('ticker', 'model_type', 'is_active', 'trained_at')
    search_fields = ('ticker', 'version', 'model_type')
    ordering = ('-trained_at',)

@admin.register(TradingBot)
class TradingBotAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'ticker', 'strategy', 'is_active', 'created_at')
    list_filter = ('ticker', 'strategy', 'is_active', 'created_at')
    search_fields = ('name', 'ticker', 'strategy')
    ordering = ('-created_at',)

@admin.register(UserBotSubscription)
class UserBotSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'bot', 'active', 'subscribed_at')
    list_filter = ('active', 'subscribed_at', 'bot')
    search_fields = ('user__username', 'bot__name')
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'bot')

@admin.register(UserPaperAccount)
class UserPaperAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'currency', 'balance', 'equity', 'is_active')
    list_filter = ('currency', 'is_active')
    search_fields = ('user__username',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(UserPaperOrder)
class UserPaperOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'account', 'ticker', 'order_type', 'side', 'shares', 'limit_price', 'status', 'created_at')
    list_filter = ('ticker', 'order_type', 'side', 'status', 'created_at')
    search_fields = ('account__user__username', 'ticker')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('account', 'account__user')

@admin.register(UserPaperPosition)
class UserPaperPositionAdmin(admin.ModelAdmin):
    list_display = ('id', 'account', 'ticker', 'shares', 'avg_entry_price', 'updated_at')
    list_filter = ('ticker', 'updated_at')
    search_fields = ('account__user__username', 'ticker')
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('account', 'account__user')
