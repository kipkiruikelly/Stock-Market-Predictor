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
    Portfolio, Holding, Transaction, Watchlist, SmartOrderExecution
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

@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('id', 'owner', 'name', 'base_currency', 'current_balance', 'total_equity', 'status', 'created_at')
    list_filter = ('base_currency', 'status', 'created_at')
    search_fields = ('owner__email', 'name')
    ordering = ('-created_at',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('owner')

@admin.register(Holding)
class HoldingAdmin(admin.ModelAdmin):
    list_display = ('id', 'portfolio', 'symbol', 'asset_class', 'quantity', 'average_entry_price', 'market_value', 'last_updated')
    list_filter = ('asset_class', 'last_updated')
    search_fields = ('portfolio__name', 'symbol')
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('portfolio')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'portfolio', 'transaction_type', 'asset', 'quantity', 'execution_price', 'total_amount', 'timestamp')
    list_filter = ('transaction_type', 'timestamp')
    search_fields = ('portfolio__name', 'asset', 'transaction_id')
    ordering = ('-timestamp',)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('portfolio')

@admin.register(Watchlist)
class WatchlistAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'name')
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

# Safely register all other auxiliary models to prevent schema compilation mismatches
aux_models = [
    PredictionHistory, Payment, TradingBot, WatchlistItem,
    PriceAlert, PortfolioPosition, ApiKey, PredictionAccuracy,
    PasswordResetToken, TelegramConfig, WhatsappConfig, Notification,
    TradeJournal, DiscordConfig, GiftCode, UserWebhook, ActivityLog,
    TwoFactorAuth, AdminAuditLog, AppSetting, TickerConfig, Broadcast,
    ErrorLog, PythFeed, ResourceLink, Feedback, PaperTrade, PaperTradeEvent,
    PaperEquitySnapshot, UserPreferences, UserPortfolio,
    UserAchievement, CompetitionModel, CompetitionEntry, ModelVersion,
    UserBotSubscription, UserPaperAccount, UserPaperOrder, UserPaperPosition,
    SmartOrderExecution
]

for model in aux_models:
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass
