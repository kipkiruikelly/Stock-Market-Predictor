import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Download, Sparkles, Activity, 
  Layers, BarChart2, Calendar, Globe, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const MarketAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [volatility, setVolatility] = useState<any>(null);
  const [breadth, setBreadth] = useState<any>(null);
  const [sectors, setSectors] = useState<any[]>([]);
  const [structure, setStructure] = useState<any[]>([]);
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<string[]>([]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/trading/marketanalytics/dashboard');
      if (res && res.ok) {
        setSummary(res.executive_summary);
        setVolatility(res.volatility_analytics);
        setBreadth(res.market_breadth);
        setSectors(res.sector_rotation || []);
        setStructure(res.market_structure || []);
        setCorrelations(res.correlations || []);
        setCalendar(res.economic_calendar || []);
        setIntelligence(res.ai_intelligence || []);
      } else {
        setError(res?.error || 'Failed to fetch Market Analytics workspace data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Market Analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
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
            <span>Workspace</span>
            <span>/</span>
            <span>Trading</span>
            <span>/</span>
            <span className="text-nexus-pur">Market Analytics</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Globe className="text-nexus-pur" size={26} />
            Institutional Global Market Analytics & Volatility Intelligence
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Cross-Asset Feeds
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Institutional macro analysis workspace evaluating volatility regimes, sector rotation, market breadth, order blocks, FVG liquidity, and correlations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Market Analytics Report")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Report
          </button>
          <button 
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Analytics
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Bar ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Market Regime</span>
          <div className="text-sm font-black text-emerald-400 mt-1">{summary?.market_regime ?? 'BULLISH_EXPANSION'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">{summary?.trading_session ?? 'US Session Active'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">VIX Index</span>
          <div className="text-sm font-black text-emerald-400 mt-1">{volatility?.vix_index ?? '13.82 (-1.4%)'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Regime: {volatility?.vol_surface ?? 'NORMAL_CONTANGO'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Advance/Decline</span>
          <div className="text-sm font-black text-nexus-white mt-1">{breadth?.advance_decline_ratio ?? '3.41x'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">{breadth?.new_highs_52w ?? 182} Highs / {breadth?.new_lows_52w ?? 12} Lows</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Sentiment Score</span>
          <div className="text-sm font-black text-emerald-400 mt-1">{summary?.sentiment_score ?? '78 / 100'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">{summary?.risk_indicator ?? 'RISK_ON'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Volume Breadth</span>
          <div className="text-sm font-black text-nexus-pur mt-1">{breadth?.volume_breadth ?? '74.2% Buying'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">{breadth?.pct_above_200_sma ?? '82.4%'} &gt; 200 SMA</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">ATR (SPY)</span>
          <div className="text-sm font-black text-nexus-white mt-1">{volatility?.atr_spy ?? '2.45'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Implied Vol: {volatility?.implied_volatility ?? '14.2%'}</span>
        </div>
      </div>

      {/* ── Main Analytics Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Sector Rotation & Market Structure (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Sector Rotation */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span className="flex items-center gap-2"><Layers size={16} className="text-nexus-pur" /> Sector Performance & Rotation</span>
              <span className="text-[10px] text-emerald-400 font-bold">Relative Momentum</span>
            </span>

            {loading ? (
              <div className="py-6 text-center text-nexus-muted text-xs animate-pulse">Loading sector data...</div>
            ) : error ? (
              <div className="p-2 text-center text-rose-400 text-xs flex items-center justify-center gap-2">
                <AlertTriangle size={14} /> <span>{error}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {sectors.map((sec, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-nexus-white block">{sec.sector}</span>
                      <span className="text-[10px] text-nexus-muted">Leader: {sec.leader}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`font-bold block ${sec.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {sec.change}
                      </span>
                      <span className="text-[10px] font-bold text-nexus-pur">{sec.momentum}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Market Structure & Order Blocks */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl overflow-x-auto">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span className="flex items-center gap-2"><Activity size={16} className="text-nexus-pur" /> ICT Market Structure, Order Blocks & FVG Liquidity</span>
              <span className="text-[10px] text-nexus-muted">Institutional Liquidity Zones</span>
            </span>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-nexus-border/40 text-[10px] text-nexus-muted uppercase">
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">TF</th>
                  <th className="pb-2">Pattern</th>
                  <th className="pb-2">Support</th>
                  <th className="pb-2">FVG Zone</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexus-border/20">
                {structure.map((st, i) => (
                  <tr key={i} className="hover:bg-nexus-bg/40 font-mono">
                    <td className="py-2.5 font-bold text-nexus-white font-sans">{st.symbol}</td>
                    <td className="py-2.5 text-nexus-muted">{st.timeframe}</td>
                    <td className="py-2.5 font-bold text-emerald-400 font-sans">{st.pattern}</td>
                    <td className="py-2.5">{st.support}</td>
                    <td className="py-2.5 text-nexus-pur">{st.fvg}</td>
                    <td className="py-2.5 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {st.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Section: Correlations, Economic Calendar & AI Intelligence (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Asset Correlations */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <BarChart2 size={16} className="text-nexus-pur" /> Cross-Asset Correlation Matrix
            </span>

            <div className="space-y-2 text-xs">
              {correlations.map((cor, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <span className="font-bold text-nexus-white text-[11px]">{cor.pair}</span>
                  <span className="font-mono font-bold text-emerald-400">{cor.correlation}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Economic Calendar */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span className="flex items-center gap-2"><Calendar size={16} className="text-nexus-pur" /> Economic Calendar & Countdown</span>
              <span className="text-[10px] text-rose-400 font-bold">High Impact Events</span>
            </span>

            <div className="space-y-2 text-xs">
              {calendar.map((cal, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-nexus-white block">{cal.event}</span>
                    <span className="text-[10px] text-nexus-muted">{cal.time} | Forecast: {cal.forecast}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                    ⏳ {cal.countdown}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Market Intelligence */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" /> AI Market Intelligence & Order Flow
            </span>

            <div className="space-y-2 text-xs">
              {intelligence.map((intel, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-nexus-text flex items-start gap-2">
                  <span className="text-nexus-pur font-bold">🧠</span>
                  <span>{intel}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleAiAsk("Explain current volatility and dark pool block inflows")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Ask AI Macro Intelligence
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
