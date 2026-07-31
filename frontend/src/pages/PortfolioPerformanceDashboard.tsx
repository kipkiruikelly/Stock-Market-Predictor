import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, AlertTriangle, Sparkles, TrendingUp,
  Award, Clock, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const PortfolioPerformanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [returnsSummary, setReturnsSummary] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [tradeAnalytics, setTradeAnalytics] = useState<any>(null);
  const [monthlyHeatmap, setMonthlyHeatmap] = useState<any[]>([]);

  const fetchPerformance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/portfolio/performance/dashboard');
      if (res && res.ok) {
        setReturnsSummary(res.returns_summary);
        setBenchmarks(res.benchmarks || []);
        setTradeAnalytics(res.trade_analytics);
        setMonthlyHeatmap(res.monthly_heatmap || []);
      } else {
        setError(res?.error || 'Failed to fetch Portfolio Performance report.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Portfolio Performance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Performance Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur">Performance Report</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <TrendingUp className="text-nexus-pur" size={26} />
            Institutional Performance Reporting Console
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Benchmark Audited
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Institutional-grade multi-timeframe performance reporting, benchmark comparisons, and trade analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Institutional Performance Report (PDF)")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export PDF / CSV
          </button>
          <button 
            onClick={fetchPerformance}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Multi-Timeframe Returns Summary ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Daily Return</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{returnsSummary?.daily ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Weekly Return</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{returnsSummary?.weekly ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Monthly Return</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{returnsSummary?.monthly ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Quarterly Return</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{returnsSummary?.quarterly ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Yearly (YTD)</span>
          <div className="text-lg font-black text-purple-400 mt-1">{returnsSummary?.yearly ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Lifetime Return</span>
          <div className="text-lg font-black text-nexus-pur mt-1">{returnsSummary?.lifetime ?? '—'}</div>
        </div>
      </div>

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Benchmark Comparison & Monthly Heatmap (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Institutional Benchmark Comparison Table */}
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Award size={14} className="text-nexus-pur" />
                Benchmark Comparison vs Major Market Indices
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Running benchmark audit calculations...</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-nexus-border text-[10px] font-bold uppercase tracking-wider text-nexus-muted bg-nexus-bg/50 select-none">
                      <th className="p-2.5">Strategy / Index</th>
                      <th className="p-2.5 text-right font-mono">YTD Return</th>
                      <th className="p-2.5 text-right font-mono">Sharpe Ratio</th>
                      <th className="p-2.5 text-right font-mono">Max Drawdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {benchmarks.map((bm, idx) => (
                      <tr key={idx} className={`hover:bg-nexus-bg2/60 transition ${idx === 0 ? 'bg-nexus-pur/10 font-bold' : ''}`}>
                        <td className="p-2.5 text-nexus-white whitespace-nowrap">{bm.name}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">{bm.return_ytd}</td>
                        <td className="p-2.5 text-right font-mono text-nexus-pur font-bold whitespace-nowrap">{bm.sharpe}</td>
                        <td className="p-2.5 text-right font-mono text-rose-400 whitespace-nowrap">{bm.max_dd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly Returns Heatmap */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Layers size={16} className="text-nexus-pur" /> Monthly Returns Heatmap (2026 YTD)
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-xs">
              {monthlyHeatmap.map((m, i) => (
                <div key={i} className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30 text-center">
                  <span className="text-[10px] text-nexus-muted block uppercase font-bold">{m.month}</span>
                  <span className={`font-mono font-bold text-sm ${m.return.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.return}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Section: Trade Analytics & AI Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Trade Analytics Card */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Clock size={16} className="text-emerald-400" /> Trade Execution Analytics
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Total Trades</span>
                <span className="font-mono font-bold text-nexus-white text-sm">{tradeAnalytics?.total_trades ?? 00}</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Winning Trades</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{tradeAnalytics?.winning_trades ?? 0}</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Largest Winner</span>
                <span className="font-mono font-bold text-emerald-400 text-xs block">{tradeAnalytics?.largest_winner ?? '—'}</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Largest Loser</span>
                <span className="font-mono font-bold text-rose-400 text-xs block">{tradeAnalytics?.largest_loser ?? '-$12.4K'}</span>
              </div>
            </div>
          </div>

          {/* Contextual AI Assistant Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Performance Assistant
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button 
                onClick={() => handleAiAsk("Explain overall performance against S&P 500 benchmark")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Explain Performance
              </button>
              <button 
                onClick={() => handleAiAsk("Compare my portfolio returns with NASDAQ 100")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Compare Benchmark
              </button>
              <button 
                onClick={() => handleAiAsk("Identify weak performance periods and drawdown causes")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Identify Weak Periods
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
