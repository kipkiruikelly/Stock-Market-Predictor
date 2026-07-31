import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, Monitor, Cpu, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const OperationsScreenerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [surveillance, setSurveillance] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [aiMonitoring, setAiMonitoring] = useState<any>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'SURVEILLANCE' | 'ALERTS' | 'AI'>('SERVICES');

  const fetchOpsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/operations/screener/dashboard');
      if (res && res.ok) {
        setOverview(res.overview);
        setServices(res.services_health || []);
        setSurveillance(res.market_surveillance || []);
        setAlerts(res.alerts || []);
        setTimeline(res.incident_timeline || []);
        setAiMonitoring(res.ai_monitoring);
        setAiPrompts(res.ai_ops_prompts || []);
      } else {
        setError(res?.error || 'Failed to fetch Operations Screener telemetry.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Operations Screener.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsData();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Ops Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur font-mono">Screener Monitor</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Monitor className="text-nexus-pur" size={26} />
            Enterprise Operations Screener & Infrastructure Health Monitor
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Datadog / OpenTelemetry Sync
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Institutional Operations Center for system health monitoring, infrastructure telemetry, market surveillance, alert dispatch, and incident response.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Operations Screener Telemetry Log")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Telemetry
          </button>
          <button 
            onClick={fetchOpsData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Operations
          </button>
        </div>
      </div>

      {/* ── Executive Overview KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">System Health</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.system_health ?? '—'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Incidents: {overview?.active_incidents ?? 0}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Healthy Services</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.healthy_services ?? '—'}</div>
          <span className="text-[10px] font-bold text-nexus-pur mt-1 block">Degraded: {overview?.degraded_services ?? 0}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Response Time</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.avg_response_time ?? '—'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Error Rate: {overview?.error_rate ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Active Users</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.active_users ?? 0}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Brokers: {overview?.connected_brokers ?? 0}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">API Availability</span>
          <div className="text-lg font-black text-purple-400 mt-1">{overview?.api_availability ?? '—'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">MT5: {overview?.mt5_connections ?? 0} Conn</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">AI Engine Status</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.ai_engine_status ?? '—'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Open Alerts: {overview?.open_alerts ?? 0}</span>
        </div>
      </div>

      {/* ── Tab Selector Navigation Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-nexus-border/60 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'SERVICES', label: 'Services Health Grid' },
          { id: 'SURVEILLANCE', label: 'Market Surveillance Streams' },
          { id: 'ALERTS', label: 'Alerts & Incidents' },
          { id: 'AI', label: 'AI Agent Operations' }
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
          
          {activeTab === 'SERVICES' && (
            <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} className="text-nexus-pur" />
                  Infrastructure Services Health Monitor ({services.length})
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Inspecting service health...</div>
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
                        <th className="p-2.5">Service Name</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-right">Uptime</th>
                        <th className="p-2.5 text-right">CPU</th>
                        <th className="p-2.5 text-right">Memory</th>
                        <th className="p-2.5 text-right">Latency</th>
                        <th className="p-2.5 text-right">Error Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexus-border/30 font-mono">
                      {services.map((s, idx) => (
                        <tr key={idx} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                          <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap font-sans">{s.name}</td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400">
                              {s.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-400 whitespace-nowrap">{s.uptime}</td>
                          <td className="p-2.5 text-right font-bold text-nexus-white whitespace-nowrap">{s.cpu}</td>
                          <td className="p-2.5 text-right font-bold text-nexus-muted whitespace-nowrap">{s.memory}</td>
                          <td className="p-2.5 text-right font-bold text-purple-400 whitespace-nowrap">{s.latency}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-400 whitespace-nowrap">{s.error_rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'SURVEILLANCE' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Activity size={16} className="text-nexus-pur" /> Market Feed & Surveillance Streams</span>
                <span className="text-[10px] text-emerald-400 font-bold">Live Stream Sync</span>
              </span>

              <div className="space-y-2 text-xs font-mono">
                {surveillance.map((m, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{m.feed}</span>
                      <span className="text-[10px] text-nexus-muted">Volume: {m.volume}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 block">{m.status} ({m.latency})</span>
                      <span className="text-[9px] font-bold text-nexus-pur">{m.quality}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ALERTS' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <ShieldCheck size={16} className="text-amber-400" /> Operational Alerts & Incident History
              </span>

              <div className="space-y-2 text-xs">
                {alerts.map((a, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between font-mono">
                    <div>
                      <span className="font-bold text-amber-400 block font-sans">{a.id} - {a.category}</span>
                      <span className="text-[10px] text-nexus-white">{a.message}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 uppercase">
                        {a.severity}
                      </span>
                      <span className="text-[10px] text-nexus-muted block mt-1">{a.time}</span>
                    </div>
                  </div>
                ))}

                {timeline.map((inc, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between font-mono">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{inc.id} - {inc.title}</span>
                      <span className="text-[10px] text-nexus-muted">Root Cause: {inc.root_cause}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 uppercase">
                        {inc.status} ({inc.duration})
                      </span>
                      <span className="text-[10px] text-nexus-muted block mt-1">{inc.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'AI' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <Cpu size={16} className="text-nexus-pur" /> AI Agent Operations & Consensus
              </span>

              {aiMonitoring ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[10px] text-nexus-muted block font-sans">Active AI Agents</span>
                    <span className="font-bold text-emerald-400 text-sm">{aiMonitoring?.active_agents ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[10px] text-nexus-muted block font-sans">Consensus Score</span>
                    <span className="font-bold text-emerald-400 text-sm">{aiMonitoring?.agent_consensus_score ?? '—'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[10px] text-nexus-muted block font-sans">Knowledge Graph Nodes</span>
                    <span className="font-bold text-nexus-white text-sm">{aiMonitoring?.knowledge_graph_nodes ?? '—'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[10px] text-nexus-muted block font-sans">Inference Queue</span>
                    <span className="font-bold text-emerald-400 text-sm">{aiMonitoring?.inference_queue ?? '—'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[10px] text-nexus-muted block font-sans">Context Storage</span>
                    <span className="font-bold text-nexus-white text-sm">{aiMonitoring?.context_storage ?? '—'}</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-nexus-muted text-xs">No AI monitoring telemetry available.</div>
              )}
            </div>
          )}

        </div>

        {/* Right Section: AI Assistant Box (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual Operations AI Co-Pilot
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {aiPrompts.map((pmpt, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 text-nexus-text flex items-start gap-2">
                  <span className="text-nexus-pur font-bold">🖥️</span>
                  <span>{pmpt}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleAiAsk("Generate infrastructure health and telemetry report")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate Operations Audit
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
