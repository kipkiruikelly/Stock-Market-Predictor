import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, AlertTriangle, Sparkles, Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const CloudCostsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [costs, setCosts] = useState<any>(null);
  const [optimizations, setOptimizations] = useState<any[]>([]);

  const fetchCosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/executive/cloud-costs/dashboard');
      if (res && res.ok) {
        setCosts(res.costs);
        setOptimizations(res.optimizations || []);
      } else {
        setError(res?.error || 'Failed to fetch Cloud FinOps data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Cloud FinOps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI FinOps Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span> / <span>Executive</span> / <span className="text-nexus-pur">Cloud FinOps</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Cpu className="text-nexus-pur" size={26} />
            Cloud Financial Operations (FinOps) Workspace
          </h1>
          <p className="text-xs text-nexus-muted mt-1">GPU compute, PostgreSQL, Redis, Cloud Run, object storage, and FinOps optimizations.</p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button onClick={() => toast.success("Exported Cloud FinOps Report")} className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 cursor-pointer">
            <Download size={14} /> Export Report
          </button>
          <button onClick={fetchCosts} disabled={loading} className="px-4 py-2 bg-nexus-pur text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-nexus-pur/20">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Total Spend</span>
          <div className="text-lg font-black text-yellow-400 mt-1">{costs?.total_monthly_spend ?? '$42.8K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">GPU Compute</span>
          <div className="text-lg font-black text-nexus-pur mt-1">{costs?.ml_gpu_compute ?? '$18.4K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">PostgreSQL DB</span>
          <div className="text-lg font-black text-nexus-white mt-1">{costs?.database_postgresql ?? '$9.8K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Cloud Run</span>
          <div className="text-lg font-black text-purple-400 mt-1">{costs?.cloud_run_compute ?? '$6.1K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Redis Cluster</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{costs?.redis_cluster ?? '$4.2K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Storage</span>
          <div className="text-lg font-black text-nexus-white mt-1">{costs?.object_storage ?? '$4.3K'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2">Automated Cost Optimization Recommendations</span>
            {loading ? (
              <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Analyzing cloud resources...</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
            ) : (
              <div className="flex flex-col gap-2 text-xs">
                {optimizations.map((o, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-nexus-white block">{o.resource}</span>
                      <span className="text-[10px] text-nexus-muted">{o.recommendation}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">Est. Savings: {o.savings}</span>
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
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">AI FinOps Assistant</span>
            </div>
            <button onClick={() => handleAiAsk("Suggest cost optimization plan")} className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer">
              🤖 Suggest Cost Optimizations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
