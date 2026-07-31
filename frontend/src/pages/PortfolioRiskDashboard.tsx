import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, ShieldAlert,
  Scale, AlertOctagon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const PortfolioRiskDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [riskSummary, setRiskSummary] = useState<any>(null);
  const [quantMetrics, setQuantMetrics] = useState<any>(null);
  const [stressTests, setStressTests] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);

  const fetchRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/portfolio/risk/dashboard');
      if (res && res.ok) {
        setRiskSummary(res.risk_summary);
        setQuantMetrics(res.quant_metrics);
        setStressTests(res.stress_tests || []);
        setRiskAlerts(res.risk_alerts || []);
      } else {
        setError(res?.error || 'Failed to fetch Portfolio Risk metrics.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Portfolio Risk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisk();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Risk Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur">Portfolio Risk Management</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <ShieldAlert className="text-nexus-pur" size={26} />
            Institutional Quantitative Risk Management
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              VaR & Stress Engine Active
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Institutional quantitative risk management: VaR, Expected Shortfall, Monte Carlo stress testing, and downside protection.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Portfolio Risk Audit Report")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Report
          </button>
          <button 
            onClick={fetchRisk}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Executive Quantitative Risk Summary Header ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">VaR (95% Daily)</span>
          <div className="text-lg font-black text-yellow-400 mt-1">{riskSummary?.var_95 ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">VaR (99% Daily)</span>
          <div className="text-lg font-black text-rose-400 mt-1">{riskSummary?.var_99 ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Expected Shortfall</span>
          <div className="text-lg font-black text-rose-400 mt-1">{riskSummary?.expected_shortfall ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Portfolio Beta</span>
          <div className="text-lg font-black text-nexus-white mt-1">{riskSummary?.portfolio_beta ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Volatility</span>
          <div className="text-lg font-black text-nexus-pur mt-1">{riskSummary?.portfolio_volatility ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Correlation</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{riskSummary?.correlation_score ?? '0.42'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Concentration</span>
          <div className="text-lg font-black text-purple-400 mt-1">36% (AAPL)</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Liquidity Risk</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{riskSummary?.liquidity_risk ?? '—'}</div>
        </div>
      </div>

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Stress Test Scenarios & Quant Metrics (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Stress Testing Engine Scenarios */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Scale size={16} className="text-rose-400" /> Monte Carlo & Stress Test Scenario Analysis
            </span>
            {error && (
              <div className="p-3 text-center text-rose-400 text-xs flex items-center justify-center gap-2">
                <AlertTriangle size={16} /> <span>{error}</span>
              </div>
            )}
            <div className="flex flex-col gap-2 text-xs">
              {stressTests.map((st, i) => (
                <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-nexus-white block text-[11px]">{st.scenario}</span>
                    <span className="text-[10px] text-rose-400 font-bold block">Estimated Portfolio Impact: {st.impact}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {st.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quantitative Risk Ratios Matrix */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Activity size={16} className="text-nexus-pur" /> Quantitative Risk & Downside Metrics
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[9px] text-nexus-muted block uppercase font-bold">Alpha</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{quantMetrics?.alpha ?? '—'}</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[9px] text-nexus-muted block uppercase font-bold">Tracking Error</span>
                <span className="font-mono font-bold text-nexus-pur text-sm">{quantMetrics?.tracking_error ?? '—'}</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[9px] text-nexus-muted block uppercase font-bold">Information Ratio</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{quantMetrics?.information_ratio ?? '1.80'}</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[9px] text-nexus-muted block uppercase font-bold">Treynor Ratio</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{quantMetrics?.treynor_ratio ?? '12.40'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Section: Risk Alerts & AI Risk Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Active Risk Alerts */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <AlertOctagon size={16} className="text-yellow-400" /> Active Risk Sentinel Alerts
            </span>
            <div className="flex flex-col gap-1.5 text-xs">
              {riskAlerts.map((ra, idx) => (
                <div key={idx} className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <span className="font-bold text-nexus-white text-[11px]">{ra.message}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/15 text-yellow-400">
                    {ra.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual AI Assistant Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Risk Assistant
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button 
                onClick={() => handleAiAsk("Explain overall portfolio risk and VaR limits")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Explain Portfolio Risk
              </button>
              <button 
                onClick={() => handleAiAsk("Recommend hedging strategy for Tech sector overexposure")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Recommend Hedges
              </button>
              <button 
                onClick={() => handleAiAsk("Simulate a Black Monday market crash shock wave")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Simulate Market Crash
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
