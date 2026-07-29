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
              <Route path="/portfolio" element={<TradingDashboard />} />
              <Route path="/paper" element={<TradingDashboard />} />
              <Route path="/watchlist" element={<TradingDashboard />} />
              <Route path="/performance" element={<TradingDashboard />} />
              
              <Route path="/live" element={<LiveDashboard />} />
              <Route path="/journal" element={<JournalDashboard />} />
              <Route path="/history" element={<JournalDashboard />} />
              
              <Route path="/market" element={<MarketDashboard />} />
              <Route path="/markets" element={<MarketDashboard />} />
              <Route path="/macro" element={<MacroDashboard />} />
              
              <Route path="/predict" element={<ResearchDashboard />} />
              <Route path="/research" element={<ResearchDashboard />} />
              <Route path="/model-metrics" element={<ModelMetricsDashboard />} />
              <Route path="/track-record" element={<TrackRecordDashboard />} />
              <Route path="/leaderboard" element={<LeaderboardDashboard />} />
              <Route path="/traders" element={<TradersDashboard />} />
              
              <Route path="/screener" element={<ScreenerDashboard />} />
              <Route path="/bots" element={<BotsDashboard />} />
              
              {/* Alternative Machine Learning Routes */}
              <Route path="/ml/drift" element={<BotsDashboard />} />
              <Route path="/ml/models" element={<PipelineDashboard />} />
              <Route path="/ml/registry" element={<PipelineDashboard />} />
              <Route path="/ml/experiments" element={<ResearchDashboard />} />
              <Route path="/ml/pipeline" element={<PipelineDashboard />} />
              <Route path="/ml/xai" element={<BotsDashboard />} />
              <Route path="/ml/feature-store" element={<ResearchDashboard />} />

              {/* Alternative Trading Routes */}
              <Route path="/trading/orders" element={<LiveDashboard />} />
              <Route path="/trading/positions" element={<LiveDashboard />} />
              <Route path="/trading/portfolio" element={<TradingDashboard />} />
              <Route path="/trading/performance" element={<TradingDashboard />} />
              <Route path="/trading/journal" element={<JournalDashboard />} />
              <Route path="/trading/strategies" element={<ToolsDashboard />} />

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
              <Route path="/admin/users" element={<AdminDashboard />} />
              <Route path="/admin/roles" element={<AdminDashboard />} />
              <Route path="/admin/feature-flags" element={<AdminDashboard />} />
              <Route path="/admin/secrets" element={<AdminDashboard />} />
              <Route path="/admin/billing" element={<AdminDashboard />} />
              <Route path="/admin/compliance" element={<AdminDashboard />} />
              
              <Route path="/tools" element={<ToolsDashboard />} />
              <Route path="/scanner" element={<ScannerDashboard />} />
              <Route path="/alerts" element={<AlertsDashboard />} />
              <Route path="/pipeline" element={<PipelineDashboard />} />
              <Route path="/risk" element={<RiskDashboard />} />
              <Route path="/mt5" element={<LiveDashboard />} />
              <Route path="/calendar" element={<CalendarDashboard />} />
              <Route path="/backtest" element={<BacktestDashboard />} />
              <Route path="/resources" element={<ResourcesDashboard />} />
              <Route path="/faq" element={<StaticPage pageIdOverride="faq" />} />
              <Route path="/risk-basics" element={<StaticPage pageIdOverride="risk_basics" />} />
              <Route path="/data-sources" element={<StaticPage pageIdOverride="data_sources" />} />
              <Route path="/methodology" element={<StaticPage pageIdOverride="methodology" />} />

              <Route path="/settings" element={<SettingsDashboard />} />
              <Route path="/pricing" element={<PricingDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<div className="p-10 text-center text-[#a0a5b1]">Page under construction</div>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
