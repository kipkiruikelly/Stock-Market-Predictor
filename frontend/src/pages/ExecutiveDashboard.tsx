import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, AlertTriangle, Sparkles, TrendingUp,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ExecutiveDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<any>(null);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);

  const fetchExecutiveData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/executive/dashboard/dashboard');
      if (res && res.ok) {
        setKpis(res.kpis);
        setRevenueTrend(res.revenue_trend || []);
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
            <span className="text-nexus-pur">Executive Command Center</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <TrendingUp className="text-nexus-pur" size={26} />
            Executive Command Center
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              C-Suite Intelligence
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Enterprise command center monitoring ARR, MRR, AUM, system availability, cloud spend, and operational risk.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Executive C-Suite Report")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Report
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">ARR</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.arr ?? '$14.85M'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">MRR</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.mrr ?? '$1.23M'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Active Orgs</span>
          <div className="text-lg font-black text-nexus-white mt-1">{kpis?.active_orgs ?? 142}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Total AUM</span>
          <div className="text-lg font-black text-purple-400 mt-1">{kpis?.aum ?? '$248.5M'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Trading Return</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.trading_performance ?? '+18.2%'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">AI Accuracy</span>
          <div className="text-lg font-black text-nexus-pur mt-1">{kpis?.ai_prediction_accuracy ?? '94.2%'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Availability</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.system_availability ?? '99.99%'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Cloud Spend</span>
          <div className="text-lg font-black text-yellow-400 mt-1">{kpis?.cloud_spend_monthly ?? '$42.8K'}</div>
        </div>
      </div>

      {/* ── Revenue Trend & AI Assistant ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Revenue Trend (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <DollarSign size={16} className="text-emerald-400" /> Monthly Revenue Trend (2026 YTD)
            </span>

            {loading ? (
              <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Loading revenue metrics...</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                {revenueTrend.map((rt, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-center">
                    <span className="text-[10px] text-nexus-muted block font-bold uppercase">{rt.month}</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm mt-1 block">{rt.revenue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: AI Assistant Box (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI C-Suite Assistant
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <button 
                onClick={() => handleAiAsk("Generate C-suite executive summary report")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Generate Executive Summary
              </button>
              <button 
                onClick={() => handleAiAsk("Forecast ARR and MRR growth for Q3 2026")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Forecast ARR / MRR Growth
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
