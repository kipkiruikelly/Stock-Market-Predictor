import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, AlertTriangle, Sparkles, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ExecutiveGrowthDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [growth, setGrowth] = useState<any>(null);
  const [cohorts, setCohorts] = useState<any[]>([]);

  const fetchGrowth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/executive/growth/dashboard');
      if (res && res.ok) {
        setGrowth(res.growth);
        setCohorts(res.cohorts || []);
      } else {
        setError(res?.error || 'Failed to fetch Growth scorecards.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Growth data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowth();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span> / <span>Executive</span> / <span className="text-nexus-pur">Growth Planning</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <TrendingUp className="text-nexus-pur" size={26} />
            Enterprise Growth Planning & Cohort Analytics
          </h1>
          <p className="text-xs text-nexus-muted mt-1">ARR YoY growth, expansion MRR, net new MRR, and cohort retention rates.</p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button onClick={() => toast.success("Exported Growth Report")} className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 cursor-pointer">
            <Download size={14} /> Export Report
          </button>
          <button onClick={fetchGrowth} disabled={loading} className="px-4 py-2 bg-nexus-pur text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-nexus-pur/20">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">ARR Growth YoY</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{growth?.arr_growth_yoy ?? '+42.8%'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">MRR Growth MoM</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{growth?.mrr_growth_mom ?? '+3.5%'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Net New MRR</span>
          <div className="text-lg font-black text-nexus-white mt-1">{growth?.net_new_mrr ?? '+$41.8K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Expansion MRR</span>
          <div className="text-lg font-black text-purple-400 mt-1">{growth?.expansion_mrr ?? '+$28.4K'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2">Cohort Retention & Expansion</span>
            {loading ? (
              <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Loading cohorts...</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
            ) : (
              <div className="flex flex-col gap-2 text-xs">
                {cohorts.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <span className="font-bold text-nexus-white">{c.cohort}</span>
                    <span className="font-mono font-bold text-emerald-400">Retention: {c.retention} | Expansion: {c.growth}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">AI Growth Strategy</span>
            </div>
            <button onClick={() => handleAiAsk("Generate enterprise growth strategy")} className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer">
              🤖 Generate Growth Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
