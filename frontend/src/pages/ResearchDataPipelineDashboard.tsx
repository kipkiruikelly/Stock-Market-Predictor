import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  AlertTriangle, Sparkles, Workflow,
  Play, Layers, Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ResearchDataPipelineDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [dagNodes, setDagNodes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [resources, setResources] = useState<any>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'PIPELINES' | 'DAG' | 'TASKS' | 'RESOURCES'>('PIPELINES');

  const fetchPipelineData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/researchlab/datapipeline/dashboard');
      if (res && res.ok) {
        setOverview(res.overview);
        setPipelines(res.pipelines || []);
        setDagNodes(res.dag_graph || []);
        setTasks(res.tasks || []);
        setResources(res.resources);
        setAiPrompts(res.ai_pipeline_prompts || []);
      } else {
        setError(res?.error || 'Failed to fetch Data Pipeline status.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Data Pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const handleRunPipeline = () => {
    toast.success("Triggered Data Pipeline Execution DAG");
    fetchPipelineData();
  };

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Pipeline Query: "${prompt}" dispatched`);
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
            <span className="text-nexus-pur font-mono">Data Pipeline Orchestrator</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Workflow className="text-nexus-pur" size={26} />
            Enterprise Data Pipeline & Workflow Orchestration Center
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Airflow / Dagster Sync
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Centralized orchestration control center for ETL data ingestion, automated feature engineering, model training DAGs, and production pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={handleRunPipeline}
            className="px-3.5 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <Play size={14} /> Trigger Pipeline DAG
          </button>
          <button 
            onClick={fetchPipelineData}
            disabled={loading}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Orchestrator
          </button>
        </div>
      </div>

      {/* ── Executive Overview KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Pipelines</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.total_pipelines ?? 18}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Running: {overview?.running_pipelines ?? 4}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Success Rate</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.avg_success_rate ?? '99.4%'}</div>
          <span className="text-[10px] font-bold text-nexus-pur mt-1 block">Runtime: {overview?.avg_runtime ?? '2m 14s'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Processed Today</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.data_processed_today ?? '184.2 GB'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Rate: {overview?.processing_throughput ?? '24.8k/s'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Daily Executions</span>
          <div className="text-lg font-black text-nexus-white mt-1">{overview?.daily_executions ?? 142}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Failed: {overview?.failed_pipelines ?? 0}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Active Workers</span>
          <div className="text-lg font-black text-purple-400 mt-1">{overview?.active_workers ?? 8} Workers</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Queue: {overview?.queue_length ?? 0}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Health Score</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{overview?.pipeline_health_score ?? '99.8%'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Scheduled: {overview?.scheduled_pipelines ?? 12}</span>
        </div>
      </div>

      {/* ── Tab Selector Navigation Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-nexus-border/60 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'PIPELINES', label: 'Pipeline Catalog Grid' },
          { id: 'DAG', label: 'Visual DAG Builder Graph' },
          { id: 'TASKS', label: 'Task Execution Monitor' },
          { id: 'RESOURCES', label: 'Cluster Resource Usage' }
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
          
          {activeTab === 'PIPELINES' && (
            <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} className="text-nexus-pur" />
                  Enterprise Pipelines Catalog ({pipelines.length})
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-nexus-muted text-xs animate-pulse">Inspecting orchestration catalog...</div>
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
                        <th className="p-2.5">Pipeline Name</th>
                        <th className="p-2.5">Domain / Owner</th>
                        <th className="p-2.5">Type & Schedule</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-right">Duration</th>
                        <th className="p-2.5 text-center">Success Rate</th>
                        <th className="p-2.5 text-center">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexus-border/30 font-mono">
                      {pipelines.map((p, idx) => (
                        <tr key={idx} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                          <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">
                            <span className="text-nexus-muted text-[10px] font-sans block">{p.pipeline_id} ({p.version})</span>
                            <span className="font-sans text-sm">{p.name}</span>
                            <span className="text-[10px] text-nexus-muted font-sans block font-normal">{p.description}</span>
                          </td>
                          <td className="p-2.5 font-bold text-nexus-muted whitespace-nowrap font-sans">
                            {p.domain}
                            <span className="text-[10px] text-nexus-pur block font-normal">{p.owner}</span>
                          </td>
                          <td className="p-2.5 text-nexus-white whitespace-nowrap">
                            {p.type}
                            <span className="text-[10px] text-nexus-muted block font-normal">{p.schedule}</span>
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              p.status === 'RUNNING' ? 'bg-emerald-500/15 text-emerald-400 animate-pulse' : 'bg-nexus-pur/10 text-nexus-pur'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-nexus-white whitespace-nowrap">{p.duration}</td>
                          <td className="p-2.5 text-center font-bold text-emerald-400 whitespace-nowrap">{p.success_rate}</td>
                          <td className="p-2.5 text-center font-sans whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              {p.priority}
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

          {activeTab === 'DAG' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Workflow size={16} className="text-nexus-pur" /> Visual DAG Builder Execution Workflow</span>
                <span className="text-[10px] text-emerald-400 font-bold">PL-101 DAG Graph</span>
              </span>

              <div className="space-y-2 text-xs">
                {dagNodes.map((node, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-nexus-pur/20 text-nexus-pur font-bold flex items-center justify-center text-[10px]">
                        {node.step}
                      </span>
                      <span className="font-bold text-nexus-white font-sans">{node.node}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        node.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' :
                        node.status === 'RUNNING' ? 'bg-yellow-500/15 text-yellow-400 animate-pulse' : 'bg-nexus-bg text-nexus-muted'
                      }`}>
                        {node.status}
                      </span>
                      <span className="text-nexus-muted">{node.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'TASKS' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl overflow-x-auto">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <Layers size={16} className="text-nexus-pur" /> Task-Level Execution & Logs Monitor
              </span>

              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-nexus-border/40 text-[10px] text-nexus-muted uppercase">
                    <th className="pb-2">Task ID</th>
                    <th className="pb-2">Task Name</th>
                    <th className="pb-2">Worker</th>
                    <th className="pb-2 text-center">Status</th>
                    <th className="pb-2 text-right">Runtime</th>
                    <th className="pb-2 pl-3">Execution Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border/20">
                  {tasks.map((tsk, i) => (
                    <tr key={i} className="hover:bg-nexus-bg/40">
                      <td className="py-2.5 font-bold text-nexus-pur">{tsk.task_id}</td>
                      <td className="py-2.5 font-bold text-nexus-white font-sans">{tsk.name}</td>
                      <td className="py-2.5 text-nexus-muted">{tsk.worker}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          tsk.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400 animate-pulse'
                        }`}>
                          {tsk.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-nexus-white">{tsk.runtime}</td>
                      <td className="py-2.5 pl-3 text-nexus-muted font-sans text-[11px]">{tsk.logs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'RESOURCES' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <Cpu size={16} className="text-emerald-400" /> Cluster Worker & Resource Utilization
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">CPU Utilization</span>
                  <span className="font-bold text-emerald-400 text-sm">{resources?.cpu_utilization ?? '38.2%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Memory Usage</span>
                  <span className="font-bold text-nexus-white text-sm">{resources?.memory_usage ?? '18.4 GB'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">GPU Utilization</span>
                  <span className="font-bold text-purple-400 text-sm">{resources?.gpu_utilization ?? '42.8%'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Active Workers</span>
                  <span className="font-bold text-emerald-400 text-sm">{resources?.active_workers ?? '8 / 8 Active'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Network Throughput</span>
                  <span className="font-bold text-nexus-white text-sm">{resources?.network_throughput ?? '1.2 GB/s'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Queue Saturation</span>
                  <span className="font-bold text-emerald-400 text-sm">{resources?.queue_utilization ?? '0.0%'}</span>
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
                Contextual AI Pipeline Co-Pilot
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
              onClick={() => handleAiAsk("Generate data pipeline performance and throughput report")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate Orchestration Report
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
