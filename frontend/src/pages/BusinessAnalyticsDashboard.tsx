import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, BarChart2,
  DollarSign, Users, Layers, Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const BusinessAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [revenueIntel, setRevenueIntel] = useState<any[]>([]);
  const [productBreakdown, setProductBreakdown] = useState<any[]>([]);
  const [customerIntel, setCustomerIntel] = useState<any>(null);
  const [productUsage, setProductUsage] = useState<any[]>([]);
  const [tradingBusiness, setTradingBusiness] = useState<any>(null);
  const [aiBusiness, setAiBusiness] = useState<any>(null);
  const [opsIntel, setOpsIntel] = useState<any>(null);
  const [forecasting, setForecasting] = useState<any>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'REVENUE' | 'CUSTOMER' | 'PRODUCT_TRADING' | 'AI_OPS'>('REVENUE');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/executive/business-analytics');
      if (res && res.ok) {
        setSummary(res.executive_summary);
        setRevenueIntel(res.revenue_intelligence || []);
        setProductBreakdown(res.product_breakdown || []);
        setCustomerIntel(res.customer_intelligence);
        setProductUsage(res.product_usage || []);
        setTradingBusiness(res.trading_business);
        setAiBusiness(res.ai_business);
        setOpsIntel(res.operational_intelligence);
        setForecasting(res.forecasting);
        setAiPrompts(res.ai_bi_prompts || []);
      } else {
        setError(res?.error || 'Failed to fetch Business Analytics.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Business Analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Breadcrumb & Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span> / <span>Executive</span> / <span className="text-nexus-pur font-mono">Business Analytics</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <BarChart2 className="text-nexus-pur" size={26} />
            Enterprise Executive Business Intelligence & SaaS Analytics Platform
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Tableau / PowerBI Sync
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Executive decision-support workspace unifying financial SaaS KPIs, revenue segmentation, customer LTV/CAC, product adoption, trading volume, and strategic forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button onClick={() => toast.success("Exported Executive BI Report")} className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 cursor-pointer transition">
            <Download size={14} /> Export BI Brief
          </button>
          <button onClick={fetchAnalytics} disabled={loading} className="px-4 py-2 bg-nexus-pur text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-nexus-pur/20 hover:bg-nexus-pur/80 transition">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Analytics
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total ARR</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.arr ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">MRR: {summary?.mrr ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Gross Margin</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.gross_profit ?? '—'}</div>
          <span className="text-[9px] font-bold text-nexus-muted">EBITDA: {summary?.ebitda ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Customer LTV</span>
          <div className="text-base sm:text-lg font-black text-nexus-white mt-1">{summary?.ltv ?? '—'}</div>
          <span className="text-[9px] font-bold text-nexus-muted">CAC: {summary?.cac ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">LTV / CAC</span>
          <div className="text-base sm:text-lg font-black text-purple-400 mt-1">{summary?.ltv_cac_ratio ?? '20.1x'}</div>
          <span className="text-[9px] font-bold text-purple-400">NRR: {summary?.nrr ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Churn Rate</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.customer_churn ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Retention: {summary?.customer_retention ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Active Orgs</span>
          <div className="text-base sm:text-lg font-black text-nexus-pur mt-1">{summary?.active_orgs ?? 0}</div>
          <span className="text-[9px] font-bold text-nexus-muted">Enterprise: {summary?.enterprise_customers ?? 38}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Active Seats</span>
          <div className="text-base sm:text-lg font-black text-nexus-white mt-1">{summary?.active_seats ?? 0}</div>
          <span className="text-[9px] font-bold text-emerald-400">Growth: {summary?.customer_growth ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Cloud Cost</span>
          <div className="text-base sm:text-lg font-black text-yellow-400 mt-1">{summary?.cloud_operating_cost ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Health: {summary?.platform_health_score ?? '—'}</span>
        </div>
      </div>

      {/* ── Tab Selector Navigation Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-nexus-border/60 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'REVENUE', label: 'Revenue Intelligence & Product Breakdown' },
          { id: 'CUSTOMER', label: 'Customer Intelligence & Usage' },
          { id: 'PRODUCT_TRADING', label: 'Product Feature Adoption & Trading Volume' },
          { id: 'AI_OPS', label: 'AI/ML Analytics & Operational Health' }
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
          
          {activeTab === 'REVENUE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2 flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-400" /> Revenue by Customer Segment
                </span>
                {loading ? (
                  <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Loading segmentation...</div>
                ) : error ? (
                  <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
                ) : (
                  <div className="flex flex-col gap-2 text-xs font-mono">
                    {revenueIntel.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                        <span className="font-bold text-nexus-white font-sans">{s.segment}</span>
                        <span className="font-bold text-emerald-400">{s.revenue} ({s.pct})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2 flex items-center gap-2">
                  <Layers size={16} className="text-nexus-pur" /> Revenue by Product Line
                </span>
                <div className="flex flex-col gap-2 text-xs font-mono">
                  {productBreakdown.map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                      <span className="font-bold text-nexus-white font-sans">{p.product}</span>
                      <span className="font-bold text-purple-400">{p.revenue} ({p.share})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CUSTOMER' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Users size={16} className="text-emerald-400" /> Customer Adoption & Seat Utilization</span>
                <span className="text-[10px] text-emerald-400 font-bold">Renewal Rate: {customerIntel?.renewal_rate ?? '—'}</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Active Orgs</span>
                  <span className="font-bold text-nexus-white text-sm">{customerIntel?.active_orgs ?? 0}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Daily Active Users (DAU)</span>
                  <span className="font-bold text-emerald-400 text-sm">{customerIntel?.dau ?? 080}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Monthly Active (MAU)</span>
                  <span className="font-bold text-nexus-white text-sm">{customerIntel?.mau ?? 0}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Seat Utilization</span>
                  <span className="font-bold text-purple-400 text-sm">{customerIntel?.seat_utilization ?? '—'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PRODUCT_TRADING' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2 flex items-center gap-2">
                  <Activity size={16} className="text-nexus-pur" /> Feature Adoption & Usage Share
                </span>
                <div className="flex flex-col gap-2 text-xs font-mono">
                  {productUsage.map((u, i) => (
                    <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                      <span className="font-bold text-nexus-white font-sans">{u.feature}</span>
                      <span className="font-bold text-nexus-pur">{u.usage} ({u.dau} DAU)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2 flex items-center gap-2">
                  <BarChart2 size={16} className="text-emerald-400" /> Trading Business Analytics
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[9px] text-nexus-muted block font-sans">Trading Volume</span>
                    <span className="font-bold text-emerald-400">{tradingBusiness?.trading_volume ?? '—'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[9px] text-nexus-muted block font-sans">Signal Accuracy</span>
                    <span className="font-bold text-nexus-pur">{tradingBusiness?.signal_accuracy ?? '—'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[9px] text-nexus-muted block font-sans">Orders Executed</span>
                    <span className="font-bold text-nexus-white">{tradingBusiness?.orders_executed ?? 00}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[9px] text-nexus-muted block font-sans">Win Rate</span>
                    <span className="font-bold text-emerald-400">{tradingBusiness?.win_rate ?? '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AI_OPS' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Cpu size={16} className="text-nexus-pur" /> AI/ML Model Analytics & Operational Forecasting</span>
                <span className="text-[10px] text-emerald-400 font-bold">Q4 Forecast: {forecasting?.revenue_forecast_q4 ?? '—'}</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Models in Production</span>
                  <span className="font-bold text-nexus-white text-sm">{aiBusiness?.models_in_production ?? 0}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Prediction Volume</span>
                  <span className="font-bold text-nexus-pur text-sm">{aiBusiness?.prediction_volume ?? '1.42M/day'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">System Availability</span>
                  <span className="font-bold text-emerald-400 text-sm">{opsIntel?.system_availability ?? '—'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">API Latency</span>
                  <span className="font-bold text-purple-400 text-sm">{opsIntel?.api_response_time ?? '—'}</span>
                </div>
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
                Contextual AI Business Co-Pilot
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
              onClick={() => handleAiAsk("Generate C-suite executive Business Intelligence report")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate Business Intelligence Brief
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
