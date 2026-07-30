import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, AlertTriangle, Sparkles, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const AdminSettingsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<any>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/settings/dashboard');
      if (res && res.ok) {
        setSettings(res.settings);
      } else {
        setError(res?.error || 'Failed to fetch System Settings.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span> / <span>Administration</span> / <span className="text-nexus-pur">System Settings</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Settings className="text-nexus-pur" size={26} />
            Unified System Settings & Environment Controls
          </h1>
          <p className="text-xs text-nexus-muted mt-1">Unified configuration across Security, Trading, AI FOS, Research Lab, MLOps, and Infrastructure.</p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button onClick={() => toast.success("Exported System Configuration")} className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 cursor-pointer">
            <Download size={14} /> Export Config
          </button>
          <button onClick={fetchSettings} disabled={loading} className="px-4 py-2 bg-nexus-pur text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-nexus-pur/20">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2">Active System Configuration</span>
            {loading ? (
              <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Loading settings...</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block uppercase font-bold">Security MFA Required</span>
                  <span className="font-mono font-bold text-emerald-400 mt-1 block">{settings?.security?.mfa_required ? 'TRUE' : 'FALSE'}</span>
                </div>
                <div className="p-3 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block uppercase font-bold">Circuit Breaker Drawdown Limit</span>
                  <span className="font-mono font-bold text-yellow-400 mt-1 block">{settings?.trading?.max_drawdown_circuit_breaker_pct}%</span>
                </div>
                <div className="p-3 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block uppercase font-bold">AI Confidence Threshold</span>
                  <span className="font-mono font-bold text-purple-400 mt-1 block">{settings?.ai?.confidence_threshold_pct}%</span>
                </div>
                <div className="p-3 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block uppercase font-bold">GPU Cluster Max Nodes</span>
                  <span className="font-mono font-bold text-emerald-400 mt-1 block">{settings?.cloud?.gpu_cluster_max_nodes} Nodes</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">AI Config Assistant</span>
            </div>
            <button onClick={() => handleAiAsk("Audit system configuration security compliance")} className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer">
              🤖 Audit System Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
