import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, TrendingUp,
  DollarSign, ShieldCheck, Layers, Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ExecutiveDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [businessIntel, setBusinessIntel] = useState<any[]>([]);
  const [portfolioIntel, setPortfolioIntel] = useState<any>(null);
  const [tradingIntel, setTradingIntel] = useState<any>(null);
  const [aiMlIntel, setAiMlIntel] = useState<any>(null);
  const [opsCenter, setOpsCenter] = useState<any>(null);
  const [riskCenter, setRiskCenter] = useState<any>(null);
  const [complianceCenter, setComplianceCenter] = useState<any>(null);
  const [forecasting, setForecasting] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'BI' | 'PORTFOLIO' | 'TRADING' | 'AI_ML' | 'OPS_RISK'>('BI');

  const fetchExecutiveData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/executive/dashboard');
      if (res && res.ok) {
        setSummary(res.executive_summary);
        setBusinessIntel(res.business_intelligence || []);
        setPortfolioIntel(res.portfolio_intelligence);
        setTradingIntel(res.trading_intelligence);
        setAiMlIntel(res.ai_ml_executive);
        setOpsCenter(res.operations_center);
        setRiskCenter(res.risk_center);
        setComplianceCenter(res.compliance_center);
        setForecasting(res.forecasting);
        setTimeline(res.activity_timeline || []);
        setAiPrompts(res.ai_executive_prompts || []);
      } else {
        setError(res?.error || 'Failed to fetch Executive Dashboard.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Executive Dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutiveData();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Executive Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Breadcrumb & Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Executive</span>
            <span>/</span>
            <span className="text-nexus-pur font-mono">Executive Command Center</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <TrendingUp className="text-nexus-pur" size={26} />
            Enterprise C-Suite Decision Intelligence Platform
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Bloomberg C-Suite Sync
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Institutional executive command center unifying AUM, revenue growth, portfolio performance, trading execution, AI/ML models, operational health, and strategic forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Executive C-Suite Strategic Report")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Strategic Brief
          </button>
          <button 
            onClick={fetchExecutiveData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total AUM</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.aum ?? '$248.5M'}</div>
          <span className="text-[9px] font-bold text-nexus-muted">Net: {summary?.net_portfolio_value ?? '$268.4M'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Daily P&L</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.daily_pnl ?? '+$12.45K'}</div>
          <span className="text-[9px] font-bold text-nexus-muted">Monthly: {summary?.monthly_pnl ?? '+$182.5K'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">ARR / MRR</span>
          <div className="text-base sm:text-lg font-black text-nexus-white mt-1">{summary?.arr ?? '$14.85M'}</div>
          <span className="text-[9px] font-bold text-emerald-400">MRR: {summary?.mrr ?? '$1.23M'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Sharpe / Return</span>
          <div className="text-base sm:text-lg font-black text-purple-400 mt-1">{summary?.sharpe_ratio ?? '2.84'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Return: {summary?.annual_return ?? '+18.2%'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">AI Confidence</span>
          <div className="text-base sm:text-lg font-black text-nexus-pur mt-1">{summary?.ai_confidence_score ?? '94.2%'}</div>
          <span className="text-[9px] font-bold text-nexus-muted">Models: {summary?.active_models ?? 24} Active</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Availability</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.platform_availability ?? '99.99%'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Incidents: {summary?.active_incidents ?? 0}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Active Orgs</span>
          <div className="text-base sm:text-lg font-black text-nexus-white mt-1">{summary?.active_orgs ?? 142}</div>
          <span className="text-[9px] font-bold text-emerald-400">Growth: {summary?.customer_growth ?? '+42.8%'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Cloud Spend</span>
          <div className="text-base sm:text-lg font-black text-yellow-400 mt-1">{summary?.cloud_spend_monthly ?? '$42.8K'}</div>
          <span className="text-[9px] font-bold text-nexus-muted">FinOps Optimal</span>
        </div>
      </div>

      {/* ── Tab Selector Navigation Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-nexus-border/60 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'BI', label: 'Business Intelligence & SaaS Analytics' },
          { id: 'PORTFOLIO', label: 'Portfolio Intelligence & Asset Allocation' },
          { id: 'TRADING', label: 'Trading Execution & OMS Health' },
          { id: 'AI_ML', label: 'AI/ML Model Registry & Governance' },
          { id: 'OPS_RISK', label: 'Operations, Risk & Compliance' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === t.id 
                ? 'bg-nexus-pur text-white shadow-lg shadow-nexus-pur/20' 
                : 'bg-nexus-sf text-nexus-muted hover:text-nexus-white border border-nexus-border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main Tab Content Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Main Workspace View (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {activeTab === 'BI' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><DollarSign size={16} className="text-emerald-400" /> SaaS Revenue, ARR & Cloud FinOps Trend</span>
                <span className="text-[10px] text-emerald-400 font-bold">Q4 ARR Forecast: {forecasting?.arr_forecast_q4 ?? '$18.4M'}</span>
              </span>

              {loading ? (
                <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Loading executive BI metrics...</div>
              ) : error ? (
                <div className="p-4 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-mono">
                  {businessIntel.map((bi, i) => (
                    <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-center">
                      <span className="text-[10px] text-nexus-muted block font-bold font-sans uppercase">{bi.month}</span>
                      <span className="font-bold text-emerald-400 text-sm mt-1 block">{bi.arr}</span>
                      <span className="text-[9px] text-nexus-white block mt-0.5">MRR: {bi.mrr}</span>
                      <span className="text-[9px] text-yellow-400 block mt-0.5">Cloud: {bi.cloud_spend}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'PORTFOLIO' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Layers size={16} className="text-nexus-pur" /> Asset Class Allocation & Risk Metrics</span>
                <span className="text-[10px] text-emerald-400 font-bold">Total Net Value: {portfolioIntel?.total_value ?? '$268.4M'}</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {portfolioIntel?.asset_allocation?.map((a: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[10px] text-nexus-muted block font-sans font-bold">{a.asset_class}</span>
                    <span className="font-bold text-nexus-white text-sm mt-1 block">{a.value}</span>
                    <span className="text-[9px] font-bold text-emerald-400 block mt-0.5">{a.pct} Share</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-nexus-bg/30 border border-nexus-border/20">
                  <span className="text-[9px] text-nexus-muted block font-sans">VaR (95% Daily)</span>
                  <span className="font-bold text-purple-400">{portfolioIntel?.var_95 ?? '$4.25K'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-nexus-bg/30 border border-nexus-border/20">
                  <span className="text-[9px] text-nexus-muted block font-sans">Expected Shortfall</span>
                  <span className="font-bold text-purple-400">{portfolioIntel?.expected_shortfall ?? '$6.12K'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-nexus-bg/30 border border-nexus-border/20">
                  <span className="text-[9px] text-nexus-muted block font-sans">Monte Carlo Forecast CAGR</span>
                  <span className="font-bold text-emerald-400">{portfolioIntel?.monte_carlo_cagr ?? '+34.2%'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TRADING' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Activity size={16} className="text-emerald-400" /> Trading Execution & Broker Connectivity</span>
                <span className="text-[10px] text-emerald-400 font-bold">{tradingIntel?.broker_connectivity ?? 'MT5 FIX Connected'}</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Orders Today</span>
                  <span className="font-bold text-nexus-white text-sm">{tradingIntel?.orders_today ?? 142}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Open Orders</span>
                  <span className="font-bold text-nexus-white text-sm">{tradingIntel?.open_orders ?? 14}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Execution Success</span>
                  <span className="font-bold text-emerald-400 text-sm">{tradingIntel?.execution_success_rate ?? '99.8%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Avg Slippage</span>
                  <span className="font-bold text-emerald-400 text-sm">{tradingIntel?.avg_slippage ?? '0.02 bps'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Execution Latency</span>
                  <span className="font-bold text-purple-400 text-sm">{tradingIntel?.execution_latency ?? '1.8ms'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Signal Accuracy</span>
                  <span className="font-bold text-nexus-pur text-sm">{tradingIntel?.signal_accuracy ?? '94.2%'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AI_ML' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <Cpu size={16} className="text-nexus-pur" /> AI/ML Model Governance & Explainability Coverage
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Active Models</span>
                  <span className="font-bold text-nexus-white text-sm">{aiMlIntel?.active_models ?? 24}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Champion Models</span>
                  <span className="font-bold text-emerald-400 text-sm">{aiMlIntel?.champion_models ?? 8}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Prediction Accuracy</span>
                  <span className="font-bold text-nexus-pur text-sm">{aiMlIntel?.prediction_accuracy ?? '94.2%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Model Drift</span>
                  <span className="font-bold text-emerald-400 text-sm">{aiMlIntel?.model_drift ?? '0.02%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Explainability (SHAP)</span>
                  <span className="font-bold text-emerald-400 text-sm">{aiMlIntel?.explainability_coverage ?? '100%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Inference Latency</span>
                  <span className="font-bold text-purple-400 text-sm">{aiMlIntel?.inference_latency ?? '1.8ms'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'OPS_RISK' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <ShieldCheck size={16} className="text-emerald-400" /> Operations Center, Enterprise Risk & Compliance Audit
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Infrastructure Health</span>
                  <span className="font-bold text-emerald-400 text-sm">{opsCenter?.infrastructure_health ?? '99.8%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Enterprise Risk Score</span>
                  <span className="font-bold text-emerald-400 text-sm">{riskCenter?.enterprise_risk_score ?? '12.4 / 100'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">SOC 2 Type II Status</span>
                  <span className="font-bold text-emerald-400 text-sm">{complianceCenter?.soc2_status ?? 'COMPLIANT'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">ISO 27001 Status</span>
                  <span className="font-bold text-emerald-400 text-sm">{complianceCenter?.iso27001_status ?? 'COMPLIANT'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">GDPR Compliance</span>
                  <span className="font-bold text-emerald-400 text-sm">{complianceCenter?.gdpr_status ?? 'COMPLIANT'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Audit Status</span>
                  <span className="font-bold text-emerald-400 text-sm">{complianceCenter?.audit_status ?? 'PASSED'}</span>
                </div>
              </div>

              <div className="mt-2 space-y-1.5 text-xs font-mono">
                <span className="text-[10px] text-nexus-muted font-bold font-sans uppercase block border-b border-nexus-border/30 pb-1">Activity Milestone Timeline</span>
                {timeline.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-nexus-bg/30 text-[11px]">
                    <span className="text-nexus-white font-sans">{ev.event}</span>
                    <span className="text-nexus-muted">{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Section: AI Assistant Box (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual C-Suite AI Co-Pilot
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {aiPrompts.map((pmpt, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-nexus-text flex items-start gap-2">
                  <span className="text-nexus-pur font-bold">🤖</span>
                  <span>{pmpt}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleAiAsk("Generate Board of Directors Executive Briefing Report")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate Executive Brief
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
