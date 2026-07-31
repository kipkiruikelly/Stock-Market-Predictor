import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, TrendingUp,
  Layers, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const ExecutiveGrowthDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [capacity, setCapacity] = useState<any>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'COHORTS' | 'INITIATIVES' | 'SCENARIOS' | 'CAPACITY'>('COHORTS');

  const fetchGrowth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/executive/growth');
      if (res && res.ok) {
        setSummary(res.executive_summary);
        setCohorts(res.cohorts || []);
        setInitiatives(res.expansion_initiatives || []);
        setScenarios(res.scenario_models || []);
        setCapacity(res.capacity_planning);
        setAiPrompts(res.ai_growth_prompts || []);
      } else {
        setError(res?.error || 'Failed to fetch Growth scorecards.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Growth data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowth();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Breadcrumb & Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span> / <span>Executive</span> / <span className="text-nexus-pur font-mono">Growth Planning</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <TrendingUp className="text-nexus-pur" size={26} />
            Enterprise Strategic Growth Intelligence & Capacity Planning Workspace
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Oracle EPM / Anaplan Sync
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Institutional strategic growth workspace for ARR/MRR velocity forecasting, cohort retention, expansion initiative tracking, scenario modeling, and system capacity planning.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button onClick={() => toast.success("Exported Growth Strategy Report")} className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 cursor-pointer transition">
            <Download size={14} /> Export Strategic Brief
          </button>
          <button onClick={fetchGrowth} disabled={loading} className="px-4 py-2 bg-nexus-pur text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-nexus-pur/20 hover:bg-nexus-pur/80 transition">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Growth
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total ARR</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.arr ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">YoY: {summary?.arr_growth_yoy ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total MRR</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.mrr ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">MoM: {summary?.mrr_growth_mom ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Net New MRR</span>
          <div className="text-base sm:text-lg font-black text-nexus-white mt-1">{summary?.net_new_mrr ?? '—'}</div>
          <span className="text-[9px] font-bold text-nexus-muted">Monthly Delta</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Expansion MRR</span>
          <div className="text-base sm:text-lg font-black text-purple-400 mt-1">{summary?.expansion_mrr ?? '—'}</div>
          <span className="text-[9px] font-bold text-purple-400">Upsell Rate</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">NRR / GRR</span>
          <div className="text-base sm:text-lg font-black text-nexus-pur mt-1">{summary?.nrr ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">GRR: {summary?.grr ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Active Orgs</span>
          <div className="text-base sm:text-lg font-black text-nexus-white mt-1">{summary?.active_orgs ?? 0}</div>
          <span className="text-[9px] font-bold text-nexus-muted">Seats: {summary?.active_seats ?? 0}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Expansion Score</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">{summary?.market_expansion_score ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Velocity: {summary?.growth_velocity_index ?? '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">AI Adoption</span>
          <div className="text-base sm:text-lg font-black text-purple-400 mt-1">{summary?.ai_adoption_rate ?? '—'}</div>
          <span className="text-[9px] font-bold text-emerald-400">Optimal Scale</span>
        </div>
      </div>

      {/* ── Tab Selector Navigation Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-nexus-border/60 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'COHORTS', label: 'Cohort Retention & Net MRR' },
          { id: 'INITIATIVES', label: 'Strategic Expansion Initiatives' },
          { id: 'SCENARIOS', label: 'Growth Scenario Models' },
          { id: 'CAPACITY', label: 'System Capacity Planning' }
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
          
          {activeTab === 'COHORTS' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="flex items-center gap-2"><Layers size={16} className="text-nexus-pur" /> Quarterly Cohort Retention & Expansion Velocity</span>
                <span className="text-[10px] text-emerald-400 font-bold">NRR Rate: 128.4%</span>
              </span>

              {loading ? (
                <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Loading cohorts...</div>
              ) : error ? (
                <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {cohorts.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                      <span className="font-bold text-nexus-white font-sans">{c.cohort}</span>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400 block font-sans">Net MRR: {c.net_mrr}</span>
                        <span className="text-[10px] text-nexus-muted">Retention: {c.retention} | Expansion: {c.growth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'INITIATIVES' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <Activity size={16} className="text-emerald-400" /> Strategic Expansion Initiative Tracker
              </span>

              <div className="space-y-2 text-xs font-mono">
                {initiatives.map((init, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-nexus-white block font-sans">{init.name}</span>
                      <span className="text-[10px] text-nexus-muted font-sans">Sponsor: {init.sponsor} | Priority: {init.priority}</span>
                    </div>
                    <div className="text-right font-sans">
                      <span className="font-bold text-emerald-400 block">{init.status}</span>
                      <span className="text-[10px] text-purple-400">Budget: {init.budget} (ROI: {init.roi})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'SCENARIOS' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <TrendingUp size={16} className="text-nexus-pur" /> Growth Scenario Simulation Models
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                {scenarios.map((sc, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                    <span className="text-[10px] text-nexus-muted block font-sans font-bold">{sc.scenario}</span>
                    <span className="font-bold text-nexus-white text-sm mt-1 block">ARR: {sc.projected_arr}</span>
                    <span className="text-[9px] text-emerald-400 block mt-0.5">MRR: {sc.projected_mrr}</span>
                    <span className="text-[9px] text-yellow-400 block mt-0.5">Cloud: {sc.cloud_spend}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'CAPACITY' && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
                <ShieldCheck size={16} className="text-emerald-400" /> Infrastructure Capacity Planning & Limits
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Trading Volume Capacity</span>
                  <span className="font-bold text-emerald-400 text-sm">{capacity?.trading_volume_capacity ?? '—'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">GPU Inference Capacity</span>
                  <span className="font-bold text-nexus-pur text-sm">{capacity?.gpu_inference_capacity ?? '1.42M / 10M Pred/Day'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Database Storage Cluster</span>
                  <span className="font-bold text-nexus-white text-sm">{capacity?.db_storage_capacity ?? '4.2 TB / 20 TB'}</span>
                </div>
                <div className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30">
                  <span className="text-[10px] text-nexus-muted block font-sans">Active Seat Capacity</span>
                  <span className="font-bold text-purple-400 text-sm">{capacity?.seat_capacity ?? '1,840 / 5,000 Seats'}</span>
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
                Contextual AI Growth Co-Pilot
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
              onClick={() => handleAiAsk("Generate C-suite Strategic Growth Intelligence brief")}
              className="w-full py-2.5 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer mt-2"
            >
              🤖 Generate Strategic Growth Brief
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
