import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, Cpu, Layers, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ResearchModelsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [xai, setXai] = useState<any[]>([]);
  const [drift, setDrift] = useState<any>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'MODELS' | 'LIFECYCLE' | 'XAI' | 'DRIFT'>('MODELS');

  const fetchModelsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/researchlab/models/dashboard');
      if (res && res.ok) {
        setOverview(res.overview);
        setModels(res.models || []);
        setTimeline(res.lifecycle_timeline || []);
        setXai(res.xai_explainability || []);
        setDrift(res.drift_summary);
        setAiPrompts(res.ai_model_prompts || []);
      } else {
        setError(res?.error || 'Failed to fetch AI Models inventory.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching AI Models.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelsData();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Model Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur font-mono">Enterprise AI Model Management Platform</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Cpu className="text-nexus-pur" size={26} />
            Institutional AI Model Inventory, XAI SHAP & Drift Governance
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              MLflow / SageMaker Registry
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Enterprise AI model management platform for model lifecycle, Champion/Challenger promotion, SHAP explainability, and drift monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported AI Model Management Log")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Inventory
          </button>
          <button 
            onClick={fetchModelsData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Models
          </button>
        </div>
      </div>

      {/* ── Executive Overview KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Models</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.total_models ?? 24}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Production: {overview?.production_models ?? 12}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Avg Accuracy</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.avg_accuracy ?? '94.2%'}</div>
          <span className="text-[10px] font-bold text-nexus-pur mt-1 block">Latency: {overview?.avg_latency ?? '1.8ms'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Champion Models</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.champion_models ?? 8}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Challengers: {overview?.challenger_models ?? 6}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Shadow Models</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.shadow_models ?? 4}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Approvals: {overview?.awaiting_approval ?? 3}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Avg Drift Score</span>
          <div className="text-lg font-black text-purple-400 mt-1">{overview?.avg_drift_score ?? '0.02%'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Retraining: {overview?.retraining_models ?? 2}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Last Deployment</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.last_deployment ?? '12m ago'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Retrained: {overview?.last_retraining ?? '1h ago'}</span>
        </div>
      </div>

      {/* ── Tab Selector Navigation Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-nexus-border/60 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'MODELS', label: 'AI Model Inventory Grid' },
          { id: 'LIFECYCLE', label: 'Model Lifecycle Timeline' },
          { id: 'XAI', label: 'XAI SHAP Explainability' },
          { id: 'DRIFT', label: 'Drift Monitoring Summary' }
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
          
          {activeTab === 'MODELS' && (
            <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} className="text-nexus-pur" />
                  Enterprise Model Registry Inventory ({models.length})
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Inspecting model inventory...</div>
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
                        <th className="p-2.5">Model Name</th>
                        <th className="p-2.5">Algorithm / Asset</th>
                        <th className="p-2.5">Stage / Owner</th>
                        <th className="p-2.5 text-right">Accuracy</th>
                        <th className="p-2.5 text-right">Sharpe</th>
                        <th className="p-2.5 text-center">Drift Score</th>
                        <th className="p-2.5 text-right">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexus-border/30 font-mono">
                      {models.map((m, idx) => (
                        <tr key={idx} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                          <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">
                            <span className="text-nexus-muted text-[10px] font-sans block">{m.model_id} ({m.version})</span>
                            <span className="font-sans text-sm">{m.name}</span>
                            <span className="text-[10px] text-nexus-muted font-sans block font-normal">{m.strategy}</span>
                          </td>
                          <td className="p-2.5 font-bold text-nexus-muted whitespace-nowrap font-sans">
                            {m.algorithm}
                            <span className="text-[10px] text-nexus-pur block font-normal">{m.asset_class}</span>
                          </td>
                          <td className="p-2.5 text-nexus-white whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-nexus-pur/10 text-nexus-pur border border-nexus-pur/20 block w-fit">
                              {m.stage}
                            </span>
                            <span className="text-[10px] text-nexus-muted block font-normal mt-0.5">{m.owner}</span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-400 whitespace-nowrap">{m.accuracy}</td>
                          <td className="p-2.5 text-right font-bold text-purple-400 whitespace-nowrap">{m.sharpe}</td>
                          <td className="p-2.5 text-center font-bold text-emerald-400 whitespace-nowrap">{m.drift_score}</td>
                          <td className="p-2.5 text-right font-bold text-nexus-white whitespace-nowrap">{m.latency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'LIFECYCLE' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Layers size={16} className="text-nexus-pur" /> Model Lifecycle Audit Timeline</span>
                <span className="text-[10px] text-emerald-400 font-bold">MDL-401 Timeline</span>
              </span>

              <div className="space-y-2 text-xs">
                {timeline.map((tl, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-nexus-pur/20 text-nexus-pur font-bold flex items-center justify-center text-[10px]">
                        {tl.step}
                      </span>
                      <div>
                        <span className="font-bold text-nexus-white block font-sans">{tl.stage}</span>
                        <span className="text-[10px] text-nexus-muted">{tl.detail}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400">
                      {tl.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'XAI' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <ShieldCheck size={16} className="text-emerald-400" /> Explainable AI (XAI) SHAP Feature Drivers
              </span>

              <div className="space-y-2 text-xs font-mono">
                {xai.map((x, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{x.feature}</span>
                      <span className="text-[10px] text-nexus-muted">SHAP Value: {x.shap_value}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 text-sm block">{x.importance}</span>
                      <span className="text-[9px] font-bold text-nexus-pur">{x.direction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'DRIFT' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <Activity size={16} className="text-purple-400" /> Model Drift Sentinel Summary
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Current Drift</span>
                  <span className="font-bold text-emerald-400 text-sm">{drift?.current_drift ?? '0.02%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Concept Drift</span>
                  <span className="font-bold text-emerald-400 text-sm">{drift?.concept_drift ?? '0.01%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">PSI Score</span>
                  <span className="font-bold text-nexus-white text-sm">{drift?.psi_score ?? '0.012'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">KS Statistic</span>
                  <span className="font-bold text-nexus-white text-sm">{drift?.ks_statistic ?? '0.018'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Retraining Status</span>
                  <span className="font-bold text-emerald-400 text-sm">{drift?.retraining_recommendation ?? 'NOT_REQUIRED'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Model Health</span>
                  <span className="font-bold text-emerald-400 text-sm">{drift?.status ?? 'OPTIMAL'}</span>
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
                Contextual AI Model Co-Pilot
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {aiPrompts.map((pmpt, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-nexus-text flex items-start gap-2">
                  <span className="text-nexus-pur font-bold">🤖</span>
                  <span>{pmpt}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleAiAsk("Generate AI model performance and SHAP audit report")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate AI Model Audit
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
