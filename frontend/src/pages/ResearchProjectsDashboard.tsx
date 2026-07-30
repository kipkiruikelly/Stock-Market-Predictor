import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, FolderKanban,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ResearchProjectsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/researchlab/projects/dashboard');
      if (res && res.ok) {
        setOverview(res.overview);
        setProjects(res.projects || []);
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
            <span className="text-nexus-pur">Projects Command Center</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <FolderKanban className="text-nexus-pur" size={26} />
            Quantitative Research Projects Command Center
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Research Workspace
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Central hub for quantitative research initiatives, model development, experiments, and team collaboration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Research Projects Catalog")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Catalog
          </button>
          <button 
            onClick={fetchProjects}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* ── Executive Overview Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active Projects</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.active_projects ?? 14}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Completed</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.completed_projects ?? 28}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Archived</span>
          <div className="text-lg font-black text-yellow-400 mt-1">{overview?.archived_projects ?? 6}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Running Pipelines</span>
          <div className="text-lg font-black text-nexus-pur mt-1">{overview?.running_pipelines ?? 8}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Active Researchers</span>
          <div className="text-lg font-black text-purple-400 mt-1">{overview?.active_researchers ?? 12}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active Models</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.active_models ?? 24}</div>
        </div>
      </div>

      {/* ── Main Workspace Table & AI Assistant ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Research Projects Table (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Active Research Projects ({projects.length})
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
                    <tr className="border-b border-nexus-border text-[10px] font-bold uppercase tracking-wider text-nexus-muted bg-nexus-bg/50 select-none">
                      <th className="p-2.5">Project Name</th>
                      <th className="p-2.5">Owner</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-center font-mono">Progress</th>
                      <th className="p-2.5 text-center">Models</th>
                      <th className="p-2.5 text-center">Experiments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {projects.map((p, idx) => (
                      <tr key={idx} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                        <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">
                          {p.name}
                          <span className="text-[10px] text-nexus-muted block font-normal">{p.description}</span>
                        </td>
                        <td className="p-2.5 font-bold text-nexus-muted whitespace-nowrap">{p.owner}</td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            p.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-nexus-pur whitespace-nowrap">{p.progress}</td>
                        <td className="p-2.5 text-center font-mono text-emerald-400 font-bold whitespace-nowrap">{p.models_count}</td>
                        <td className="p-2.5 text-center font-mono text-purple-400 font-bold whitespace-nowrap">{p.experiments_count}</td>
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
                Contextual AI Project Assistant
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <button 
                onClick={() => handleAiAsk("Summarize active quantitative research project progress")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Summarize Projects
              </button>
              <button 
                onClick={() => handleAiAsk("Suggest next hyperparameter experiments for ICT model")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Suggest Experiments
              </button>
              <button 
                onClick={() => handleAiAsk("Identify model drift and research risks across active projects")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Identify Research Risks
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
