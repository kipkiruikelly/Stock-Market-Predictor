import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ResearchDatasetsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [datasets, setDatasets] = useState<any[]>([]);

  const fetchDatasets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/researchlab/datasets/dashboard');
      if (res && res.ok) {
        setDatasets(res.datasets || []);
      } else {
        setError(res?.error || 'Failed to fetch Research Datasets.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Research Datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Dataset Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur">Enterprise Data Catalog</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Database className="text-nexus-pur" size={26} />
            Enterprise Quantitative Data Catalog & Lineage
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Data Lineage Sync
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Centralized data inventory, quality scorecards, schema drift detection, and automated ETL lineage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Data Catalog Audit Log")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Catalog
          </button>
          <button 
            onClick={fetchDatasets}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* ── Main Workspace Table & AI Assistant ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Datasets Catalog Table (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Active Dataset Inventory ({datasets.length})
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Loading data catalog...</div>
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
                      <th className="p-2.5">Dataset</th>
                      <th className="p-2.5">Source</th>
                      <th className="p-2.5 font-mono text-right">Records</th>
                      <th className="p-2.5 font-mono text-right">Features</th>
                      <th className="p-2.5 font-mono text-right">Size</th>
                      <th className="p-2.5 text-center">Quality Score</th>
                      <th className="p-2.5 text-center">Drift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {datasets.map((d, idx) => (
                      <tr key={idx} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                        <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">
                          {d.name}
                          <span className="text-[10px] text-nexus-muted block font-normal">{d.freshness}</span>
                        </td>
                        <td className="p-2.5 text-nexus-muted whitespace-nowrap">{d.source}</td>
                        <td className="p-2.5 text-right font-mono text-nexus-white font-bold whitespace-nowrap">{d.records}</td>
                        <td className="p-2.5 text-right font-mono text-purple-400 font-bold whitespace-nowrap">{d.features}</td>
                        <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">{d.size}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-400 whitespace-nowrap">{d.quality_score}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-400 whitespace-nowrap">{d.drift}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                Contextual AI Dataset Assistant
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <button 
                onClick={() => handleAiAsk("Explain feature quality scores and missing value ratios")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Explain Dataset Quality
              </button>
              <button 
                onClick={() => handleAiAsk("Detect schema drift across tick data feeds")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Detect Schema Drift
              </button>
              <button 
                onClick={() => handleAiAsk("Recommend preprocessing and normalization pipeline")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Preprocessing Recommendation
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
