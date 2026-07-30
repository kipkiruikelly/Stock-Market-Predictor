import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, ShieldCheck,
  Award, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ResearchModelRegistryDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registry, setRegistry] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchRegistry = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/researchlab/modelregistry/dashboard');
      if (res && res.ok) {
        setRegistry(res.registry || []);
        setAuditLogs(res.audit_logs || []);
      } else {
        setError(res?.error || 'Failed to fetch Model Registry.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Model Registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Governance Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur">Enterprise Model Registry</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <ShieldCheck className="text-nexus-pur" size={26} />
            Enterprise Model Registry & Governance Console
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Canary & Governance Active
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Enterprise AI model governance, promotion lifecycle (Dev → Validation → Champion → Production), canary deployments, and bias audit reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Model Governance & Compliance Audit")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Governance Report
          </button>
          <button 
            onClick={fetchRegistry}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Main Workspace Table, Audit Logs & AI Assistant ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Model Registry Table & Audit Logs (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Registered Enterprise Models ({registry.length})
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Loading model registry...</div>
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
                      <th className="p-2.5">Model Name</th>
                      <th className="p-2.5">Owner</th>
                      <th className="p-2.5 text-center">Stage</th>
                      <th className="p-2.5 text-center">Approval</th>
                      <th className="p-2.5 text-center">Deployment</th>
                      <th className="p-2.5 font-mono text-right">Drift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {registry.map((r, idx) => (
                      <tr key={idx} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                        <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">
                          {r.model}
                          <span className="text-[10px] text-nexus-muted block font-normal">{r.version}</span>
                        </td>
                        <td className="p-2.5 text-nexus-muted font-bold whitespace-nowrap">{r.owner}</td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-nexus-pur/15 text-nexus-pur">
                            {r.stage}
                          </span>
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            r.approval === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'
                          }`}>
                            {r.approval}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono text-emerald-400 font-bold whitespace-nowrap">{r.deployment}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">{r.drift}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit Logs Stream */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Clock size={16} className="text-emerald-400" /> Governance & Promotion Audit Trail
            </span>
            <div className="flex flex-col gap-1.5 text-xs">
              {auditLogs.map((al, i) => (
                <div key={i} className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <span className="text-nexus-white font-bold">{al.detail}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400">
                    {al.event}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: AI Assistant Box (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Governance Assistant
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <button 
                onClick={() => handleAiAsk("Explain promotion lifecycle requirements from Validation to Champion")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Explain Promotion Lifecycle
              </button>
              <button 
                onClick={() => handleAiAsk("Recommend model promotion for Deep Conv1D Microstructure model")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Recommend Promotion
              </button>
              <button 
                onClick={() => handleAiAsk("Generate enterprise compliance & bias audit report")}
                className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Generate Governance Report
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
