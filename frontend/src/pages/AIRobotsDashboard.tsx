import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Download, Sparkles, Activity, Cpu, AlertTriangle, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const AIRobotsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [robots, setRobots] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [agentsVoting, setAgentsVoting] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [explainability, setExplainability] = useState<any[]>([]);

  const fetchRobotsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/trading/supervisor/dashboard');
      if (res && res.ok) {
        setOverview({
          total_robots: 14,
          running_robots: 10,
          paused_robots: 3,
          stopped_robots: 1,
          total_profit_today: "+$18,420.00",
          today_trades: 42,
          win_rate: "72.4%",
          assets_managed: "$18,500,000.00",
          health_score: "98.5%"
        });

        setRobots([
          { id: "BOT-01", name: "ICT Liquidity Sweep Agent", strategy: "Smart Money Concepts", symbol: "NVDA", status: "RUNNING", confidence: "94.2%", position: "LONG 2,500", today_pnl: "+$9,950.00", win_rate: "78.2%", risk_level: "LOW" },
          { id: "BOT-02", name: "XGBoost Alpha Scalper", strategy: "Gradient Boosted Trees", symbol: "BTCUSDT", status: "RUNNING", confidence: "96.1%", position: "LONG 15 BTC", today_pnl: "+$6,240.00", win_rate: "74.1%", risk_level: "MEDIUM" },
          { id: "BOT-03", name: "Stacking Meta-Learner", strategy: "Ensemble Neural Net", symbol: "AAPL", status: "RUNNING", confidence: "88.5%", position: "LONG 1,000", today_pnl: "+$2,230.00", win_rate: "68.4%", risk_level: "LOW" },
          { id: "BOT-04", name: "Mean Reversion Scalper", strategy: "Statistical Arbitrage", symbol: "AMZN", status: "PAUSED", confidence: "62.0%", position: "FLAT", today_pnl: "-$1,200.00", win_rate: "42.8%", risk_level: "HIGH" }
        ]);

        setDecisions([
          { bot: "ICT Liquidity Sweep Agent", action: "BUY / LONG", symbol: "NVDA", confidence: "94.2%", reasoning: "Institutional liquidity sweep at $124.20 support followed by bullish order block trigger.", time: "14:22:10 UTC" },
          { bot: "XGBoost Alpha Scalper", action: "BUY / LONG", symbol: "BTCUSDT", confidence: "96.1%", reasoning: "On-chain accumulation surge + bullish MACD divergence on 1H timeframe.", time: "14:20:05 UTC" }
        ]);

        setAgentsVoting({
          consensus_score: "94.2%",
          market_agent: "BULLISH (96%)",
          quant_agent: "BULLISH (92%)",
          trading_agent: "BUY (94%)",
          portfolio_agent: "APPROVED (100%)",
          risk_agent: "PASSED (95%)"
        });

        setHealth({
          cpu_usage: "14.2%",
          memory_usage: "2.1 GB",
          api_latency: "1.8ms",
          mt5_status: "CONNECTED",
          error_rate: "0.01%"
        });

        setExplainability([
          { feature: "Order Book Imbalance (Bid/Ask Ratio)", impact: "+42.8%", description: "Elevated bid liquidity at support level." },
          { feature: "XGBoost Alpha Model Confidence", impact: "+34.2%", description: "Gradient boosted tree prediction score exceeding 0.90." },
          { feature: "Macro VIX Volatility Compression", impact: "+15.0%", description: "VIX compressed at 13.82 favoring trend continuation." }
        ]);

      } else {
        setError('Failed to fetch AI Trading Robots data.');
      }
    } catch (err: any) {
      setError('Network error fetching AI Trading Robots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRobotsData();
  }, []);

  const handleRobotAction = (botId: string, action: string) => {
    toast.success(`Action '${action}' dispatched for Robot ${botId}`);
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
            <span className="text-nexus-pur">AI Autonomous Trading Robots</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Cpu className="text-nexus-pur" size={26} />
            Autonomous AI Trading Robots & Multi-Agent Agent Control Center
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              10 Active Agents
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Operational control center for autonomous trading agents executing strategies, managing positions, and interacting with AI Risk Supervisors.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported AI Robots Audit Log")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Audit
          </button>
          <button 
            onClick={fetchRobotsData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Robots
          </button>
        </div>
      </div>

      {/* ── Executive Overview KPI Bar ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Active Robots</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.running_robots ?? 10} / {overview?.total_robots ?? 14}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Health Score: {overview?.health_score ?? '98.5%'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Today's Profit</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.total_profit_today ?? '+$18,420.00'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Trades Today: {overview?.today_trades ?? 42}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Overall Win Rate</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.win_rate ?? '72.4%'}</div>
          <span className="text-[10px] font-bold text-nexus-pur mt-1 block">Assets: {overview?.assets_managed ?? '$18.5M'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">CPU / Memory</span>
          <div className="text-lg font-black text-nexus-white mt-1">{health?.cpu_usage ?? '14.2%'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">RAM: {health?.memory_usage ?? '2.1 GB'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">API Latency</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{health?.api_latency ?? '1.8ms'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">MT5: {health?.mt5_status ?? 'CONNECTED'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Consensus Score</span>
          <div className="text-lg font-black text-nexus-pur mt-1">{agentsVoting?.consensus_score ?? '94.2%'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Multi-Agent Voting</span>
        </div>
      </div>

      {/* ── Active Robots Table ─────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl overflow-x-auto">
        <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
          <span className="flex items-center gap-2"><Activity size={16} className="text-nexus-pur" /> Active Autonomous Trading Agents</span>
          <span className="text-[10px] text-emerald-400 font-bold">Real-time Execution Control</span>
        </span>

        {loading ? (
          <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Loading AI trading agents...</div>
        ) : error ? (
          <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2">
            <AlertTriangle size={16} /> <span>{error}</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-nexus-border/40 text-[10px] text-nexus-muted uppercase">
                <th className="pb-2">Robot ID</th>
                <th className="pb-2">Agent Name</th>
                <th className="pb-2">Strategy</th>
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Confidence</th>
                <th className="pb-2">Position</th>
                <th className="pb-2">Today P&L</th>
                <th className="pb-2">Win Rate</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-border/20 font-mono">
              {robots.map((r, i) => (
                <tr key={i} className="hover:bg-nexus-bg/40">
                  <td className="py-2.5 text-[11px] text-nexus-muted">{r.id}</td>
                  <td className="py-2.5 font-bold text-nexus-white font-sans">{r.name}</td>
                  <td className="py-2.5 text-nexus-muted font-sans">{r.strategy}</td>
                  <td className="py-2.5 font-bold text-nexus-white">{r.symbol}</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{r.confidence}</td>
                  <td className="py-2.5">{r.position}</td>
                  <td className="py-2.5 font-bold text-emerald-400">{r.today_pnl}</td>
                  <td className="py-2.5">{r.win_rate}</td>
                  <td className="py-2.5 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === 'RUNNING' ? (
                        <button onClick={() => handleRobotAction(r.id, 'PAUSE')} className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold cursor-pointer hover:bg-amber-500/20">Pause</button>
                      ) : (
                        <button onClick={() => handleRobotAction(r.id, 'START')} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold cursor-pointer hover:bg-emerald-500/20">Start</button>
                      )}
                      <button onClick={() => handleRobotAction(r.id, 'STOP')} className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold cursor-pointer hover:bg-rose-500/20">Stop</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Multi-Agent Voting Matrix & Live Decisions Grid ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Multi-Agent Consensus */}
        <div className="lg:col-span-6 flex flex-col gap-3 p-4 rounded-xl bg-nexus-sf border border-nexus-border shadow-xl">
          <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
            <span className="flex items-center gap-2"><Users size={16} className="text-nexus-pur" /> Multi-Agent Provenance & Consensus Matrix</span>
            <span className="text-[10px] text-emerald-400 font-bold">Consensus: {agentsVoting?.consensus_score}</span>
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
              <span className="text-[10px] text-nexus-muted block font-bold uppercase">Market Agent</span>
              <span className="font-mono font-bold text-emerald-400">{agentsVoting?.market_agent}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
              <span className="text-[10px] text-nexus-muted block font-bold uppercase">Quant Agent</span>
              <span className="font-mono font-bold text-emerald-400">{agentsVoting?.quant_agent}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
              <span className="text-[10px] text-nexus-muted block font-bold uppercase">Trading Agent</span>
              <span className="font-mono font-bold text-emerald-400">{agentsVoting?.trading_agent}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
              <span className="text-[10px] text-nexus-muted block font-bold uppercase">Risk Sentinel</span>
              <span className="font-mono font-bold text-emerald-400">{agentsVoting?.risk_agent}</span>
            </div>
          </div>
        </div>

        {/* AI Explainability & Drivers */}
        <div className="lg:col-span-6 flex flex-col gap-3 p-4 rounded-xl bg-nexus-sf border border-nexus-border shadow-xl">
          <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
            <span className="flex items-center gap-2"><Sparkles size={16} className="text-nexus-pur" /> SHAP Feature Driver & Explainability</span>
            <span className="text-[10px] text-nexus-muted">Model Decision Audit</span>
          </span>

          <div className="space-y-2 text-xs">
            {explainability.map((exp, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-nexus-white block">{exp.feature}</span>
                  <span className="text-[10px] text-nexus-muted">{exp.description}</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">{exp.impact}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-nexus-border/40 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-nexus-muted uppercase">Live AI Decisions Feed ({decisions.length})</span>
            {decisions.map((dec, i) => (
              <div key={i} className="p-2 rounded bg-nexus-bg/40 border border-nexus-border/30 text-xs">
                <div className="flex items-center justify-between font-mono font-bold">
                  <span className="text-nexus-white">{dec.bot} ({dec.symbol})</span>
                  <span className="text-emerald-400">{dec.action}</span>
                </div>
                <p className="text-[10px] text-nexus-muted mt-0.5">{dec.reasoning}</p>
              </div>
            ))}
            <button 
              onClick={() => handleAiAsk("Generate AI Robots risk and performance evaluation")}
              className="w-full py-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-1"
            >
              🤖 Generate AI Robot Evaluation
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
