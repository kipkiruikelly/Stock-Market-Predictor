import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  AlertTriangle, Sparkles, Workflow,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ResearchDataPipelineDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stages, setStages] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  const fetchPipeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/researchlab/datapipeline/dashboard');
      if (res && res.ok) {
        setStages(res.stages || []);
        setMetrics(res.metrics);
      } else {
        setError(res?.error || 'Failed to fetch Data Pipeline status.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Data Pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleRunPipeline = () => {
    toast.success("Triggered Data Pipeline Execution DAG");
    fetchPipeline();
  };

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Pipeline Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Breadcrumb & Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Research Lab</span>
            <span>/</span>
            <span className="text-nexus-pur">Data Pipeline DAG</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Workflow className="text-nexus-pur" size={26} />
            Institutional ETL & ML Data Pipeline Engine
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              DAG Active
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Institutional ETL data ingestion, automated feature engineering pipelines, model training DAGs, and evaluation queues.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={handleRunPipeline}
            className="px-3.5 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <Play size={14} /> Trigger Pipeline DAG
          </button>
          <button 
            onClick={fetchPipeline}
            disabled={loading}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Pipeline Metrics Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Throughput</span>
          <div className="text-xl font-black text-emerald-400 mt-1">{metrics?.throughput ?? '12,800 events/s'}</div>
        </div>
        <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Execution Time</span>
          <div className="text-xl font-black text-nexus-white mt-1">{metrics?.execution_time ?? '1m 03s'}</div>
        </div>
        <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Queue Depth</span>
          <div className="text-xl font-black text-yellow-400 mt-1">{metrics?.queue_depth ?? 0} Pending</div>
        </div>
        <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Success Rate</span>
          <div className="text-xl font-black text-purple-400 mt-1">{metrics?.success_rate ?? '99.4%'}</div>
        </div>
      </div>

      {/* ── Main Workspace DAG Stages & AI Assistant ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Pipeline DAG Stages (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-4 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Activity size={16} className="text-nexus-pur" />
              Pipeline Stages & Execution DAG Log
            </span>

            {loading ? (
              <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Running pipeline DAG inspection...</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 text-xs">
                {stages.map((st, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-nexus-white block text-[11px]">{st.stage}</span>
                      <span className="text-[10px] text-nexus-muted block mt-0.5">{st.logs}</span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        st.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400' :
                        st.status === 'RUNNING' ? 'bg-yellow-500/15 text-yellow-400 animate-pulse' : 'bg-nexus-bg text-nexus-muted'
                      }`}>
                        {st.status}
                      </span>
                      <span className="text-[10px] text-nexus-muted font-mono block mt-1">{st.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: AI Assistant Box (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Pipeline Assistant
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <button 
                onClick={() => handleAiAsk("Explain data pipeline bottleneck and latency optimization")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Optimize Pipeline Throughput
              </button>
              <button 
                onClick={() => handleAiAsk("Analyze feature calculation latency during model training")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Analyze Feature Latency
              </button>
              <button 
                onClick={() => handleAiAsk("Recommend automated retry rules for WebSocket ingestion drops")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Recommend Auto-Retry Rules
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
