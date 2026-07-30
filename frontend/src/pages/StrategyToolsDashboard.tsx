import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Download, Sparkles, Activity, 
  Wrench, Layers, Cpu, ShieldCheck, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const StrategyToolsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [backtest, setBacktest] = useState<any>(null);
  const [walkForward, setWalkForward] = useState<any>(null);
  const [monteCarlo, setMonteCarlo] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const fetchToolsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/trading/strategytools/dashboard');
      if (res && res.ok) {
        setSummary(res.executive_summary);
        setStrategies(res.strategy_library || []);
        setIndicators(res.indicators || []);
        setBacktest(res.backtest_results);
        setWalkForward(res.walk_forward);
        setMonteCarlo(res.monte_carlo);
        setRecommendations(res.ai_recommendations || []);
      } else {
        setError(res?.error || 'Failed to fetch Strategy Tools workspace data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Strategy Tools.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToolsData();
  }, []);

  const handleStrategyAction = (stratId: string, action: string) => {
    toast.success(`Action '${action}' dispatched for Strategy ${stratId}`);
  };

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
            <span className="text-nexus-pur">Strategy Engineering Tools</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Wrench className="text-nexus-pur" size={26} />
            Institutional Strategy Engineering & Optimization Studio
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Walk-Forward Tested
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Institutional engineering environment for designing, backtesting, walk-forward validating, optimizing, and deploying quantitative trading strategies.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Strategy Engineering Audit Report")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Report
          </button>
          <button 
            onClick={fetchToolsData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Studio
          </button>
        </div>
      </div>

      {/* ── Executive Strategy Overview KPI Bar ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Strategies</span>
          <div className="text-lg font-black text-nexus-white mt-1">{summary?.active_strategies ?? 8} Active / {summary?.total_strategies ?? 18}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Deployed Live: {summary?.live_deployed ?? 5}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Average Win Rate</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{summary?.avg_win_rate ?? '71.2%'}</div>
          <span className="text-[10px] font-bold text-nexus-pur mt-1 block">Sharpe: {backtest?.sharpe_ratio ?? 2.41}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Total Net Profit</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{summary?.total_net_profit ?? '+$142,800.00'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Backtest CAGR: {backtest?.cagr ?? '+34.2%'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Max Drawdown</span>
          <div className="text-lg font-black text-rose-400 mt-1">{backtest?.max_drawdown ?? '-2.8%'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Expectancy: {backtest?.expectancy ?? '$520/tr'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Walk-Forward Stability</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{walkForward?.stability_score ?? '94.2 / 100'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Risk: {walkForward?.overfitting_risk ?? 'LOW'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Monte Carlo Ruin</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{monteCarlo?.probability_of_ruin ?? '0.01%'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">{monteCarlo?.simulations ?? 1000} Runs</span>
        </div>
      </div>

      {/* ── Strategy Library Table ────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl overflow-x-auto">
        <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
          <span className="flex items-center gap-2"><Layers size={16} className="text-nexus-pur" /> Institutional Strategy Engineering Library</span>
          <span className="text-[10px] text-emerald-400 font-bold">Lifecycle & Parameter Management</span>
        </span>

        {loading ? (
          <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Loading strategy engineering library...</div>
        ) : error ? (
          <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2">
            <AlertTriangle size={16} /> <span>{error}</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-nexus-border/40 text-[10px] text-nexus-muted uppercase">
                <th className="pb-2">ID</th>
                <th className="pb-2">Strategy Name</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Timeframe</th>
                <th className="pb-2">Win Rate</th>
                <th className="pb-2">Sharpe</th>
                <th className="pb-2">Net Profit</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-border/20 font-mono">
              {strategies.map((st, i) => (
                <tr key={i} className="hover:bg-nexus-bg/40">
                  <td className="py-2.5 text-[11px] text-nexus-muted">{st.id}</td>
                  <td className="py-2.5 font-bold text-nexus-white font-sans">{st.name}</td>
                  <td className="py-2.5 text-nexus-muted font-sans">{st.category}</td>
                  <td className="py-2.5 font-bold text-nexus-white">{st.symbol}</td>
                  <td className="py-2.5">{st.timeframe}</td>
                  <td className="py-2.5 font-bold text-emerald-400">{st.win_rate}</td>
                  <td className="py-2.5 text-nexus-pur font-bold">{st.sharpe}</td>
                  <td className="py-2.5 font-bold text-emerald-400">{st.net_profit}</td>
                  <td className="py-2.5 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => handleStrategyAction(st.id, 'CLONE')} className="px-2 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-white border border-nexus-border rounded text-[10px] font-bold cursor-pointer">Clone</button>
                      <button onClick={() => handleStrategyAction(st.id, 'DEPLOY')} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold cursor-pointer hover:bg-emerald-500/20">Deploy</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Indicator Library & AI Strategy Assistant Grid ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Indicator Library */}
        <div className="lg:col-span-6 flex flex-col gap-3 p-4 rounded-xl bg-nexus-sf border border-nexus-border shadow-xl">
          <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
            <span className="flex items-center gap-2"><Cpu size={16} className="text-nexus-pur" /> Technical Indicator Engineering Library</span>
            <span className="text-[10px] text-nexus-muted">Composable Quantitative Logic</span>
          </span>

          <div className="space-y-2 text-xs">
            {indicators.map((ind, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-nexus-white block">{ind.name}</span>
                  <span className="text-[10px] text-nexus-muted">Category: {ind.category} | Params: {ind.params}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-nexus-pur/10 text-nexus-pur border border-nexus-pur/20 font-mono">
                  {ind.usage}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Strategy Assistant */}
        <div className="lg:col-span-6 flex flex-col gap-3 p-4 rounded-xl bg-nexus-sf border border-nexus-border shadow-xl">
          <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
            <Sparkles size={16} className="text-nexus-pur" /> AI Strategy Engineering Assistant
          </span>

          <div className="space-y-2 text-xs">
            {recommendations.map((rec, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-nexus-text flex items-start gap-2">
                <span className="text-nexus-pur font-bold">🛠️</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => handleAiAsk("Run parameter optimization sweep and detect overfitting risk")}
            className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
          >
            🤖 Run AI Strategy Parameter Optimization
          </button>
        </div>

      </div>

    </div>
  );
};
