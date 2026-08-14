import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Download, Sparkles, Award, Target, Layers, AlertTriangle, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const TradingPerformanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [execution, setExecution] = useState<any>(null);
  const [insights, setInsights] = useState<string[]>([]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/trading/performance/dashboard');
      if (res && res.ok) {
        setKpis(res.executive_kpis);
        setStats(res.trade_stats);
        setStrategies(res.strategy_breakdown || []);
        setSymbols(res.symbol_performance || []);
        setExecution(res.execution_quality);
        setInsights(res.ai_coach_insights || []);
      } else {
        setError(res?.error || 'Failed to fetch Trading Performance Analytics.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Trading Performance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Coach Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur">Trading Performance & Alpha Analytics</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Award className="text-nexus-pur" size={26} />
            Trader Execution & Strategy Quality Performance Analytics
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Alpha Metrics
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Dedicated trading execution review center evaluating win rates, profit factors, Sharpe/Sortino ratios, symbol breakdown, and AI coaching.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Performance & Risk Audit Report")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Report
          </button>
          <button 
            onClick={fetchPerformanceData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Analytics
          </button>
        </div>
      </div>

      {/* ── Executive KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Net P&L</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.net_pnl ?? '$0.00'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Growth: {kpis?.account_growth ?? '0.0%'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Win Rate</span>
          <div className="text-lg font-black text-nexus-white mt-1">{stats?.win_rate ?? '0.0%'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">{stats?.winning_trades ?? 0} W / {stats?.losing_trades ?? 0} L</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Profit Factor</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{stats?.profit_factor ?? '0.00x'}</div>
          <span className="text-[10px] font-bold text-nexus-pur mt-1 block">Expectancy: {stats?.expectancy ?? '$0.00'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Today's P&L</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.today_pnl ?? '$0.00'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Weekly: {kpis?.weekly_pnl ?? '$0.00'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Avg R-Multiple</span>
          <div className="text-lg font-black text-nexus-white mt-1">{stats?.avg_r_multiple ?? '0.0R'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Avg Win: {stats?.avg_win ?? '$0.00'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Max Drawdown</span>
          <div className="text-lg font-black text-rose-400 mt-1">{kpis?.max_drawdown ?? '0.0%'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">High: {kpis?.high_watermark ?? '$0.00'}</span>
        </div>
      </div>

      {/* ── Strategy Performance Table ─────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl overflow-x-auto">
        <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
          <span className="flex items-center gap-2"><Target size={16} className="text-nexus-pur" /> Strategy Execution Breakdown</span>
          <span className="text-[10px] text-emerald-400 font-bold">Sharpe & Sortino Quality</span>
        </span>

        {loading ? (
          <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Loading strategy performance breakdown...</div>
        ) : error ? (
          <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2">
            <AlertTriangle size={16} /> <span>{error}</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-nexus-border/40 text-[10px] text-nexus-muted uppercase">
                <th className="pb-2">Strategy Name</th>
                <th className="pb-2">Trades</th>
                <th className="pb-2">Win Rate</th>
                <th className="pb-2">Net Profit</th>
                <th className="pb-2">Sharpe</th>
                <th className="pb-2">Sortino</th>
                <th className="pb-2">Max DD</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-border/20">
              {strategies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-nexus-muted">
                    No strategy execution statistics available.
                  </td>
                </tr>
              ) : (
                strategies.map((st, i) => (
                  <tr key={i} className="hover:bg-nexus-bg/40 font-mono">
                    <td className="py-2.5 font-bold text-nexus-white font-sans">{st.name}</td>
                    <td className="py-2.5">{st.trades}</td>
                    <td className="py-2.5 font-bold text-emerald-400">{st.win_rate}</td>
                    <td className="py-2.5 font-bold text-emerald-400">{st.net_profit}</td>
                    <td className="py-2.5 font-bold text-nexus-pur">{st.sharpe}</td>
                    <td className="py-2.5 font-bold text-nexus-pur">{st.sortino}</td>
                    <td className="py-2.5 text-rose-400">{st.max_dd}</td>
                    <td className="py-2.5 text-right font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        st.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Symbol Breakdown & AI Coach Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Symbol Performance */}
        <div className="lg:col-span-7 flex flex-col gap-3 p-4 rounded-xl bg-nexus-sf border border-nexus-border shadow-xl">
          <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
            <span className="flex items-center gap-2"><Layers size={16} className="text-nexus-pur" /> Symbol P&L Performance Breakdown</span>
            <span className="text-[10px] text-nexus-muted">Top Winners vs Losers</span>
          </span>

          <div className="space-y-2 text-xs">
            {symbols.length === 0 ? (
              <div className="p-6 text-center text-nexus-muted">
                No symbol performance data.
              </div>
            ) : (
              symbols.map((sym, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-nexus-white block">{sym.symbol}</span>
                    <span className="text-[10px] text-nexus-muted">{sym.trades} Trades</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${sym.best ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sym.net_profit}
                    </span>
                    <span className="text-[10px] text-nexus-muted">Win Rate: {sym.win_rate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Trading Coach & Execution Quality */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <ShieldCheck size={16} className="text-emerald-400" /> Execution Quality Metrics
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block">Avg Slippage</span>
                <span className="font-mono font-bold text-emerald-400">{execution?.avg_slippage ?? '0.0 bps'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block">Latency</span>
                <span className="font-mono font-bold text-nexus-white">{execution?.execution_latency ?? '0.0ms'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block">Fill Quality</span>
                <span className="font-mono font-bold text-emerald-400">{execution?.fill_quality ?? '0.0%'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block">Rejections</span>
                <span className="font-mono font-bold text-nexus-white">{execution?.order_rejections ?? '0.0%'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" /> AI Performance Coach & Insights
            </span>

            <div className="space-y-2">
              {insights.length === 0 ? (
                <div className="p-4 text-center text-nexus-muted text-xs">No AI strategy recommendations generated yet.</div>
              ) : (
                insights.map((ins, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-xs text-nexus-text flex items-start gap-2">
                    <span className="text-nexus-pur font-bold">💡</span>
                    <span>{ins}</span>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => handleAiAsk("Generate weekly performance review and risk adjustments")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate AI Weekly Performance Review
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
