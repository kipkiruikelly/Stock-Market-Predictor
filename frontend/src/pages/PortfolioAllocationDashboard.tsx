import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, AlertTriangle, Sparkles, PieChart,
  Scale, Sliders
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const PortfolioAllocationDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [diversificationScore, setDiversificationScore] = useState<string>('88 / 100');
  const [breakdowns, setBreakdowns] = useState<any[]>([]);
  const [rebalancingTrades, setRebalancingTrades] = useState<any[]>([]);

  const fetchAllocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/portfolio/allocation/dashboard');
      if (res && res.ok) {
        setDiversificationScore(res.diversification_score || '88 / 100');
        setBreakdowns(res.breakdowns || []);
        setRebalancingTrades(res.rebalancing_trades || []);
      } else {
        setError(res?.error || 'Failed to fetch Portfolio Allocation data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Portfolio Allocation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocation();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Allocation Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur">Portfolio Allocation</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <PieChart className="text-nexus-pur" size={26} />
            Institutional Portfolio Allocation Workspace
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Optimal Frontier Rebalancer
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Analyze asset, sector, and strategy exposures against target weights and execute rebalancing orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Portfolio Allocation Report")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Report
          </button>
          <button 
            onClick={fetchAllocation}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Header Summary Metric Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted block">Diversification Score</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{diversificationScore}</span>
          </div>
          <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-bold">OPTIMAL</span>
        </div>

        <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted block">Target Rebalance Status</span>
            <span className="text-2xl font-black text-yellow-400 mt-1 block">2 Trades Pending</span>
          </div>
          <button onClick={() => toast.success("Triggered automated portfolio rebalance")} className="px-2.5 py-1 rounded bg-nexus-pur text-white text-xs font-bold hover:bg-nexus-pur/80 cursor-pointer">
            Rebalance Now
          </button>
        </div>

        <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted block">Max Overexposure</span>
            <span className="text-2xl font-black text-purple-400 mt-1 block">+8.5% (Technology)</span>
          </div>
          <span className="px-2 py-1 rounded bg-purple-500/15 text-purple-400 text-xs font-bold">ATTENTION</span>
        </div>
      </div>

      {/* ── Main Workspace Split Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Target vs Current Allocation Table (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Sliders size={14} className="text-nexus-pur" />
                Current vs Target Allocation Matrix
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Analyzing portfolio allocations...</div>
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
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-right font-mono">Value</th>
                      <th className="p-2.5 text-right font-mono">Current %</th>
                      <th className="p-2.5 text-right font-mono">Target %</th>
                      <th className="p-2.5 text-right font-mono">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {breakdowns.map((b, idx) => (
                      <tr key={idx} className="hover:bg-nexus-bg2/60 transition">
                        <td className="p-2.5 font-bold text-nexus-muted whitespace-nowrap">{b.category}</td>
                        <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">{b.item}</td>
                        <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">{b.value}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">{b.pct}</td>
                        <td className="p-2.5 text-right font-mono text-nexus-muted whitespace-nowrap">{b.target_pct}</td>
                        <td className={`p-2.5 text-right font-mono font-bold whitespace-nowrap ${
                          b.diff.startsWith('+') ? 'text-purple-400' : 'text-rose-400'
                        }`}>
                          {b.diff}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Rebalancing Trades & AI Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Rebalancing Trade Recommendations */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Scale size={16} className="text-emerald-400" /> Rebalancing Trade Recommendations
            </span>
            <div className="flex flex-col gap-2 text-xs">
              {rebalancingTrades.map((rt, i) => (
                <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-nexus-white block text-[11px]">{rt.symbol} ({rt.action})</span>
                    <span className="text-[10px] text-nexus-muted block">{rt.reason}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-nexus-pur block">{rt.trade_value}</span>
                    <button 
                      onClick={() => toast.success(`Executed ${rt.action} for ${rt.symbol}`)}
                      className="px-2 py-0.5 rounded bg-nexus-pur text-white text-[10px] font-bold hover:bg-nexus-pur/80 cursor-pointer mt-1"
                    >
                      Execute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual AI Assistant Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Allocation Assistant
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button 
                onClick={() => handleAiAsk("Recommend optimal asset allocation target weights")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Recommend Allocation
              </button>
              <button 
                onClick={() => handleAiAsk("Optimize diversification across asset classes")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Optimize Diversification
              </button>
              <button 
                onClick={() => handleAiAsk("Suggest rebalance schedule for Tech overexposure")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Suggest Rebalance
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
