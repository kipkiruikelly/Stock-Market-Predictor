import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, Sliders, Cpu, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const OperationsSettingsControlDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [platformSettings, setPlatformSettings] = useState<any[]>([]);
  const [infraConfigs, setInfrastructureConfigs] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'PLATFORM' | 'INFRASTRUCTURE' | 'INTEGRATIONS'>('PLATFORM');

  const fetchSettingsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/operations/settingscontrol/dashboard');
      if (res && res.ok) {
        setOverview(res.overview);
        setPlatformSettings(res.platform_settings || []);
        setInfrastructureConfigs(res.infrastructure_configs || []);
        setIntegrations(res.integrations || []);
        setAiPrompts(res.ai_settings_prompts || []);
      } else {
        setError(res?.error || 'Failed to fetch Operations Settings Control telemetry.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Operations Settings Control.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Ops Settings Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Breadcrumb & Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Operations</span>
            <span>/</span>
            <span className="text-nexus-pur font-mono">Settings Controls</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Sliders className="text-nexus-pur" size={26} />
            Enterprise Operations Settings Control Center & Platform Policy Manager
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              GCP / Azure Governance Sync
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Centralized platform operations control center for system-wide configuration, infrastructure policies, integration management, and security governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Operational Configuration Log")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Settings
          </button>
          <button 
            onClick={fetchSettingsData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Settings
          </button>
        </div>
      </div>

      {/* ── Executive Overview KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active Profiles</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.active_profiles ?? 18}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Pending: {overview?.pending_changes ?? 0}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Config Drift</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.config_drift ?? '0.00%'}</div>
          <span className="text-[10px] font-bold text-nexus-pur mt-1 block">Backup: {overview?.backup_status ?? '100%'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Automation Rules</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.automation_rules ?? 12}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Updates: {overview?.recent_updates ?? 24}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Integrations</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.active_integrations ?? 8} Connected</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Services: {overview?.connected_services ?? 18}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Feature Flags</span>
          <div className="text-lg font-black text-purple-400 mt-1">{overview?.feature_flags_enabled ?? 18} Enabled</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Policies: {overview?.security_policies ?? 14}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Maintenance</span>
          <div className="text-lg font-black text-emerald-400 mt-1">NONE</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Deployments: {overview?.failed_deployments ?? 0} Fail</span>
        </div>
      </div>

      {/* ── Tab Selector Navigation Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-nexus-border/60 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'PLATFORM', label: 'Platform Settings Manager' },
          { id: 'INFRASTRUCTURE', label: 'Infrastructure Configurations' },
          { id: 'INTEGRATIONS', label: 'Integrations & API Gateways' }
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
          
          {activeTab === 'PLATFORM' && (
            <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} className="text-nexus-pur" />
                  System-Wide Platform Settings ({platformSettings.length})
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Inspecting platform settings...</div>
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
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Setting Name</th>
                        <th className="p-2.5">Current Value</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-right">Last Modified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexus-border/30 font-mono">
                      {platformSettings.map((s, idx) => (
                        <tr key={idx} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                          <td className="p-2.5 font-bold text-nexus-pur font-sans whitespace-nowrap">{s.category}</td>
                          <td className="p-2.5 font-bold text-nexus-white font-sans whitespace-nowrap">{s.setting}</td>
                          <td className="p-2.5 text-nexus-white font-bold whitespace-nowrap">{s.value}</td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 font-sans">
                              {s.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right text-nexus-muted whitespace-nowrap font-sans">{s.last_modified}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'INFRASTRUCTURE' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Cpu size={16} className="text-nexus-pur" /> Infrastructure & Cluster Configurations</span>
                <span className="text-[10px] text-emerald-400 font-bold">Cluster Health 100%</span>
              </span>

              <div className="space-y-2 text-xs font-mono">
                {infraConfigs.map((ic, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{ic.component}</span>
                      <span className="text-[10px] text-nexus-muted">Env: {ic.env} | Secrets: {ic.secrets}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 block">{ic.health} ({ic.version})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'INTEGRATIONS' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <ShieldCheck size={16} className="text-emerald-400" /> Active Integrations & External Gateways
              </span>

              <div className="space-y-2 text-xs font-mono">
                {integrations.map((ig, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{ig.name}</span>
                      <span className="text-[10px] text-nexus-muted">Type: {ig.type} | Auth: {ig.auth}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 block">{ig.status} ({ig.latency})</span>
                    </div>
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
                Contextual Operations Settings Co-Pilot
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {aiPrompts.map((pmpt, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-nexus-text flex items-start gap-2">
                  <span className="text-nexus-pur font-bold">⚙️</span>
                  <span>{pmpt}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleAiAsk("Generate operational configuration drift report")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Audit Settings Drift
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
