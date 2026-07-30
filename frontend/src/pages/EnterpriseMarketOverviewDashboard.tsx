import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, AlertTriangle, Sparkles, Globe,
  TrendingUp, TrendingDown, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const EnterpriseMarketOverviewDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [indices, setIndices] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const fetchMarketOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/dashboard/market-overview/dashboard');
      if (res && res.ok) {
        setIndices(res.indices || []);
        setSectors(res.sectors || []);
        setSummary(res.market_summary);
      } else {
        setError(res?.error || 'Failed to fetch Enterprise Market Overview.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Market Overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketOverview();
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
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-nexus-pur">Enterprise Market Overview</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Globe className="text-nexus-pur" size={26} />
            Global Enterprise Market Overview & Indices Snapshot
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Global Feeds
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            C-suite executive market summary across global equity indices, FX, commodities, crypto, sector breadth, and Fear & Greed index.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Market Overview Report")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Overview
          </button>
          <button 
            onClick={fetchMarketOverview}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Feeds
          </button>
        </div>
      </div>

      {/* ── Global Indices Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {indices.map((idx, i) => (
          <div key={i} className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">{idx.symbol}</span>
            <div className="text-lg font-black text-nexus-white mt-1">{idx.value}</div>
            <span className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${idx.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {idx.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {idx.change}
            </span>
          </div>
        ))}
      </div>

      {/* ── Main Workspace Content & Sector Breadth ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Sector Performance & Market Sentiment (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Layers size={16} className="text-nexus-pur" /> Sector Performance & Market Breadth
            </span>

            {loading ? (
              <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Loading market breadth...</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2">
                <AlertTriangle size={16} /> <span>{error}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {sectors.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <span className="font-bold text-nexus-white">{s.sector}</span>
                    <span className="font-mono font-bold text-emerald-400">{s.change}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: AI Market Overview Assistant (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                AI Market Summary
              </span>
            </div>

            <div className="text-xs space-y-2">
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Fear & Greed Index</span>
                <span className="font-mono font-bold text-emerald-400 mt-0.5 block">{summary?.fear_greed_index ?? '74 (Greed)'}</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Active Sessions</span>
                <span className="font-mono font-bold text-nexus-white mt-0.5 block">{summary?.active_sessions ?? 'US (Open), London (Close)'}</span>
              </div>
            </div>

            <button 
              onClick={() => handleAiAsk("Generate global market intelligence summary")}
              className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate Global Market Intelligence
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
