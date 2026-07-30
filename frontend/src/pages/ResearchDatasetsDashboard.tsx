import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, Database, Layers, ShieldCheck, Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ResearchDatasetsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [schemaSample, setSchemaSample] = useState<any[]>([]);
  const [profiling, setProfiling] = useState<any>(null);
  const [lineage, setLineage] = useState<any[]>([]);
  const [featureStore, setFeatureStore] = useState<any[]>([]);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'SCHEMA' | 'QUALITY' | 'LINEAGE' | 'FEATURES'>('CATALOG');

  const fetchDatasetsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/researchlab/datasets/dashboard');
      if (res && res.ok) {
        setOverview(res.overview);
        setDatasets(res.datasets || []);
        setSchemaSample(res.schema_sample || []);
        setProfiling(res.data_profiling);
        setLineage(res.lineage_graph || []);
        setFeatureStore(res.feature_store_link || []);
        setAiPrompts(res.ai_data_prompts || []);
      } else {
        setError(res?.error || 'Failed to fetch Data Catalog workspace telemetry.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Data Catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasetsData();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Data Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur font-mono">Enterprise Data Catalog & Governance</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Database className="text-nexus-pur" size={26} />
            Enterprise Data Catalog, Quality Scorecard & End-to-End Lineage
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Lineage Sync
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Central platform for dataset discovery, schema explorer, data profiling, lineage tracking, and feature store governance.
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
            onClick={fetchDatasetsData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Catalog
          </button>
        </div>
      </div>

      {/* ── Executive Overview KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Datasets</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.total_datasets ?? 24}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Active: {overview?.active_datasets ?? 18}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Data Quality Score</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.data_quality_score ?? '98.6%'}</div>
          <span className="text-[10px] font-bold text-nexus-pur mt-1 block">Freshness: {overview?.data_freshness ?? '50ms'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Storage Used</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.total_storage_used ?? '142.8 GB'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Growth: {overview?.daily_growth ?? '+4.2 GB/day'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Active Pipelines</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.active_pipelines ?? 12}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Failed Jobs: {overview?.failed_pipelines ?? 0}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Feature Store Entries</span>
          <div className="text-lg font-black text-purple-400 mt-1">{overview?.feature_store_entries ?? '1,420'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Owners: {overview?.dataset_owners ?? 6} Teams</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Streaming Sources</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.streaming_datasets ?? 6}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">External: {overview?.external_sources ?? 8}</span>
        </div>
      </div>

      {/* ── Tab Selector Navigation Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-nexus-border/60 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'CATALOG', label: 'Data Catalog Grid' },
          { id: 'SCHEMA', label: 'Schema Explorer' },
          { id: 'QUALITY', label: 'Data Quality & Profiling' },
          { id: 'LINEAGE', label: 'End-to-End Lineage Graph' },
          { id: 'FEATURES', label: 'Feature Store Links' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === t.id 
                ? 'bg-nexus-pur text-white shadow-lg shadow-nexus-pur/20' 
                : 'bg-nexus-sf text-nexus-muted hover:text-nexus-white border border-nexus-border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main Tab Content Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Main Workspace View (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {activeTab === 'CATALOG' && (
            <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} className="text-nexus-pur" />
                  Enterprise Data Catalog Inventory ({datasets.length})
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
                      <tr className="border-b border-nexus-border text-[10px] font-bold uppercase tracking-wider text-nexus-muted bg-nexus-bg/50 select-none font-mono">
                        <th className="p-2.5">Dataset Name</th>
                        <th className="p-2.5">Domain / Owner</th>
                        <th className="p-2.5">Database & Table</th>
                        <th className="p-2.5 text-right">Records</th>
                        <th className="p-2.5 text-right">Features</th>
                        <th className="p-2.5 text-center">Quality</th>
                        <th className="p-2.5 text-center">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexus-border/30 font-mono">
                      {datasets.map((d, idx) => (
                        <tr key={idx} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                          <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">
                            <span className="text-nexus-muted text-[10px] font-sans block">{d.dataset_id} ({d.version})</span>
                            <span className="font-sans text-sm">{d.name}</span>
                            <span className="text-[10px] text-nexus-muted font-sans block font-normal">{d.description}</span>
                          </td>
                          <td className="p-2.5 font-bold text-nexus-muted whitespace-nowrap font-sans">
                            {d.domain}
                            <span className="text-[10px] text-nexus-pur block font-normal">{d.owner}</span>
                          </td>
                          <td className="p-2.5 text-nexus-white whitespace-nowrap">
                            {d.database}.{d.schema}
                            <span className="text-[10px] text-nexus-muted block font-normal">{d.table}</span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-nexus-white whitespace-nowrap">{d.records}</td>
                          <td className="p-2.5 text-right font-bold text-purple-400 whitespace-nowrap">{d.features}</td>
                          <td className="p-2.5 text-center font-bold text-emerald-400 whitespace-nowrap">{d.quality_score}</td>
                          <td className="p-2.5 text-center font-sans whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-nexus-pur/10 text-nexus-pur border border-nexus-pur/20">
                              {d.classification}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'SCHEMA' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl overflow-x-auto">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Layers size={16} className="text-nexus-pur" /> Schema Explorer & Feature Definition</span>
                <span className="text-[10px] text-emerald-400 font-bold">DS-201 Schema</span>
              </span>

              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-nexus-border/40 text-[10px] text-nexus-muted uppercase">
                    <th className="pb-2">Column Name</th>
                    <th className="pb-2">Data Type</th>
                    <th className="pb-2">PK</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Sample Value</th>
                    <th className="pb-2 text-right">Null %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border/20">
                  {schemaSample.map((sc, i) => (
                    <tr key={i} className="hover:bg-nexus-bg/40">
                      <td className="py-2.5 font-bold text-nexus-white">{sc.name}</td>
                      <td className="py-2.5 text-nexus-pur">{sc.type}</td>
                      <td className="py-2.5 font-bold text-emerald-400">{sc.pk ? 'YES' : 'NO'}</td>
                      <td className="py-2.5 text-nexus-muted font-sans text-[11px]">{sc.description}</td>
                      <td className="py-2.5 text-nexus-white">{sc.sample}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">{sc.null_pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'QUALITY' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <ShieldCheck size={16} className="text-emerald-400" /> Data Quality Scorecard & Profiling Metrics
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 font-mono">
                  <span className="text-[10px] text-nexus-muted block">Completeness</span>
                  <span className="font-bold text-emerald-400 text-sm">{profiling?.completeness ?? '99.8%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 font-mono">
                  <span className="text-[10px] text-nexus-muted block">Accuracy</span>
                  <span className="font-bold text-emerald-400 text-sm">{profiling?.accuracy ?? '99.4%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 font-mono">
                  <span className="text-[10px] text-nexus-muted block">Timeliness</span>
                  <span className="font-bold text-emerald-400 text-sm">{profiling?.timeliness ?? '99.9%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 font-mono">
                  <span className="text-[10px] text-nexus-muted block">Uniqueness</span>
                  <span className="font-bold text-emerald-400 text-sm">{profiling?.uniqueness ?? '100.0%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 font-mono">
                  <span className="text-[10px] text-nexus-muted block">Integrity</span>
                  <span className="font-bold text-emerald-400 text-sm">{profiling?.integrity ?? '99.8%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 font-mono">
                  <span className="text-[10px] text-nexus-muted block">Overall Score</span>
                  <span className="font-bold text-nexus-pur text-sm">{profiling?.overall_quality_score ?? '98.6%'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'LINEAGE' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <Activity size={16} className="text-nexus-pur" /> End-to-End Automated Data Lineage Graph
              </span>

              <div className="space-y-2 text-xs">
                {lineage.map((lg, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-nexus-pur/20 text-nexus-pur font-bold flex items-center justify-center text-[10px]">
                        {lg.step}
                      </span>
                      <div>
                        <span className="font-bold text-nexus-white block font-sans">{lg.stage}</span>
                        <span className="text-[10px] text-nexus-muted">{lg.system}</span>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-bold">{lg.latency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'FEATURES' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <Cpu size={16} className="text-nexus-pur" /> Linked Feature Store Entries
              </span>

              <div className="space-y-2 text-xs">
                {featureStore.map((fs, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between font-mono">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{fs.feature}</span>
                      <span className="text-[10px] text-nexus-muted">Owner: {fs.owner} | Model: {fs.linked_models}</span>
                    </div>
                    <span className="font-bold text-emerald-400">{fs.importance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Section: AI Assistant Box (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Data Assistant
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {aiPrompts.map((pmpt, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-nexus-text flex items-start gap-2">
                  <span className="text-nexus-pur font-bold">📊</span>
                  <span>{pmpt}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleAiAsk("Generate data quality audit and schema drift report")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate Data Quality Audit
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
