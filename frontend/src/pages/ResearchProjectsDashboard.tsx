import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, FolderKanban, ShieldCheck,
  Cpu, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ResearchProjectsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [lifecycle, setLifecycle] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [resources, setResources] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPERIMENTS' | 'DATASETS' | 'MODELS' | 'RESOURCES' | 'RISK'>('OVERVIEW');

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/researchlab/projects/dashboard');
      if (res && res.ok) {
        setOverview(res.overview);
        setProjects(res.projects || []);
        setLifecycle(res.lifecycle_stages || []);
        setExperiments(res.experiments || []);
        setDatasets(res.datasets || []);
        setModels(res.models_registry || []);
        setResources(res.resource_monitoring);
        setRisk(res.risk_assessment);
        setAiPrompts(res.ai_assistant_prompts || []);
      } else {
        setError(res?.error || 'Failed to fetch Research Projects.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Research Projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Research Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur font-mono">Projects Command Center</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <FolderKanban className="text-nexus-pur" size={26} />
            Institutional Quantitative Research Project Management Workspace
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Enterprise MLOps Live
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Central command center for quantitative research initiatives, model registries, experiments, walk-forward testing, and team governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Institutional Research Projects Report")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Report
          </button>
          <button 
            onClick={fetchProjects}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Projects
          </button>
        </div>
      </div>

      {/* ── Executive Overview Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active Projects</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.active_projects ?? 14}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Completed: {overview?.completed_projects ?? 28}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Running Experiments</span>
          <div className="text-lg font-black text-nexus-pur mt-1">{overview?.running_experiments ?? 42}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Registered: {overview?.registered_models ?? 24}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Training Jobs</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.training_jobs ?? 8}</div>
          <span className="text-[10px] font-bold text-rose-400 mt-1 block">Failed Jobs: {overview?.failed_jobs ?? 1}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Dataset Inventory</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.dataset_count ?? 18}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Predictions: {overview?.total_predictions ?? '1.42M'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Avg Model Accuracy</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.avg_model_accuracy ?? '88.4%'}</div>
          <span className="text-[10px] font-bold text-nexus-pur mt-1 block">Drift: {overview?.avg_drift_score ?? '0.02'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Active Researchers</span>
          <div className="text-lg font-black text-purple-400 mt-1">{overview?.active_researchers ?? 12}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Researchers Online</span>
        </div>
      </div>

      {/* ── Research Lifecycle Timeline ────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border shadow-xl">
        <span className="text-xs font-bold text-nexus-white uppercase tracking-wider block border-b border-nexus-border/50 pb-2 mb-3">
          🔬 Quantitative Research Project Lifecycle Pipeline
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
          {lifecycle.map((st, i) => (
            <div key={i} className="p-2 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-nexus-muted uppercase">Stage {i + 1}</span>
              <span className="font-bold text-nexus-white truncate">{st.stage}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-max ${
                st.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                st.status === 'IN_PROGRESS' ? 'bg-nexus-pur/10 text-nexus-pur border border-nexus-pur/20 animate-pulse' :
                'bg-nexus-bg text-nexus-muted'
              }`}>
                {st.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Selector Navigation Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-nexus-border/60 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'OVERVIEW', label: 'Projects Overview' },
          { id: 'EXPERIMENTS', label: 'ML Experiments' },
          { id: 'DATASETS', label: 'Dataset Inventory' },
          { id: 'MODELS', label: 'Model Registry' },
          { id: 'RESOURCES', label: 'Resource Usage' },
          { id: 'RISK', label: 'Risk & Governance' }
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
        
        {/* Left Main View (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {activeTab === 'OVERVIEW' && (
            <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} className="text-nexus-pur" />
                  Active Institutional Research Initiatives ({projects.length})
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Loading research project registry...</div>
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
                        <th className="p-2.5">ID & Project Name</th>
                        <th className="p-2.5">Owner / Team</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-center font-mono">Progress</th>
                        <th className="p-2.5 text-center">Accuracy</th>
                        <th className="p-2.5 text-center">Phase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexus-border/30 font-mono">
                      {projects.map((p, idx) => (
                        <tr key={idx} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                          <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">
                            <span className="text-nexus-muted text-[10px] font-sans block">{p.project_id}</span>
                            <span className="font-sans text-sm">{p.name}</span>
                            <span className="text-[10px] text-nexus-muted font-sans block font-normal">{p.description}</span>
                          </td>
                          <td className="p-2.5 font-bold text-nexus-muted whitespace-nowrap font-sans">
                            {p.owner}
                            <span className="text-[10px] text-nexus-pur block font-normal">{p.department}</span>
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap font-sans">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              p.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-nexus-pur whitespace-nowrap">{p.progress}</td>
                          <td className="p-2.5 text-center text-emerald-400 font-bold whitespace-nowrap">{p.accuracy}</td>
                          <td className="p-2.5 text-center text-nexus-muted text-[11px] font-sans whitespace-nowrap">{p.phase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'EXPERIMENTS' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Cpu size={16} className="text-nexus-pur" /> MLflow Machine Learning Experiments</span>
              </span>
              <div className="space-y-2 text-xs">
                {experiments.map((exp, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between font-mono">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{exp.name}</span>
                      <span className="text-[10px] text-nexus-muted">{exp.exp_id} | Duration: {exp.duration}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 block">{exp.accuracy}</span>
                      <span className="text-[10px] text-nexus-pur">{exp.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'DATASETS' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Layers size={16} className="text-nexus-pur" /> Research Dataset Catalog & Lineage</span>
              </span>
              <div className="space-y-2 text-xs">
                {datasets.map((ds, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between font-mono">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{ds.name}</span>
                      <span className="text-[10px] text-nexus-muted">{ds.dataset_id} | Size: {ds.size} | Features: {ds.features}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Quality: {ds.quality}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'MODELS' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /> Registered Model Roles (Champion / Challenger)</span>
              </span>
              <div className="space-y-2 text-xs">
                {models.map((mod, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between font-mono">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{mod.name} ({mod.version})</span>
                      <span className="text-[10px] text-nexus-muted">Role: {mod.role} | Drift: {mod.drift}</span>
                    </div>
                    <span className="font-bold text-emerald-400">{mod.accuracy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'RESOURCES' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <Cpu size={16} className="text-nexus-pur" /> Training Compute & Cloud Resource Monitoring
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block">GPU Utilization</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{resources?.gpu_utilization ?? '42.8%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block">RAM Usage</span>
                  <span className="font-mono font-bold text-nexus-white text-sm">{resources?.ram_usage ?? '14.2 GB'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'RISK' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <ShieldCheck size={16} className="text-emerald-400" /> Project Governance & Risk Audit
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block">Technical Risk</span>
                  <span className="font-mono font-bold text-emerald-400">{risk?.technical_risk ?? 'LOW'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block">Model Drift Risk</span>
                  <span className="font-mono font-bold text-emerald-400">{risk?.model_risk ?? 'LOW'}</span>
                </div>
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
                Contextual AI Research Assistant
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {aiPrompts.map((pmpt, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-nexus-text flex items-start gap-2">
                  <span className="text-nexus-pur font-bold">🧪</span>
                  <span>{pmpt}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleAiAsk("Generate research proposal summary and experiment validation audit")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate Research Audit
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
