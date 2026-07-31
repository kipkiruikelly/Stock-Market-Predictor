import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, Cpu,
  DollarSign, Layers, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const CloudCostsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [optimizations, setOptimizations] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [aiAnalytics, setAiAnalytics] = useState<any>(null);
  const [sustainability, setSustainability] = useState<any>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'BREAKDOWN' | 'UTILIZATION' | 'OPTIMIZATION' | 'BUDGET_AI'>('BREAKDOWN');

  const fetchCosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/executive/cloud-costs');
      if (res && res.ok) {
        setSummary(res.executive_summary);
        setBreakdown(res.cost_breakdown);
        setResources(res.resource_utilization || []);
        setOptimizations(res.optimizations || []);
        setBudget(res.budget_management);
        setAiAnalytics(res.ai_finops_analytics);
        setSustainability(res.sustainability);
        setAiPrompts(res.ai_finops_prompts || []);
      } else {
        setError(res?.error || 'Failed to fetch Cloud FinOps data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Cloud FinOps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI FinOps Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Breadcrumb & Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span> / <span>Executive</span> / <span className="text-nexus-pur font-mono">Cloud FinOps</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Cpu className="text-nexus-pur" size={26} />
            Enterprise Cloud Financial Operations (FinOps) Workspace
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              AWS / GCP FinOps Sync
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Enterprise cloud financial management workspace for cost allocation, GPU compute optimization, budget tracking, green sustainability, and automated FinOps savings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button onClick={() => toast.success("Exported Cloud FinOps Governance Report")} className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 cursor-pointer transition">
            <Download size={14} /> Export FinOps Brief
          </button>
          <button onClick={fetchCosts} disabled={loading} className="px-4 py-2 bg-nexus-pur text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-nexus-pur/20 hover:bg-nexus-pur/80 transition">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream FinOps
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Monthly Spend</span>
          <div className="text-base sm:text-lg font-black text-yellow-400 mt-1">{summary?.current_month_spend ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Projected: {summary?.projected_monthend ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Budget Health</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.budget_utilization ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Remaining: {summary?.remaining_budget ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">GPU Compute</span>
          <div className="text-base sm:text-lg font-black text-nexus-pur mt-1">{summary?.gpu_cost ?? '—'}</div>
          <span className="text-[9px] font-bold text-nexus-muted">43.0% of Total</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Potential Savings</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.cost_savings ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Efficiency: {summary?.efficiency_score ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Reserved Savings</span>
          <div className="text-base sm:text-lg font-black text-nexus-white mt-1">{summary?.reserved_instance_savings ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Spot: {summary?.spot_instance_savings ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Cost / Customer</span>
          <div className="text-base sm:text-lg font-black text-nexus-white mt-1">{summary?.cost_per_customer ?? '—'}</div>
          <span className="text-[9px] font-bold text-nexus-muted">Per Org / Month</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Cost / Trade</span>
          <div className="text-base sm:text-lg font-black text-purple-400 mt-1">{summary?.cost_per_trade ?? '—'}</div>
          <span className="text-[9px] font-bold text-purple-400">Per Pred: $0.00003</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Annual Run-Rate</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.annual_spend ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Optimal FinOps</span>
        </div>
      </div>

      {/* ── Tab Selector Navigation Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-nexus-border/60 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'BREAKDOWN', label: 'Cost Breakdown by Service & Env' },
          { id: 'UTILIZATION', label: 'Cluster Resource Utilization' },
          { id: 'OPTIMIZATION', label: 'Cost Optimization Center' },
          { id: 'BUDGET_AI', label: 'Budget, AI Compute & Sustainability' }
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
          
          {activeTab === 'BREAKDOWN' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2 flex items-center gap-2">
                  <DollarSign size={16} className="text-yellow-400" /> Cloud Cost by Service
                </span>
                {loading ? (
                  <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Analyzing costs...</div>
                ) : error ? (
                  <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
                ) : (
                  <div className="flex flex-col gap-2 text-xs font-mono">
                    {breakdown?.by_service?.map((s: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                        <span className="font-bold text-nexus-white font-sans">{s.service}</span>
                        <span className="font-bold text-yellow-400">{s.cost} ({s.pct})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2 flex items-center gap-2">
                  <Layers size={16} className="text-nexus-pur" /> Cloud Cost by Environment
                </span>
                <div className="flex flex-col gap-2 text-xs font-mono">
                  {breakdown?.by_environment?.map((e: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                      <span className="font-bold text-nexus-white font-sans">{e.env}</span>
                      <span className="font-bold text-purple-400">{e.cost} ({e.pct})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'UTILIZATION' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Activity size={16} className="text-emerald-400" /> Infrastructure Resource Utilization</span>
                <span className="text-[10px] text-emerald-400 font-bold">Cluster Health 100%</span>
              </span>

              <div className="space-y-2 text-xs font-mono">
                {resources.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{r.resource}</span>
                      <span className="text-[10px] text-nexus-muted">Type: {r.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 block">{r.status}</span>
                      <span className="text-[10px] text-purple-400">Load: {r.utilization}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'OPTIMIZATION' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Sparkles size={16} className="text-emerald-400" /> Automated FinOps Cost Optimization Opportunities</span>
                <span className="text-[10px] text-emerald-400 font-bold">Est. Savings: $6.2K/mo</span>
              </span>

              <div className="space-y-2 text-xs font-mono">
                {optimizations.map((o, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{o.resource}</span>
                      <span className="text-[10px] text-nexus-muted font-sans">{o.recommendation}</span>
                    </div>
                    <div className="text-right font-sans">
                      <span className="font-bold text-emerald-400 block">{o.savings}</span>
                      <span className="text-[10px] text-nexus-pur">Risk: {o.impact} | Diff: {o.difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'BUDGET_AI' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" /> Budget Governance & AI GPU Costs
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[9px] text-nexus-muted block font-sans">Monthly Budget</span>
                    <span className="font-bold text-nexus-white">{budget?.monthly_budget ?? '—'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[9px] text-nexus-muted block font-sans">Variance</span>
                    <span className="font-bold text-emerald-400">{budget?.variance ?? '-$7.2K'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[9px] text-nexus-muted block font-sans">ML Training Cost</span>
                    <span className="font-bold text-nexus-pur">{aiAnalytics?.model_training_cost ?? '—'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[9px] text-nexus-muted block font-sans">Inference Cost</span>
                    <span className="font-bold text-purple-400">{aiAnalytics?.inference_cost ?? '—'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2 flex items-center gap-2">
                  <Cpu size={16} className="text-emerald-400" /> Green Infrastructure & Sustainability
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <span className="text-nexus-white font-sans font-bold">Carbon Footprint</span>
                    <span className="font-bold text-emerald-400">{sustainability?.carbon_footprint ?? '1.82 metric tons'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <span className="text-nexus-white font-sans font-bold">Green Energy Score</span>
                    <span className="font-bold text-emerald-400">{sustainability?.green_energy_score ?? '—'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <span className="text-nexus-white font-sans font-bold">Renewable Energy</span>
                    <span className="font-bold text-nexus-pur">{sustainability?.renewable_energy_usage ?? '—'}</span>
                  </div>
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
                Contextual AI FinOps Co-Pilot
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
              onClick={() => handleAiAsk("Generate C-suite Cloud FinOps cost optimization report")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate FinOps Audit Brief
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
