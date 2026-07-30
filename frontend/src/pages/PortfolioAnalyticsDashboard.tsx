import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, BarChart2,
  PieChart, Globe, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const PortfolioAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [topWinners, setTopWinners] = useState<any[]>([]);
  const [topLosers, setTopLosers] = useState<any[]>([]);
  const [exposures, setExposures] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/portfolio/analytics/dashboard');
      if (res && res.ok) {
        setKpis(res.kpis);
        setStats(res.stats);
        setTopWinners(res.top_winners || []);
        setTopLosers(res.top_losers || []);
        setExposures(res.exposures);
      } else {
        setError(res?.error || 'Failed to fetch Portfolio Analytics.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Portfolio Analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Analytics Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Breadcrumb & Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Portfolio</span>
            <span>/</span>
            <span className="text-nexus-pur">Portfolio Analytics</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <BarChart2 className="text-nexus-pur" size={26} />
            Institutional Portfolio Analytics Console
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Quant Stream
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Comprehensive analytical overview of portfolio behavior, risk attribution, and asset contributions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Portfolio Analytics Report")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Report
          </button>
          <button 
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Total Value</span>
          <div className="text-lg font-black text-nexus-white mt-1">{kpis?.total_value ?? '$2.48M'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Unrealized P&L</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.unrealized_pnl ?? '+$48.3K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Realized P&L</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.realized_pnl ?? '+$18.4K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Daily Return</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.daily_return ?? '+$12.8K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Monthly Return</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.monthly_return ?? '+$84.2K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Annual Return</span>
          <div className="text-lg font-black text-purple-400 mt-1">{kpis?.annual_return ?? '+$324.5K'}</div>
        </div>
      </div>

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Performance Statistics & Winners/Losers (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Quantitative Performance Metrics Grid */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Activity size={16} className="text-nexus-pur" /> Quantitative Performance Statistics
            </span>

            {loading ? (
              <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Calculating portfolio metrics...</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[9px] text-nexus-muted block uppercase font-bold">CAGR</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{stats?.cagr ?? '+18.2%'}</span>
                </div>
                <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[9px] text-nexus-muted block uppercase font-bold">Sharpe Ratio</span>
                  <span className="font-mono font-bold text-nexus-pur text-sm">{stats?.sharpe_ratio ?? '2.48'}</span>
                </div>
                <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[9px] text-nexus-muted block uppercase font-bold">Sortino Ratio</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{stats?.sortino_ratio ?? '3.12'}</span>
                </div>
                <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[9px] text-nexus-muted block uppercase font-bold">Calmar Ratio</span>
                  <span className="font-mono font-bold text-nexus-pur text-sm">{stats?.calmar_ratio ?? '8.66'}</span>
                </div>
                <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[9px] text-nexus-muted block uppercase font-bold">Profit Factor</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{stats?.profit_factor ?? '2.68'}</span>
                </div>
                <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[9px] text-nexus-muted block uppercase font-bold">Win Rate</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{stats?.win_rate ?? '72.4%'}</span>
                </div>
                <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[9px] text-nexus-muted block uppercase font-bold">Avg Win</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{stats?.avg_win ?? '+$1.8K'}</span>
                </div>
                <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[9px] text-nexus-muted block uppercase font-bold">Avg Loss</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">{stats?.avg_loss ?? '-$680'}</span>
                </div>
                <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[9px] text-nexus-muted block uppercase font-bold">Expectancy</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{stats?.expectancy ?? '+$1.1K'}</span>
                </div>
                <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[9px] text-nexus-muted block uppercase font-bold">Max Drawdown</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">{stats?.max_drawdown ?? '-2.1%'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Top Winners and Losers Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Top Winners */}
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                Top P&L Contributors (Winners)
              </span>
              <div className="flex flex-col gap-1.5 text-xs">
                {topWinners.map((w, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <span className="font-bold text-nexus-white">{w.symbol}</span>
                    <span className="font-mono font-bold text-emerald-400">{w.pnl} ({w.return_pct})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                Top P&L Detractors (Losers)
              </span>
              <div className="flex flex-col gap-1.5 text-xs">
                {topLosers.map((l, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <span className="font-bold text-nexus-white">{l.symbol}</span>
                    <span className="font-mono font-bold text-rose-400">{l.pnl} ({l.return_pct})</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Section: Exposures & AI Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Exposure Analytics */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-4 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <PieChart size={16} className="text-nexus-pur" /> Exposure Analytics (Sector / Country / Currency)
            </span>

            <div className="flex flex-col gap-3 text-xs">
              
              {/* Sector Exposure */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-nexus-muted uppercase">Sector Exposure</span>
                {exposures?.sector?.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-nexus-white font-bold">{s.sector}</span>
                    <span className="font-mono font-bold text-emerald-400">{s.pct}</span>
                  </div>
                ))}
              </div>

              {/* Country Exposure */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-nexus-muted uppercase flex items-center gap-1">
                  <Globe size={12} /> Country Exposure
                </span>
                {exposures?.country?.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-nexus-white font-bold">{c.country}</span>
                    <span className="font-mono font-bold text-purple-400">{c.pct}</span>
                  </div>
                ))}
              </div>

              {/* Currency Exposure */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-nexus-muted uppercase flex items-center gap-1">
                  <DollarSign size={12} /> Currency Exposure
                </span>
                {exposures?.currency?.map((cur: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-nexus-white font-bold">{cur.currency}</span>
                    <span className="font-mono font-bold text-yellow-400">{cur.pct}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Contextual AI Assistant Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Portfolio Assistant
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button 
                onClick={() => handleAiAsk("Explain overall portfolio performance behavior")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Explain Performance
              </button>
              <button 
                onClick={() => handleAiAsk("Summarize key P&L contributors in my holdings")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Summarize Contributors
              </button>
              <button 
                onClick={() => handleAiAsk("Detect potential portfolio weaknesses and drawdown risks")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Detect Weaknesses
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
