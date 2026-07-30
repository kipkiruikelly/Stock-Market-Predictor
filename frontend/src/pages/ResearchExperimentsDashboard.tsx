import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, FlaskConical
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ResearchExperimentsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [experiments, setExperiments] = useState<any[]>([]);

  const fetchExperiments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/researchlab/experiments/dashboard');
      if (res && res.ok) {
        setExperiments(res.experiments || []);
      } else {
        setError(res?.error || 'Failed to fetch Research Experiments.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Research Experiments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Experiment Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur">Experiment Tracker</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <FlaskConical className="text-nexus-pur" size={26} />
            Institutional MLflow Experiment Tracker
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Hyperparameter Tracking Active
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            MLflow-style experiment tracking, hyperparameter evolution logs, validation loss, and feature importance matrices.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported ML Experiment Logs")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Logs
          </button>
          <button 
            onClick={fetchExperiments}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* ── Main Workspace Table & AI Assistant ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Experiments Table (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Active & Logged Experiments ({experiments.length})
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Loading experiment logs...</div>
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
                      <th className="p-2.5">Experiment</th>
                      <th className="p-2.5">Model</th>
                      <th className="p-2.5 font-mono text-right">Accuracy</th>
                      <th className="p-2.5 font-mono text-right">F1 Score</th>
                      <th className="p-2.5 font-mono text-right">Sharpe</th>
                      <th className="p-2.5 font-mono text-right">Loss</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {experiments.map((exp, idx) => (
                      <tr key={idx} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                        <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">
                          {exp.experiment}
                          <span className="text-[10px] text-nexus-muted block font-normal">{exp.dataset}</span>
                        </td>
                        <td className="p-2.5 text-nexus-muted font-bold whitespace-nowrap">{exp.model}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">{exp.accuracy}</td>
                        <td className="p-2.5 text-right font-mono text-purple-400 font-bold whitespace-nowrap">{exp.f1}</td>
                        <td className="p-2.5 text-right font-mono text-nexus-pur font-bold whitespace-nowrap">{exp.sharpe}</td>
                        <td className="p-2.5 text-right font-mono text-yellow-400 whitespace-nowrap">{exp.loss}</td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            exp.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400 animate-pulse'
                          }`}>
                            {exp.status}
                          </span>
                        </td>
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
                Contextual AI Experiment Assistant
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <button 
                onClick={() => handleAiAsk("Compare hyperparameter choices across ICT and Stacking experiments")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Compare Hyperparameters
              </button>
              <button 
                onClick={() => handleAiAsk("Detect overfitting in validation loss curve")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Detect Overfitting
              </button>
              <button 
                onClick={() => handleAiAsk("Recommend hyperparameter tuning grid for next experiment run")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Recommend Tuning Grid
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
