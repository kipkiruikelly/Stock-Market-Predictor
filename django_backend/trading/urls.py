from django.urls import path
from . import views
from . import prediction_views
from . import extra_views
from . import portfolio_views
from . import paper_views
from . import scanner_views
from . import tools_views
from . import macro_views
from . import mt5_views
from . import pipeline_views
from . import workflow_views
from . import analytics_views
from . import recommender_views
from . import execution_views
from . import v22_views
from . import production_views
from . import enterprise_views
from . import saas_views
from . import ai_fos_views
from . import institutional_views
from . import stream_views
from users import security_views
from . import execution_analytics
from . import quant_views
from . import ai_governance_views
from . import collaboration_views
from . import report_views
from . import webhook_views
from . import signals_views
from . import smartexecution_views
from . import oms_views
from . import positions_views
from . import supervisor_views
from . import strategy_management_views
from . import holdings_views
from . import portfolio_suite_views
from . import research_lab_suite_views
from . import executive_suite_views
from . import admin_suite_views
from . import knowledge_suite_views

urlpatterns = [
    # ── Executive Suite Endpoints ────────────────────────────────
    path('executive/dashboard/dashboard', executive_suite_views.ExecutiveDashboardView.as_view(), name='api-executive-dashboard'),
    path('executive/business-analytics/dashboard', executive_suite_views.BusinessAnalyticsView.as_view(), name='api-executive-analytics'),
    path('executive/growth/dashboard', executive_suite_views.ExecutiveGrowthView.as_view(), name='api-executive-growth'),
    path('executive/cloud-costs/dashboard', executive_suite_views.CloudCostsView.as_view(), name='api-executive-cloud-costs'),
    path('dashboard/market-overview/dashboard', executive_suite_views.EnterpriseMarketOverviewView.as_view(), name='api-market-overview'),

    # ── Administration Suite Endpoints ───────────────────────────
    path('admin/users/dashboard', admin_suite_views.AdminUsersView.as_view(), name='api-admin-users'),
    path('admin/roles/dashboard', admin_suite_views.AdminRolesView.as_view(), name='api-admin-roles'),
    path('admin/organizations/dashboard', admin_suite_views.AdminOrganizationsView.as_view(), name='api-admin-orgs'),
    path('admin/feature-flags/dashboard', admin_suite_views.AdminFeatureFlagsView.as_view(), name='api-admin-flags'),
    path('admin/api-keys/dashboard', admin_suite_views.AdminApiKeysView.as_view(), name='api-admin-keys'),
    path('admin/billing/dashboard', admin_suite_views.AdminBillingView.as_view(), name='api-admin-billing'),
    path('admin/settings/dashboard', admin_suite_views.AdminSettingsView.as_view(), name='api-admin-settings'),

    # ── Knowledge Center Suite Endpoints ──────────────────────────
    path('knowledge/documentation/dashboard', knowledge_suite_views.KnowledgeDocumentationView.as_view(), name='api-knowledge-docs'),
    path('knowledge/api-explorer/dashboard', knowledge_suite_views.KnowledgeApiExplorerView.as_view(), name='api-knowledge-api-explorer'),
    path('knowledge/runbooks/dashboard', knowledge_suite_views.KnowledgeRunbooksView.as_view(), name='api-knowledge-runbooks'),
    path('knowledge/user-guide/dashboard', knowledge_suite_views.KnowledgeUserGuideView.as_view(), name='api-knowledge-user-guide'),
    path('knowledge/admin-guide/dashboard', knowledge_suite_views.KnowledgeAdminGuideView.as_view(), name='api-knowledge-admin-guide'),
    # ── Institutional Research Lab Suite Endpoints ───────────────
    path('researchlab/projects/dashboard', research_lab_suite_views.ResearchLabProjectsView.as_view(), name='api-researchlab-projects'),
    path('researchlab/datasets/dashboard', research_lab_suite_views.ResearchLabDatasetsView.as_view(), name='api-researchlab-datasets'),
    path('researchlab/datapipeline/dashboard', research_lab_suite_views.ResearchLabPipelineView.as_view(), name='api-researchlab-pipeline'),
    path('researchlab/experiments/dashboard', research_lab_suite_views.ResearchLabExperimentsView.as_view(), name='api-researchlab-experiments'),
    path('researchlab/models/dashboard', research_lab_suite_views.ResearchLabModelsView.as_view(), name='api-researchlab-models'),
    path('researchlab/modelregistry/dashboard', research_lab_suite_views.ResearchLabModelRegistryView.as_view(), name='api-researchlab-registry'),
    # ── Institutional Portfolio Suite Endpoints ─────────────────
    path('portfolio/analytics/dashboard', portfolio_suite_views.PortfolioAnalyticsView.as_view(), name='api-portfolio-analytics'),
    path('portfolio/allocation/dashboard', portfolio_suite_views.PortfolioAllocationView.as_view(), name='api-portfolio-allocation'),
    path('portfolio/performance/dashboard', portfolio_suite_views.PortfolioPerformanceView.as_view(), name='api-portfolio-performance'),
    path('portfolio/risk/dashboard', portfolio_suite_views.PortfolioRiskView.as_view(), name='api-portfolio-risk'),
    # ── Institutional Portfolio Holdings Dashboard Suite ────────
    path('portfolio/holdings/dashboard', holdings_views.HoldingsDashboardView.as_view(), name='api-holdings-dashboard'),
    path('portfolio/holdings/<str:holding_id>/details', holdings_views.HoldingDetailView.as_view(), name='api-holding-details'),
    path('portfolio/holdings/<str:holding_id>/action', holdings_views.HoldingActionView.as_view(), name='api-holding-action'),
    # ── Institutional Strategy Management System (SMS) Suite ────
    path('trading/strategies/dashboard', strategy_management_views.StrategyDashboardView.as_view(), name='api-strategy-dashboard'),
    path('trading/strategies/<str:strategy_id>/details', strategy_management_views.StrategyDetailView.as_view(), name='api-strategy-details'),
    path('trading/strategies/<str:strategy_id>/action', strategy_management_views.StrategyActionView.as_view(), name='api-strategy-action'),
    # ── Institutional Trading Supervisor Console Suite ──────────
    path('trading/supervisor/dashboard', supervisor_views.SupervisorDashboardView.as_view(), name='api-supervisor-dashboard'),
    path('trading/supervisor/decision', supervisor_views.SupervisorDecisionView.as_view(), name='api-supervisor-decision'),
    path('trading/terminal/dashboard', supervisor_views.TradingTerminalView.as_view(), name='api-trading-terminal'),
    path('trading/performance/dashboard', supervisor_views.TradingPerformanceAnalyticsView.as_view(), name='api-trading-performance'),
    path('trading/marketanalytics/dashboard', supervisor_views.TradingMarketAnalyticsView.as_view(), name='api-trading-marketanalytics'),
    path('trading/strategytools/dashboard', supervisor_views.TradingStrategyToolsView.as_view(), name='api-trading-strategytools'),
    path('operations/screener/dashboard', supervisor_views.OperationsScreenerView.as_view(), name='api-operations-screener'),
    # ── Institutional Position Management System (PMS) Suite ────
    path('trading/positions/dashboard', positions_views.PositionsDashboardView.as_view(), name='api-positions-dashboard'),
    path('trading/positions/<str:position_id>/details', positions_views.PositionDetailView.as_view(), name='api-position-details'),
    path('trading/positions/<str:position_id>/action', positions_views.PositionActionView.as_view(), name='api-position-action'),
    # ── Institutional Order Management System (OMS) Suite ───────
    path('trading/orders/oms', oms_views.OmsDashboardView.as_view(), name='api-oms-dashboard'),
    path('trading/orders/<str:order_id>/timeline', oms_views.OmsOrderTimelineView.as_view(), name='api-oms-order-timeline'),
    path('trading/orders/<str:order_id>/modify', oms_views.OmsOrderModifyView.as_view(), name='api-oms-order-modify'),
    # ── Institutional Smart Order Execution (SOR) Suite ─────────
    path('execution/smartexecution/dashboard', smartexecution_views.SmartExecutionDashboardView.as_view(), name='api-smartexecution-dashboard'),
    path('execution/order/<str:order_id>/details', smartexecution_views.SmartExecutionOrderDetailView.as_view(), name='api-smartexecution-order-details'),
    # ── Trading Signals & Explainable AI Suite ──────────────
    path('trading/signals', signals_views.TradingSignalsView.as_view(), name='api-trading-signals'),
    path('trading/signals/<str:signal_id>/explanation', signals_views.TradingSignalExplanationView.as_view(), name='api-trading-signal-explanation'),
    # ── Phase 34: Enterprise Production & Scalability Suite ──────
    path('production/deployments/status', production_views.DeploymentStatusView.as_view(), name='api-production-deployments-status'),
    path('production/deployments/rollback', production_views.DeploymentRollbackView.as_view(), name='api-production-deployments-rollback'),
    path('security/dashboard', security_views.SecurityCenterView.as_view(), name='api-security-dashboard'),
    path('security/audit-logs', security_views.AuditLogExplorerView.as_view(), name='api-security-audit-logs'),
    path('execution/tca', execution_analytics.TcaAnalyticsView.as_view(), name='api-execution-tca'),
    path('execution/replay', execution_analytics.OrderReplayView.as_view(), name='api-execution-replay'),
    path('quant/factor-attribution', quant_views.FactorAttributionView.as_view(), name='api-quant-factor-attribution'),
    path('quant/pair-research', quant_views.PairResearchView.as_view(), name='api-quant-pair-research'),
    path('ai/governance/summary', ai_governance_views.AiGovernanceSummaryView.as_view(), name='api-ai-governance-summary'),
    path('ai/governance/approve', ai_governance_views.AiHumanApprovalView.as_view(), name='api-ai-governance-approve'),
    path('collaboration/feed', collaboration_views.ActivityFeedView.as_view(), name='api-collaboration-feed'),
    path('collaboration/comments', collaboration_views.ChartCommentsView.as_view(), name='api-collaboration-comments'),
    path('reports/generate', report_views.ReportGeneratorView.as_view(), name='api-reports-generate'),
    path('reports/schedule', report_views.ScheduledReportsView.as_view(), name='api-reports-schedule'),
    path('developer/webhooks', webhook_views.WebhookManagementView.as_view(), name='api-developer-webhooks'),

    # ── Real-time SSE Streaming & Multi-Agent Provenance ─────────
    path('stream/events', stream_views.EventStreamView.as_view(), name='api-stream-events'),
    path('ai/subagents/provenance', stream_views.MultiAgentProvenanceView.as_view(), name='api-subagents-provenance'),

    # ── Institutional Smart Execution Engine ─────────────────────
    path('execution/smart-order', execution_views.SmartOrderView.as_view(), name='api-execution-smart-order'),
    path('execution/stats', execution_views.ExecutionStatsView.as_view(), name='api-execution-stats'),

    # ── Recommender System ───────────────────────────────────────
    path('recommendations', recommender_views.RecommendationsView.as_view(), name='api-recommendations'),

    # ── Standard ML, Dataset & Analytics Endpoints ───────────────
    path('model/info', analytics_views.ModelInfoView.as_view(), name='api-model-info'),
    path('properties', analytics_views.DatasetPropertiesView.as_view(), name='api-properties'),
    path('upload', analytics_views.DatasetUploadView.as_view(), name='api-upload'),
    path('statistics', analytics_views.StatisticsView.as_view(), name='api-statistics'),
    path('feature-importance', analytics_views.FeatureImportanceApiView.as_view(), name='api-feature-importance-query'),
    # ── Autonomous Workflows & FSM Engine ────────────────────────
    path('workflow/status', workflow_views.WorkflowStatusView.as_view(), name='api-workflow-status'),
    path('workflow/toggle-scanner', workflow_views.WorkflowToggleScannerView.as_view(), name='api-workflow-toggle-scanner'),
    path('workflow/trigger-scan', workflow_views.WorkflowTriggerScanView.as_view(), name='api-workflow-trigger-scan'),
    path('workflow/update-tickers', workflow_views.WorkflowUpdateTickersView.as_view(), name='api-workflow-update-tickers'),
    # ── AI Robots & Automation ───────────────────────────────────
    path('bots', views.BotsView.as_view(), name='api-bots'),
    path('bots/subscribe', views.BotSubscribeView.as_view(), name='api-bots-subscribe'),
    path('bots/signals', views.BotSignalsView.as_view(), name='api-bots-signals'),
    path('bots/auto-trade', views.BotAutoTradeView.as_view(), name='api-bots-auto-trade'),
    path('bots/backtest', views.BotBacktestView.as_view(), name='api-bots-backtest'),

    # ── Market ────────────────────────────────────────────────────
    path('market/movers', views.MarketMoversView.as_view(), name='api-market-movers'),
    path('market/overview', extra_views.MarketOverviewView.as_view(), name='api-market-overview'),
    path('market/history', views.MarketHistoryView.as_view(), name='api-market-history'),

    # ── Screener ──────────────────────────────────────────────────
    path('screener', extra_views.ScreenerView.as_view(), name='api-screener'),

    # ── Watchlist ─────────────────────────────────────────────────
    path('watchlist', views.WatchlistView.as_view(), name='api-watchlist'),
    path('watchlist/add', views.WatchlistView.as_view(), name='api-watchlist-add'),
    path('watchlist/remove', views.WatchlistView.as_view(), name='api-watchlist-remove'),

    # ── Portfolio Management Service (Enterprise Multi-Portfolio Engine) ──────────
    path('portfolios', portfolio_views.PortfolioListCreateView.as_view(), name='api-portfolios-list-create'),
    path('portfolios/<int:pk>', portfolio_views.PortfolioDetailView.as_view(), name='api-portfolios-detail'),
    path('portfolios/transaction', portfolio_views.TransactionExecuteView.as_view(), name='api-portfolios-transaction-execute'),
    path('portfolios/<int:portfolio_id>/transactions', portfolio_views.TransactionHistoryView.as_view(), name='api-portfolios-transactions-history'),
    path('portfolios/watchlist', portfolio_views.WatchlistListCreateView.as_view(), name='api-portfolios-watchlist'),

    # ── Predictions & Accuracy ────────────────────────────────────
    path('health', prediction_views.HealthView.as_view(), name='api-health'),
    path('signal', prediction_views.SignalView.as_view(), name='api-signal'),
    path('predict', prediction_views.PredictionView.as_view(), name='api-predict'),
    path('predict/history', prediction_views.PredictionHistoryView.as_view(), name='api-predict-history'),
    path('accuracy', prediction_views.PredictionAccuracyView.as_view(), name='api-accuracy'),
    path('model-metrics', prediction_views.ModelMetricsView.as_view(), name='api-model-metrics'),
    # ── Enterprise Quantitative Research Workspace (v2.2) ────────
    path('research/projects', v22_views.ResearchProjectView.as_view(), name='api-research-projects'),
    path('research/datasets', v22_views.ResearchDatasetView.as_view(), name='api-research-datasets'),
    path('research/compare', v22_views.ModelComparisonView.as_view(), name='api-research-compare'),
    path('research/promote', v22_views.ModelPromotionView.as_view(), name='api-research-promote'),

    path('research/<str:ticker>', prediction_views.ResearchView.as_view(), name='api-research'),
    path('feature-importance/<str:ticker>', prediction_views.FeatureImportanceView.as_view(), name='api-feature-importance'),
    path('track-record', prediction_views.TrackRecordView.as_view(), name='api-track-record'),
    path('pipeline/stats', prediction_views.PipelineStatsView.as_view(), name='api-pipeline-stats'),
    path('ai/analyze/<str:ticker>', prediction_views.AiAnalyzeView.as_view(), name='api-ai-analyze'),

    # ── Notifications ─────────────────────────────────────────────
    path('notifications', tools_views.NotificationsListView.as_view(), name='api-notifications'),
    path('notifications/read', tools_views.NotificationsReadView.as_view(), name='api-notifications-read'),
    path('notifications/clear', tools_views.NotificationsClearView.as_view(), name='api-notifications-clear'),
    
    path('notifications/list', tools_views.NotificationsListView.as_view(), name='api-notifications-list'),
    path('notifications/read-new', tools_views.NotificationsReadView.as_view(), name='api-notifications-read-new'),
    path('notifications/clear-all', tools_views.NotificationsClearView.as_view(), name='api-notifications-clear-all'),

    # ── Manual Paper Trading ──────────────────────────────────────
    path('manual-paper/account', extra_views.ManualPaperAccountView.as_view(), name='api-manual-paper-account'),
    path('manual-paper/order', extra_views.ManualPaperOrderView.as_view(), name='api-manual-paper-order'),
    path('manual-paper/cancel', extra_views.ManualPaperCancelView.as_view(), name='api-manual-paper-cancel'),
    path('mlops/pipeline/deploy', extra_views.MlopsPipelineDeployView.as_view(), name='api-mlops-pipeline-deploy'),
    
    # ── Operational Monitoring ────────────────────────────────────
    path('operations/health', extra_views.OperationsHealthView.as_view(), name='api-operations-health'),
    path('operations/performance', extra_views.ApiPerformanceView.as_view(), name='api-operations-performance'),
    path('model/health', extra_views.ModelHealthView.as_view(), name='api-model-health'),
    path('strategy/marketplace', extra_views.StrategyMarketplaceView.as_view(), name='api-strategy-marketplace'),
    path('ai/assistant/chat', extra_views.EmbeddedAiAssistantView.as_view(), name='api-ai-assistant-chat'),
    
    # ── Phase 30 Advanced Autonomous SRE Operations ───────────────
    path('operations/incidents', extra_views.IncidentsView.as_view(), name='api-operations-incidents'),
    path('operations/incidents/<str:incident_id>/update', extra_views.IncidentsUpdateView.as_view(), name='api-operations-incidents-update'),
    path('operations/predictive', extra_views.PredictiveForecastView.as_view(), name='api-operations-predictive'),
    path('operations/policies', extra_views.PoliciesConfigView.as_view(), name='api-operations-policies'),
    path('operations/policies/<str:policy_id>', extra_views.PoliciesConfigView.as_view(), name='api-operations-policies-update'),
    path('operations/chaos/trigger', extra_views.ChaosTriggerView.as_view(), name='api-operations-chaos-trigger'),
    path('operations/soc', extra_views.SocEventsView.as_view(), name='api-operations-soc'),
    path('operations/executive-kpis', extra_views.ExecutiveKpisView.as_view(), name='api-operations-executive-kpis'),
    path('operations/timeline', extra_views.OperationsTimelineView.as_view(), name='api-operations-timeline'),

    # ── Enterprise Quantitative Research Platform & AI OS (v2.2) ──
    path('market/events', v22_views.MarketEventView.as_view(), name='api-market-events'),
    path('trading/supervisor/check', v22_views.TradingSupervisorView.as_view(), name='api-trading-supervisor-check'),
    path('knowledge/hub', v22_views.KnowledgeHubView.as_view(), name='api-knowledge-hub'),
    path('executive/command', v22_views.ExecutiveCommandView.as_view(), name='api-executive-command'),

    # ── Simulated Paper Trading Engine ───────────────────────────
    path('paper/summary', paper_views.PaperSummaryView.as_view(), name='api-paper-summary'),
    path('paper/trades', paper_views.PaperTradesView.as_view(), name='api-paper-trades'),
    path('paper/opt-in', paper_views.PaperOptInView.as_view(), name='api-paper-opt-in'),
    path('paper/opt-out', paper_views.PaperOptOutView.as_view(), name='api-paper-opt-out'),
    path('paper/my-portfolio', paper_views.PaperMyPortfolioView.as_view(), name='api-paper-my-portfolio'),
    path('leaderboard/users', paper_views.TraderLeaderboardView.as_view(), name='api-trader-leaderboard'),

    # ── Scanners ──────────────────────────────────────────────────
    path('scanner/volume', scanner_views.ScannerVolumeView.as_view(), name='api-scanner-volume'),
    path('scanner/squeeze', scanner_views.ScannerSqueezeView.as_view(), name='api-scanner-squeeze'),
    path('scanner/sector', scanner_views.ScannerSectorView.as_view(), name='api-scanner-sector'),

    # ── Macro Intelligence ────────────────────────────────────────
    path('macro/data', macro_views.MacroDataView.as_view(), name='api-macro-data'),
    path('macro/heatmap', macro_views.MacroHeatmapView.as_view(), name='api-macro-heatmap'),
    path('macro/ticker-insights/<str:ticker>', macro_views.MacroTickerInsightsView.as_view(), name='api-macro-ticker-insights'),

    # ── Advanced Trading Tools & Settings ────────────────────────
    path('backtest', tools_views.BacktestView.as_view(), name='api-backtest'),
    path('pipeline/retrain', tools_views.PipelineRetrainView.as_view(), name='api-pipeline-retrain'),
    path('pipeline/config', pipeline_views.PipelineConfigView.as_view(), name='api-pipeline-config'),
    path('pipeline/run', pipeline_views.PipelineRunView.as_view(), name='api-pipeline-run'),
    path('pipeline/task/<str:task_id>', pipeline_views.PipelineTaskStatusView.as_view(), name='api-pipeline-task-status'),
    path('calendar/earnings', tools_views.CalendarEarningsView.as_view(), name='api-calendar-earnings'),
    path('calendar/macro', tools_views.CalendarMacroView.as_view(), name='api-calendar-macro'),
    path('resources', tools_views.ResourcesPublicView.as_view(), name='api-resources'),
    path('digest/send', tools_views.DigestSendView.as_view(), name='api-digest-send'),

    # ── Alert Config Channels ─────────────────────────────────────
    path('alerts', tools_views.AlertsListView.as_view(), name='api-alerts-list'),
    path('alerts/add', tools_views.AlertsAddView.as_view(), name='api-alerts-add'),
    path('alerts/remove', tools_views.AlertsRemoveView.as_view(), name='api-alerts-remove'),
    path('telegram/configure', tools_views.TelegramConfigureView.as_view(), name='api-telegram-configure'),
    path('telegram/status', tools_views.TelegramStatusView.as_view(), name='api-telegram-status'),
    path('telegram/remove', tools_views.TelegramRemoveView.as_view(), name='api-telegram-remove'),
    path('whatsapp/configure', tools_views.WhatsappConfigureView.as_view(), name='api-whatsapp-configure'),
    path('whatsapp/status', tools_views.WhatsappStatusView.as_view(), name='api-whatsapp-status'),
    path('whatsapp/remove', tools_views.WhatsappRemoveView.as_view(), name='api-whatsapp-remove'),
    path('discord/configure', tools_views.DiscordConfigureView.as_view(), name='api-discord-configure'),
    path('discord/status', tools_views.DiscordStatusView.as_view(), name='api-discord-status'),
    path('discord/remove', tools_views.DiscordRemoveView.as_view(), name='api-discord-remove'),
    path('discord/test', tools_views.DiscordTestView.as_view(), name='api-discord-test'),

    # ── Journal ───────────────────────────────────────────────────
    path('journal', extra_views.JournalView.as_view(), name='api-journal'),

    # ── Static Content Pages ──────────────────────────────────────
    path('content/<str:page_id>', extra_views.ContentView.as_view(), name='api-content'),

    # ── Password Reset / Email Verify ─────────────────────────────
    path('forgot-password', extra_views.ForgotPasswordView.as_view(), name='api-forgot-password'),
    path('reset-password', extra_views.ResetPasswordView.as_view(), name='api-reset-password'),
    path('verify-email', extra_views.VerifyEmailView.as_view(), name='api-verify-email'),

    # ── Simulated Payments / Upgrade ──────────────────────────────
    path('stripe/checkout', extra_views.StripeCheckoutView.as_view(), name='api-stripe-checkout'),
    path('mpesa/pay', extra_views.MpesaPayView.as_view(), name='api-mpesa-pay'),
    path('mpesa/callback', extra_views.MpesaCallbackView.as_view(), name='api-mpesa-callback'),

    # ── Live Portfolio Summary ───────────────────────────────────
    path('live/summary', mt5_views.LiveSummaryView.as_view(), name='api-live-summary'),
    path('live/trades', mt5_views.LiveTradesView.as_view(), name='api-live-trades'),

    # ── Phase 31 Advanced Production & Distributed Observability ──
    path('metrics', production_views.PrometheusMetricsView.as_view(), name='api-prometheus-metrics'),
    path('operations/observability/traces', production_views.ObservabilityTracesView.as_view(), name='api-observability-traces'),
    path('operations/observability/servicemap', production_views.ObservabilityServiceMapView.as_view(), name='api-observability-servicemap'),
    path('operations/metrics/dashboard', production_views.MetricsDashboardView.as_view(), name='api-metrics-dashboard'),
    path('operations/slo', production_views.SloComplianceView.as_view(), name='api-slo-compliance'),
    path('operations/autoscaling', production_views.AutoscalingSimView.as_view(), name='api-autoscaling-sim'),
    path('operations/deployments', production_views.DeploymentsManagerView.as_view(), name='api-deployments-manager'),
    path('operations/secrets', production_views.SecretsAuditorView.as_view(), name='api-secrets-auditor'),
    path('operations/secrets/rotate', production_views.SecretsRotatorView.as_view(), name='api-secrets-rotator'),
    path('operations/chaos/trigger-advanced', production_views.AdvancedChaosTriggerView.as_view(), name='api-advanced-chaos-trigger'),
    path('operations/load-test', production_views.ConcurrencyBenchmarkView.as_view(), name='api-concurrency-benchmark'),
    path('operations/security/compliance', production_views.SecurityHardeningView.as_view(), name='api-security-compliance'),
    path('operations/dr', production_views.DisasterRecoveryView.as_view(), name='api-disaster-recovery'),
    path('operations/dr/trigger', production_views.DisasterRecoveryView.as_view(), name='api-disaster-recovery-trigger'),
    path('operations/production-readiness', production_views.ProductionReadinessView.as_view(), name='api-production-readiness'),
    path('operations/documentation', production_views.OperationalDocumentationView.as_view(), name='api-operations-documentation'),

    # ── Phase 32 Enterprise Production Upgrade Endpoints ──────────
    path('enterprise/observability/traces', enterprise_views.EnterpriseTracesView.as_view(), name='api-enterprise-traces'),
    path('enterprise/observability/servicemap', enterprise_views.EnterpriseServiceMapView.as_view(), name='api-enterprise-servicemap'),
    path('enterprise/observability/dashboard', enterprise_views.EnterpriseObservabilityDashboardView.as_view(), name='api-enterprise-dashboard'),
    path('enterprise/sre/incidents', enterprise_views.EnterpriseIncidentsView.as_view(), name='api-enterprise-incidents'),
    path('enterprise/secrets', enterprise_views.EnterpriseSecretsView.as_view(), name='api-enterprise-secrets'),
    path('enterprise/secrets/rotate', enterprise_views.EnterpriseSecretsRotateView.as_view(), name='api-enterprise-secrets-rotate'),
    path('enterprise/deployments/canary', enterprise_views.EnterpriseCanaryDeploymentsView.as_view(), name='api-enterprise-canary'),
    path('enterprise/feature-flags', enterprise_views.EnterpriseFeatureFlagsView.as_view(), name='api-enterprise-feature-flags'),
    path('enterprise/mlops/registry', enterprise_views.EnterpriseMlopsRegistryView.as_view(), name='api-enterprise-mlops'),
    path('enterprise/explainable-ai', enterprise_views.EnterpriseExplainableAiView.as_view(), name='api-enterprise-explainable-ai'),
    path('enterprise/portfolio/optimization', enterprise_views.EnterprisePortfolioOptimizationView.as_view(), name='api-enterprise-portfolio-opt'),
    path('enterprise/search', enterprise_views.EnterpriseSearchView.as_view(), name='api-enterprise-search'),
    path('enterprise/notifications', enterprise_views.EnterpriseNotificationsView.as_view(), name='api-enterprise-notifications'),
    path('enterprise/analytics/executive', enterprise_views.EnterpriseAnalyticsExecutiveView.as_view(), name='api-enterprise-analytics'),
    path('enterprise/cloud-costs', enterprise_views.EnterpriseCloudCostsView.as_view(), name='api-enterprise-cloud-costs'),
    path('enterprise/compliance', enterprise_views.EnterpriseComplianceView.as_view(), name='api-enterprise-compliance'),
    path('enterprise/gateway/policy', enterprise_views.EnterpriseGatewayPolicyView.as_view(), name='api-enterprise-gateway'),
    path('enterprise/dev-experience', enterprise_views.EnterpriseDevExperienceView.as_view(), name='api-enterprise-dev-experience'),
    path('enterprise/documentation', enterprise_views.EnterpriseDocumentationView.as_view(), name='api-enterprise-documentation'),
    path('enterprise/ui-modernization', enterprise_views.EnterpriseUiModernizationView.as_view(), name='api-enterprise-ui-tokens'),

    # ── Phase 33 Enterprise SaaS Product Upgrade Endpoints ────────
    path('saas/architecture/simplify', saas_views.SaasArchitectureSimplifyView.as_view(), name='api-saas-simplify'),
    path('saas/dependencies/graph', saas_views.SaasDependenciesGraphView.as_view(), name='api-saas-dependencies-graph'),
    path('saas/database/optimization', saas_views.SaasDatabaseOptimizationView.as_view(), name='api-saas-db-optimization'),
    path('saas/governance/endpoints', saas_views.SaasGovernanceEndpointsView.as_view(), name='api-saas-governance'),
    path('saas/security/audit', saas_views.SaasSecurityAuditView.as_view(), name='api-saas-security-audit'),
    path('saas/performance/profile', saas_views.SaasPerformanceProfileView.as_view(), name='api-saas-performance'),
    path('saas/monitoring/trends', saas_views.SaasMonitoringTrendsView.as_view(), name='api-saas-monitoring-trends'),
    path('saas/developer/bootstrap', saas_views.SaasDeveloperBootstrapView.as_view(), name='api-saas-developer-bootstrap'),
    path('saas/cicd/pipeline', saas_views.SaasCicdPipelineView.as_view(), name='api-saas-cicd'),
    path('saas/documentation/search', saas_views.SaasDocumentationSearchView.as_view(), name='api-saas-documentation-search'),
    path('saas/accessibility/wcag', saas_views.SaasAccessibilityWcagView.as_view(), name='api-saas-wcag'),
    path('saas/licensing/plans', saas_views.SaasLicensingPlansView.as_view(), name='api-saas-licensing-plans'),
    path('saas/certification/scorecard', saas_views.SaasCertificationScorecardView.as_view(), name='api-saas-certification'),

    # ── Version 4.0 AI-Native Financial Operating System Endpoints ──
    path('ai-fos/multi-agent/orchestrate', ai_fos_views.AiFosMultiAgentView.as_view(), name='api-ai-fos-multi-agent'),
    path('ai-fos/knowledge-graph/query', ai_fos_views.AiFosKnowledgeGraphView.as_view(), name='api-ai-fos-knowledge-graph'),
    path('ai-fos/memory/context', ai_fos_views.AiFosMemoryContextView.as_view(), name='api-ai-fos-memory'),
    path('ai-fos/research/platform', ai_fos_views.AiFosResearchPlatformView.as_view(), name='api-ai-fos-research'),
    path('ai-fos/workflow/engine', ai_fos_views.AiFosWorkflowEngineView.as_view(), name='api-ai-fos-workflow'),
    path('ai-fos/quant/risk', ai_fos_views.AiFosQuantRiskView.as_view(), name='api-ai-fos-quant-risk'),
    path('ai-fos/data/lineage', ai_fos_views.AiFosDataLineageView.as_view(), name='api-ai-fos-data-lineage'),
    path('ai-fos/sdk/plugins', ai_fos_views.AiFosSdkPluginsView.as_view(), name='api-ai-fos-sdk'),
    path('ai-fos/collaboration/feed', ai_fos_views.AiFosCollaborationFeedView.as_view(), name='api-ai-fos-collaboration'),
    path('ai-fos/decision-intelligence', ai_fos_views.AiFosDecisionIntelligenceView.as_view(), name='api-ai-fos-decision-intelligence'),
    path('ai-fos/autonomous-ops', ai_fos_views.AiFosAutonomousOpsView.as_view(), name='api-ai-fos-autonomous-ops'),
    path('ai-fos/digital-twin/simulate', ai_fos_views.AiFosDigitalTwinSimulateView.as_view(), name='api-ai-fos-digital-twin'),
    path('ai-fos/governance/policy', ai_fos_views.AiFosGovernancePolicyView.as_view(), name='api-ai-fos-governance'),
    path('ai-fos/executive/intelligence', ai_fos_views.AiFosExecutiveIntelligenceView.as_view(), name='api-ai-fos-executive'),
    path('ai-fos/certification/review', ai_fos_views.AiFosCertificationReviewView.as_view(), name='api-ai-fos-certification'),

    # ── Version 4.1 Institutional Financial Intelligence Platform Endpoints ──
    path('institutional/collaboration/workspaces', institutional_views.InstitutionalCollaborationWorkspaceView.as_view(), name='api-inst-workspaces'),
    path('institutional/model-governance/registry', institutional_views.InstitutionalModelGovernanceView.as_view(), name='api-inst-governance'),
    path('institutional/decision-intelligence/reason', institutional_views.InstitutionalDecisionIntelligenceView.as_view(), name='api-inst-decision-reason'),
    path('institutional/workflow/orchestrate', institutional_views.InstitutionalWorkflowOrchestrateView.as_view(), name='api-inst-workflow'),
    path('institutional/market-twin/simulate', institutional_views.InstitutionalMarketTwinSimulateView.as_view(), name='api-inst-market-twin'),
    path('institutional/data-fabric/lineage', institutional_views.InstitutionalDataFabricLineageView.as_view(), name='api-inst-data-fabric'),
    path('institutional/risk/portfolio-reports', institutional_views.InstitutionalRiskPortfolioReportsView.as_view(), name='api-inst-risk-reports'),
    path('institutional/aiops/operations', institutional_views.InstitutionalAiOpsView.as_view(), name='api-inst-aiops'),
    path('institutional/executive/dashboard', institutional_views.InstitutionalExecutiveDashboardView.as_view(), name='api-inst-executive'),
    path('institutional/developer/api-explorer', institutional_views.InstitutionalDeveloperApiExplorerView.as_view(), name='api-inst-api-explorer'),
    path('institutional/compliance/dashboard', institutional_views.InstitutionalComplianceDashboardView.as_view(), name='api-inst-compliance'),
    path('institutional/optimization/benchmarks', institutional_views.InstitutionalOptimizationBenchmarksView.as_view(), name='api-inst-optimizations'),
    path('institutional/optimization/navigation-audit', institutional_views.InstitutionalNavigationAuditView.as_view(), name='api-inst-nav-audit'),
]
