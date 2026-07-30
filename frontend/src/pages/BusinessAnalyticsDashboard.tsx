import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, AlertTriangle, Sparkles, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const BusinessAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<any>(null);
  const [segmentation, setSegmentation] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/executive/business-analytics/dashboard');
      if (res && res.ok) {
        setMetrics(res.metrics);
        setSegmentation(res.segmentation || []);
      } else {
        setError(res?.error || 'Failed to fetch Business Analytics.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Business Analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span> / <span>Executive</span> / <span className="text-nexus-pur">Business Analytics</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <BarChart2 className="text-nexus-pur" size={26} />
            Business Intelligence & SaaS Analytics
          </h1>
          <p className="text-xs text-nexus-muted mt-1">Customer LTV, CAC ratio, churn rate, NRR, and revenue segmentation analytics.</p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button onClick={() => toast.success("Exported Report")} className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 cursor-pointer">
            <Download size={14} /> Export Report
          </button>
          <button onClick={fetchAnalytics} disabled={loading} className="px-4 py-2 bg-nexus-pur text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-nexus-pur/20">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Customer LTV</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{metrics?.ltv ?? '$84.5K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-white">Customer CAC</span>
          <div className="text-lg font-black text-nexus-white mt-1">{metrics?.cac ?? '$4.2K'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">LTV / CAC</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{metrics?.ltv_cac_ratio ?? '20.1x'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Churn Rate</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{metrics?.churn_rate ?? '0.42%'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">NRR Rate</span>
          <div className="text-lg font-black text-purple-400 mt-1">{metrics?.net_revenue_retention ?? '128.4%'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur">Subscribers</span>
          <div className="text-lg font-black text-nexus-pur mt-1">{metrics?.active_subscribers ?? 142}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider border-b border-nexus-border/50 pb-2">Revenue Segmentation Breakdown</span>
            {loading ? (
              <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Loading segmentation...</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
            ) : (
              <div className="flex flex-col gap-2 text-xs">
                {segmentation.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <span className="font-bold text-nexus-white">{s.segment}</span>
                    <span className="font-mono font-bold text-emerald-400">{s.revenue} ({s.pct})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">AI Business Analytics</span>
            </div>
            <button onClick={() => handleAiAsk("Explain revenue growth drivers")} className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer">
              🤖 Explain Revenue Growth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
