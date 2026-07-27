from django.urls import path
from . import views
from . import auth_views
from . import reset_views
from . import auth_views_v1

urlpatterns = [
    # ── V1 Production IAM Endpoints ───────────────────────────────
    path('v1/auth/register', auth_views_v1.RegisterView.as_view(), name='v1-auth-register'),
    path('v1/auth/login', auth_views_v1.LoginView.as_view(), name='v1-auth-login'),
    path('v1/auth/logout', auth_views_v1.LogoutView.as_view(), name='v1-auth-logout'),
    path('v1/auth/refresh', auth_views_v1.RefreshView.as_view(), name='v1-auth-refresh'),
    path('v1/auth/me', auth_views_v1.MeView.as_view(), name='v1-auth-me'),
    path('v1/auth/forgot-password', auth_views_v1.ForgotPasswordView.as_view(), name='v1-auth-forgot-password'),
    path('v1/auth/reset-password', auth_views_v1.ResetPasswordView.as_view(), name='v1-auth-reset-password'),
    path('v1/auth/verify-email', auth_views_v1.VerifyEmailView.as_view(), name='v1-auth-verify-email'),
    path('v1/auth/resend-verification', auth_views_v1.ResendVerificationView.as_view(), name='v1-auth-resend-verification'),
    path('v1/auth/change-password', auth_views_v1.ChangePasswordView.as_view(), name='v1-auth-change-password'),

    # ── JWT & OAuth Authentication ────────────────────────────────
    path('auth/jwt/login', auth_views.JwtLoginView.as_view(), name='api-jwt-login'),
    path('auth/jwt/refresh', auth_views.JwtRefreshView.as_view(), name='api-jwt-refresh'),
    path('auth/jwt/logout', auth_views.JwtLogoutView.as_view(), name='api-jwt-logout'),
    path('auth/google', auth_views.GoogleOAuthView.as_view(), name='api-google-oauth'),

    # ── Password Reset & Email Verification ───────────────────────
    path('auth/forgot-password', reset_views.ForgotPasswordView.as_view(), name='api-forgot-password'),
    path('auth/reset-password', reset_views.ResetPasswordView.as_view(), name='api-reset-password'),
    path('auth/verify-email', reset_views.VerifyEmailView.as_view(), name='api-verify-email'),
    path('auth/resend-verification', reset_views.ResendVerificationView.as_view(), name='api-resend-verification'),

    # ── Session Authentication ───────────────────────────────────
    path('login', views.LoginView.as_view(), name='api-login'),
    path('register', views.RegisterView.as_view(), name='api-register'),
    path('logout', views.LogoutView.as_view(), name='api-logout'),
    path('me', views.MeView.as_view(), name='api-me'),
    path('csrf', views.CsrfView.as_view(), name='api-csrf'),
    path('settings', views.SettingsView.as_view(), name='api-settings'),
    path('profile', views.ProfileView.as_view(), name='api-profile'),
    path('profile/change-password', views.ChangePasswordView.as_view(), name='api-change-password'),
    
    # User Preferences
    path('preferences', views.PreferencesView.as_view(), name='api-preferences'),
    
    # 2FA
    path('2fa/setup', views.TwoFactorSetupView.as_view(), name='api-2fa-setup'),
    path('2fa/enable', views.TwoFactorEnableView.as_view(), name='api-2fa-enable'),
    path('2fa/disable', views.TwoFactorDisableView.as_view(), name='api-2fa-disable'),
    path('2fa/status', views.TwoFactorStatusView.as_view(), name='api-2fa-status'),
    
    # API Keys
    path('keys', views.ApiKeysListView.as_view(), name='api-keys-list'),
    path('keys/create', views.ApiKeysCreateView.as_view(), name='api-keys-create'),
    path('keys/delete', views.ApiKeysDeleteView.as_view(), name='api-keys-delete'),
    
    # Webhooks
    path('webhooks', views.WebhooksListView.as_view(), name='api-webhooks-list'),
    path('webhooks/add', views.WebhooksAddView.as_view(), name='api-webhooks-add'),
    path('webhooks/delete', views.WebhooksDeleteView.as_view(), name='api-webhooks-delete'),
    path('webhooks/test', views.WebhooksTestView.as_view(), name='api-webhooks-test'),
    
    # Gift Codes
    path('gift/redeem', views.GiftRedeemView.as_view(), name='api-gift-redeem'),
    
    # Gamification
    path('gamification/claim-xp', views.ClaimXpView.as_view(), name='api-gamification-claim-xp'),
    path('gamification/streak-boost', views.StreakBoostView.as_view(), name='api-gamification-streak-boost'),

    # Account actions
    path('account/export', views.AccountExportView.as_view(), name='api-account-export'),
    path('account/delete', views.AccountDeleteView.as_view(), name='api-account-delete'),
]
