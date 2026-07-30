import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import { AppLayout } from './components/AppLayout';
import { LandingDashboard } from './pages/LandingDashboard';
import { LoginDashboard } from './pages/LoginDashboard';
import { RegisterDashboard } from './pages/RegisterDashboard';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { AdminDashboard } from './pages/AdminDashboard';
import { TradingDashboard } from './pages/TradingDashboard';
import { MarketDashboard } from './pages/MarketDashboard';
import { ScreenerDashboard } from './pages/ScreenerDashboard';
import { BotsDashboard } from './pages/BotsDashboard';
import { LiveDashboard } from './pages/LiveDashboard';
import { ResearchDashboard } from './pages/ResearchDashboard';
import { LeaderboardDashboard } from './pages/LeaderboardDashboard';
import { TradersDashboard } from './pages/TradersDashboard';
import { BacktestDashboard } from './pages/BacktestDashboard';
import { ResourcesDashboard } from './pages/ResourcesDashboard';
import { JournalDashboard } from './pages/JournalDashboard';
import { ToolsDashboard } from './pages/ToolsDashboard';
import { AlertsDashboard } from './pages/AlertsDashboard';
import { SettingsDashboard } from './pages/SettingsDashboard';
import { HomeDashboard } from './pages/HomeDashboard';
import { StaticPage } from './pages/StaticPage';
import { PricingDashboard } from './pages/PricingDashboard';
import { MacroDashboard } from './pages/MacroDashboard';
import { CalendarDashboard } from './pages/CalendarDashboard';
import { PipelineDashboard } from './pages/PipelineDashboard';
import { RiskDashboard } from './pages/RiskDashboard';
import { ScannerDashboard } from './pages/ScannerDashboard';
import { ModelMetricsDashboard } from './pages/ModelMetricsDashboard';
import { TrackRecordDashboard } from './pages/TrackRecordDashboard';
import { DeploymentDashboard } from './pages/DeploymentDashboard';
import { SecurityCenterDashboard } from './pages/SecurityCenterDashboard';
import { TradingSignalsDashboard } from './pages/TradingSignalsDashboard';
import { SmartExecutionDashboard } from './pages/SmartExecutionDashboard';
import { OrdersDashboard } from './pages/OrdersDashboard';
import { PositionsDashboard } from './pages/PositionsDashboard';
import { TradingSupervisorDashboard } from './pages/TradingSupervisorDashboard';
import { TradingStrategiesDashboard } from './pages/TradingStrategiesDashboard';
import { PortfolioHoldingsDashboard } from './pages/PortfolioHoldingsDashboard';
import { PortfolioAnalyticsDashboard } from './pages/PortfolioAnalyticsDashboard';
import { PortfolioAllocationDashboard } from './pages/PortfolioAllocationDashboard';
import { PortfolioPerformanceDashboard } from './pages/PortfolioPerformanceDashboard';
import { PortfolioRiskDashboard } from './pages/PortfolioRiskDashboard';
import { ResearchProjectsDashboard } from './pages/ResearchProjectsDashboard';
import { ResearchDatasetsDashboard } from './pages/ResearchDatasetsDashboard';
import { ResearchDataPipelineDashboard } from './pages/ResearchDataPipelineDashboard';
import { ResearchExperimentsDashboard } from './pages/ResearchExperimentsDashboard';
import { ResearchModelsDashboard } from './pages/ResearchModelsDashboard';
import { ResearchModelRegistryDashboard } from './pages/ResearchModelRegistryDashboard';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { BusinessAnalyticsDashboard } from './pages/BusinessAnalyticsDashboard';
import { ExecutiveGrowthDashboard } from './pages/ExecutiveGrowthDashboard';
import { CloudCostsDashboard } from './pages/CloudCostsDashboard';
import { AdminUsersDashboard } from './pages/AdminUsersDashboard';
import { AdminRolesDashboard } from './pages/AdminRolesDashboard';
import { AdminOrganizationsDashboard } from './pages/AdminOrganizationsDashboard';
import { AdminFeatureFlagsDashboard } from './pages/AdminFeatureFlagsDashboard';
import { AdminApiKeysDashboard } from './pages/AdminApiKeysDashboard';
import { AdminBillingDashboard } from './pages/AdminBillingDashboard';
import { AdminSettingsDashboard } from './pages/AdminSettingsDashboard';
import { DocumentationPortalDashboard } from './pages/DocumentationPortalDashboard';
import { ApiExplorerDashboard } from './pages/ApiExplorerDashboard';
import { RunbooksPortalDashboard } from './pages/RunbooksPortalDashboard';
import { UserGuidePortalDashboard } from './pages/UserGuidePortalDashboard';
import { AdminGuidePortalDashboard } from './pages/AdminGuidePortalDashboard';
import { EnterpriseMarketOverviewDashboard } from './pages/EnterpriseMarketOverviewDashboard';
import { TradingTerminalDashboard } from './pages/TradingTerminalDashboard';
import { TradingPerformanceDashboard } from './pages/TradingPerformanceDashboard';
import { MarketAnalyticsDashboard } from './pages/MarketAnalyticsDashboard';
import { AIRobotsDashboard } from './pages/AIRobotsDashboard';
import { StrategyToolsDashboard } from './pages/StrategyToolsDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingDashboard />} />
          <Route path="/login" element={<LoginDashboard />} />
          <Route path="/register" element={<RegisterDashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/page/:pageId" element={<StaticPage />} />
          <Route path="/privacy-policy" element={<StaticPage pageIdOverride="privacy" />} />
          <Route path="/terms" element={<StaticPage pageIdOverride="terms" />} />
          <Route path="/disclosures" element={<StaticPage pageIdOverride="disclosures" />} />
          
          {/* Protected Routes (requires login) */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/home" element={<HomeDashboard />} />
              <Route path="/index" element={<HomeDashboard />} />
              <Route path="/dashboard" element={<HomeDashboard />} />
              <Route path="/dashboard/home" element={<HomeDashboard />} />
              <Route path="/dashboard/market-overview" element={<EnterpriseMarketOverviewDashboard />} />
              <Route path="/enterprise/market-overview" element={<EnterpriseMarketOverviewDashboard />} />
              <Route path="/portfolio" element={<TradingDashboard />} />
              <Route path="/paper" element={<TradingDashboard />} />
              <Route path="/watchlist" element={<TradingDashboard />} />
              <Route path="/performance" element={<TradingDashboard />} />
              <Route path="/dashboard/portfolio" element={<TradingDashboard />} />
              <Route path="/dashboard/trading" element={<TradingDashboard />} />
              
              <Route path="/live" element={<LiveDashboard />} />
              <Route path="/dashboard/live" element={<LiveDashboard />} />
              <Route path="/journal" element={<JournalDashboard />} />
              <Route path="/history" element={<JournalDashboard />} />
              <Route path="/dashboard/journal" element={<JournalDashboard />} />
              
              <Route path="/market" element={<MarketDashboard />} />
              <Route path="/markets" element={<MarketDashboard />} />
              <Route path="/dashboard/market" element={<MarketDashboard />} />
              <Route path="/dashboard/markets" element={<MarketDashboard />} />
              <Route path="/macro" element={<MacroDashboard />} />
              <Route path="/dashboard/macro" element={<MacroDashboard />} />
              
              <Route path="/predict" element={<ResearchDashboard />} />
              <Route path="/research" element={<ResearchDashboard />} />
              <Route path="/dashboard/research" element={<ResearchDashboard />} />
              <Route path="/model-metrics" element={<ModelMetricsDashboard />} />
              <Route path="/track-record" element={<TrackRecordDashboard />} />
              <Route path="/leaderboard" element={<LeaderboardDashboard />} />
              <Route path="/traders" element={<TradersDashboard />} />
              
              <Route path="/screener" element={<ScreenerDashboard />} />
              <Route path="/dashboard/screener" element={<ScreenerDashboard />} />
              <Route path="/bots" element={<BotsDashboard />} />
              <Route path="/dashboard/bots" element={<BotsDashboard />} />
              
              {/* Alternative Machine Learning Routes */}
              <Route path="/ml/drift" element={<BotsDashboard />} />
              <Route path="/ml/models" element={<ResearchModelsDashboard />} />
              <Route path="/ml/registry" element={<ResearchModelRegistryDashboard />} />
              <Route path="/ml/experiments" element={<ResearchExperimentsDashboard />} />
              <Route path="/ml/pipeline" element={<ResearchDataPipelineDashboard />} />
              <Route path="/ml/xai" element={<BotsDashboard />} />
              <Route path="/ml/feature-store" element={<ResearchDatasetsDashboard />} />

              {/* Alternative Trading Routes */}
              <Route path="/trading/supervisor" element={<TradingSupervisorDashboard />} />
              <Route path="/supervisor" element={<TradingSupervisorDashboard />} />
              <Route path="/dashboard/supervisor" element={<TradingSupervisorDashboard />} />
              <Route path="/trading/smartexecution" element={<SmartExecutionDashboard />} />
              <Route path="/trading/smart-execution" element={<SmartExecutionDashboard />} />
              <Route path="/smartexecution" element={<SmartExecutionDashboard />} />
              <Route path="/dashboard/smartexecution" element={<SmartExecutionDashboard />} />
              <Route path="/trading/signals" element={<TradingSignalsDashboard />} />
              <Route path="/signals" element={<TradingSignalsDashboard />} />
              <Route path="/dashboard/signals" element={<TradingSignalsDashboard />} />
              <Route path="/trading/orders" element={<OrdersDashboard />} />
              <Route path="/orders" element={<OrdersDashboard />} />
              <Route path="/dashboard/orders" element={<OrdersDashboard />} />
              <Route path="/trading/positions" element={<PositionsDashboard />} />
              <Route path="/positions" element={<PositionsDashboard />} />
              <Route path="/dashboard/positions" element={<PositionsDashboard />} />
              <Route path="/portfolio/holdings" element={<PortfolioHoldingsDashboard />} />
              <Route path="/holdings" element={<PortfolioHoldingsDashboard />} />
              <Route path="/dashboard/holdings" element={<PortfolioHoldingsDashboard />} />
              <Route path="/portfolio/analytics" element={<PortfolioAnalyticsDashboard />} />
              <Route path="/portfolio/allocation" element={<PortfolioAllocationDashboard />} />
              <Route path="/portfolio/performance" element={<PortfolioPerformanceDashboard />} />
              <Route path="/portfolio/risk" element={<PortfolioRiskDashboard />} />
              <Route path="/researchlab/projects" element={<ResearchProjectsDashboard />} />
              <Route path="/researchlab/datasets" element={<ResearchDatasetsDashboard />} />
              <Route path="/researchlab/datapipeline" element={<ResearchDataPipelineDashboard />} />
              <Route path="/researchlab/experiments" element={<ResearchExperimentsDashboard />} />
              <Route path="/researchlab/models" element={<ResearchModelsDashboard />} />
              <Route path="/researchlab/modelregistry" element={<ResearchModelRegistryDashboard />} />
              <Route path="/executive/dashboard" element={<ExecutiveDashboard />} />
              <Route path="/executive/business-analytics" element={<BusinessAnalyticsDashboard />} />
              <Route path="/executive/growth" element={<ExecutiveGrowthDashboard />} />
              <Route path="/executive/cloud-costs" element={<CloudCostsDashboard />} />
              <Route path="/admin/users" element={<AdminUsersDashboard />} />
              <Route path="/admin/roles" element={<AdminRolesDashboard />} />
              <Route path="/admin/organizations" element={<AdminOrganizationsDashboard />} />
              <Route path="/admin/feature-flags" element={<AdminFeatureFlagsDashboard />} />
              <Route path="/admin/api-keys" element={<AdminApiKeysDashboard />} />
              <Route path="/admin/billing" element={<AdminBillingDashboard />} />
              <Route path="/admin/settings" element={<AdminSettingsDashboard />} />
              <Route path="/knowledge/documentation" element={<DocumentationPortalDashboard />} />
              <Route path="/knowledge/api-explorer" element={<ApiExplorerDashboard />} />
              <Route path="/knowledge/runbooks" element={<RunbooksPortalDashboard />} />
              <Route path="/knowledge/user-guide" element={<UserGuidePortalDashboard />} />
              <Route path="/knowledge/admin-guide" element={<AdminGuidePortalDashboard />} />
              <Route path="/trading/portfolio" element={<TradingDashboard />} />
              <Route path="/trading/performance" element={<TradingPerformanceDashboard />} />
              <Route path="/trading/journal" element={<JournalDashboard />} />
              <Route path="/trading/tradingterminal" element={<TradingTerminalDashboard />} />
              <Route path="/trading/marketanalytics" element={<MarketAnalyticsDashboard />} />
              <Route path="/trading/airobots" element={<AIRobotsDashboard />} />
              <Route path="/trading/strategytools" element={<StrategyToolsDashboard />} />
              <Route path="/trading/strategies" element={<TradingStrategiesDashboard />} />
              <Route path="/strategies" element={<TradingStrategiesDashboard />} />
              <Route path="/dashboard/strategies" element={<TradingStrategiesDashboard />} />
              <Route path="/trading/market" element={<MarketDashboard />} />
              <Route path="/trading/markets" element={<MarketDashboard />} />

              {/* Alternative Risk Routes */}
              <Route path="/risk/greeks" element={<RiskDashboard />} />
              <Route path="/risk/monte-carlo" element={<ToolsDashboard />} />
              <Route path="/risk/var" element={<RiskDashboard />} />
              <Route path="/risk/expected-shortfall" element={<RiskDashboard />} />
              <Route path="/risk/stress-testing" element={<RiskDashboard />} />

              {/* Alternative Operations Routes */}
              <Route path="/ops/incidents" element={<ScreenerDashboard />} />
              <Route path="/ops/traces" element={<AdminDashboard />} />
              <Route path="/ops/metrics" element={<AdminDashboard />} />
              <Route path="/ops/logs" element={<AdminDashboard />} />
              <Route path="/ops/chaos" element={<AdminDashboard />} />
              <Route path="/ops/health" element={<ScreenerDashboard />} />
              <Route path="/ops/slos" element={<ScreenerDashboard />} />

              {/* Alternative Administration Routes */}
              <Route path="/admin/secrets" element={<AdminApiKeysDashboard />} />
              <Route path="/admin/compliance" element={<AdminGuidePortalDashboard />} />
              <Route path="/admin/deployments" element={<DeploymentDashboard />} />
              <Route path="/admin/security-center" element={<SecurityCenterDashboard />} />
              
              <Route path="/tools" element={<ToolsDashboard />} />
              <Route path="/dashboard/tools" element={<ToolsDashboard />} />
              <Route path="/scanner" element={<ScannerDashboard />} />
              <Route path="/dashboard/scanner" element={<ScannerDashboard />} />
              <Route path="/alerts" element={<AlertsDashboard />} />
              <Route path="/dashboard/alerts" element={<AlertsDashboard />} />
              <Route path="/pipeline" element={<PipelineDashboard />} />
              <Route path="/dashboard/pipeline" element={<PipelineDashboard />} />
              <Route path="/risk" element={<RiskDashboard />} />
              <Route path="/dashboard/risk" element={<RiskDashboard />} />
              <Route path="/mt5" element={<LiveDashboard />} />
              <Route path="/calendar" element={<CalendarDashboard />} />
              <Route path="/dashboard/calendar" element={<CalendarDashboard />} />
              <Route path="/backtest" element={<BacktestDashboard />} />
              <Route path="/dashboard/backtest" element={<BacktestDashboard />} />
              <Route path="/resources" element={<ResourcesDashboard />} />
              <Route path="/dashboard/resources" element={<ResourcesDashboard />} />
              <Route path="/faq" element={<StaticPage pageIdOverride="faq" />} />
              <Route path="/risk-basics" element={<StaticPage pageIdOverride="risk_basics" />} />
              <Route path="/data-sources" element={<StaticPage pageIdOverride="data_sources" />} />
              <Route path="/methodology" element={<StaticPage pageIdOverride="methodology" />} />

              <Route path="/settings" element={<SettingsDashboard />} />
              <Route path="/dashboard/settings" element={<SettingsDashboard />} />
              <Route path="/pricing" element={<PricingDashboard />} />
              <Route path="/dashboard/pricing" element={<PricingDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
                  <h1 className="text-4xl font-bold text-nexus-white">404 — Page Not Found</h1>
                  <p className="text-xs text-nexus-muted max-w-md">The requested workspace or URL resource could not be located in the Triple Fusion Operating System registry.</p>
                  <a href="/home" className="px-4 py-2 bg-nexus-pur text-white text-xs font-bold rounded-xl shadow-lg hover:bg-nexus-pur/80 transition">Return to Command Center</a>
                </div>
              } />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
