from django.urls import path
from . import admin_views
from . import pipeline_views
from . import search_views
from . import control_views

urlpatterns = [
    path('overview', admin_views.AdminOverviewView.as_view(), name='admin-api-overview'),
    path('dashboard/', admin_views.AdminDashboardHtmlView.as_view(), name='admin-dashboard'),
    path('users/', admin_views.AdminUsersHtmlView.as_view(), name='admin-users'),
    path('users/<int:user_id>/toggle-status/', admin_views.AdminUserToggleStatusView.as_view(), name='admin-user-toggle-status'),
    path('users/<int:user_id>/update-plan/', admin_views.AdminUserUpdatePlanView.as_view(), name='admin-user-update-plan'),
    path('global-search/', search_views.AdminGlobalSearchView.as_view(), name='admin-api-global-search'),
    
    # JSON APIs for React frontend
    path('users/list', admin_views.AdminUsersApiView.as_view(), name='admin-api-users-list'),
    path('users/<int:user_id>/toggle-status/json', admin_views.AdminUserToggleStatusApiView.as_view(), name='admin-api-user-toggle-status-json'),
    path('users/<int:user_id>/update-plan/json', admin_views.AdminUserUpdatePlanApiView.as_view(), name='admin-api-user-update-plan-json'),
    path('users/<int:user_id>/update-role/json', admin_views.AdminUserUpdateRoleApiView.as_view(), name='admin-api-user-update-role-json'),
    path('payments/list', admin_views.AdminPaymentsApiView.as_view(), name='admin-api-payments-list'),
    path('broadcasts/list', admin_views.AdminBroadcastsApiView.as_view(), name='admin-api-broadcasts-list'),
    path('broadcasts/create', admin_views.AdminBroadcastsApiView.as_view(), name='admin-api-broadcasts-create'),
    path('gift-codes/list', admin_views.AdminGiftCodesApiView.as_view(), name='admin-api-gift-codes-list'),
    path('gift-codes/generate', admin_views.AdminGiftCodesApiView.as_view(), name='admin-api-gift-codes-generate'),
    path('pillars/data', admin_views.AdminPillarsDataView.as_view(), name='admin-api-pillars-data'),
    path('pillars/action', admin_views.AdminPillarsActionView.as_view(), name='admin-api-pillars-action'),
    path('pipeline/cron-retrain', pipeline_views.CronRetrainView.as_view(), name='admin-api-cron-retrain'),

    # Phase 27 - Enterprise Operations & Telemetry Routes
    path('api/telemetry-stream/', control_views.TelemetryStreamView.as_view(), name='admin-api-telemetry-stream'),
    path('api/service-control/', control_views.ServiceControlView.as_view(), name='admin-api-service-control'),
    path('api/incidents/list', control_views.IncidentManagerView.as_view(), name='admin-api-incidents-list'),
    path('api/incidents/create', control_views.IncidentManagerView.as_view(), name='admin-api-incidents-create'),
    path('api/incidents/update', control_views.IncidentManagerView.as_view(), name='admin-api-incidents-update'),
    path('api/celery-ops/', control_views.CeleryOperationsView.as_view(), name='admin-api-celery-ops'),
    path('api/celery-ops/action', control_views.CeleryOperationsView.as_view(), name='admin-api-celery-ops-action'),
    path('api/sessions/list', control_views.ActiveSessionManagerView.as_view(), name='admin-api-sessions-list'),
    path('api/sessions/terminate', control_views.ActiveSessionManagerView.as_view(), name='admin-api-sessions-terminate'),
    path('api/model-governance/', control_views.ModelGovernanceView.as_view(), name='admin-api-model-governance'),
    path('api/model-governance/action', control_views.ModelGovernanceView.as_view(), name='admin-api-model-governance-action'),
    path('api/reports/generate/', control_views.ExecutiveReportsView.as_view(), name='admin-api-reports-generate'),
]
