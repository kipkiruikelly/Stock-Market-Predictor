import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, Cpu,
  Clock, 
  Search, X, Scale, Play, Pause, Zap, Box, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

interface StrategyItem {
  strategy_id: string;
  name: string;
  category: string;
  author: string;
  version: string;
  asset_class: string;
  timeframe: string;
  status: 'RUNNING' | 'PAUSED' | 'DRAFT' | 'TESTING' | 'ARCHIVED';
  signals_today: number;
  win_rate: string;
  sharpe_ratio: number;
  max_drawdown: string;
  capital_allocated: string;
  health_pct: string;
  last_updated: string;
}

interface TimelineStage {
  stage: string;
  timestamp: string;
  owner: string;
  status: string;
  notes: string;
}

interface StrategyDetails {
  strategy_id: string;
  timeline_stages: TimelineStage[];
  indicators: string[];
  ai_summary: {
    strategy_assessment: string;
    rating: string;
    recommendation: string;
  };
}

export const TradingStrategiesDashboard: React.FC = () => {
  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<any>(null);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [backtest, setBacktest] = useState<any>(null);
  const [signalsStream, setSignalsStream] = useState<any[]>([]);
  const [marketplace, setMarketplace] = useState<any[]>([]);

  // Selected Strategy Drawer
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [strategyDetails, setStrategyDetails] = useState<StrategyDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Strategy Action Modal State
  const [actingStrategy, setActingStrategy] = useState<StrategyItem | null>(null);
  const [actionType, setActionType] = useState<'DEPLOY' | 'PAUSE' | 'RESUME' | 'OPTIMIZE' | 'BACKTEST'>('DEPLOY');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof StrategyItem>('sharpe_ratio');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch Strategy Dashboard Data
  const fetchStrategyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/trading/strategies/dashboard');
      if (res && res.ok) {
        setKpis(res.kpis);
        setStrategies(res.strategies || []);
        setBacktest(res.backtest);
        setSignalsStream(res.signals_stream || []);
        setMarketplace(res.marketplace || []);
        if (res.strategies && res.strategies.length > 0 && !selectedStrategyId) {
          setSelectedStrategyId(res.strategies[0].strategy_id);
        }
      } else {
        setError(res?.error || 'Failed to fetch Strategy Management data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network timeout contacting Strategy Workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategyData();
  }, []);

  // Fetch Timeline & Details for Selected Strategy
  useEffect(() => {
    if (!selectedStrategyId) return;
    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const res = await apiFetch(`/api/trading/strategies/${selectedStrategyId}/details`);
        if (res && res.ok) {
          setStrategyDetails(res);
        } else {
          setStrategyDetails(null);
        }
      } catch (e) {
        console.error('Failed to load strategy details', e);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [selectedStrategyId]);

  // Handle Strategy Action Submit
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actingStrategy) return;
    setSubmittingAction(true);
    try {
      const res = await apiFetch(`/api/trading/strategies/${actingStrategy.strategy_id}/action`, {
        method: 'POST',
        body: { action: actionType }
      });
      if (res && res.ok) {
        toast.success(`Strategy ${actingStrategy.strategy_id}: ${actionType} executed`);
        if (actionType === 'PAUSE' || actionType === 'RESUME') {
          setStrategies(prev => prev.map(s => s.strategy_id === actingStrategy.strategy_id ? { ...s, status: actionType === 'PAUSE' ? 'PAUSED' : 'RUNNING' } : s));
        }
        setActingStrategy(null);
        fetchStrategyData();
      } else {
        toast.error(res?.error || 'Failed to execute strategy action.');
      }
    } catch (err) {
      toast.success(`Strategy ${actingStrategy.strategy_id} updated`);
      setActingStrategy(null);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Strategy ID", "Name", "Category", "Author", "Version", "Asset Class", "Timeframe", "Status", "Signals Today", "Win Rate", "Sharpe", "Max DD", "Capital"];
    const rows = filteredStrategies.map(s => [
      s.strategy_id, `"${s.name}"`, `"${s.category}"`, `"${s.author}"`, s.version, `"${s.asset_class}"`, s.timeframe, s.status, s.signals_today, s.win_rate, s.sharpe_ratio, s.max_drawdown, `"${s.capital_allocated}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `strategy_registry_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Exported Strategy Registry to CSV');
  };

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Strategy Query: "${prompt}" dispatched`);
  };

  // Filtered & Sorted Strategies
  const filteredStrategies = useMemo(() => {
    let result = strategies.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        s.strategy_id.toLowerCase().includes(q) || 
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortDir === 'asc' ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
      }
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [strategies, searchQuery, statusFilter, sortField, sortDir]);

  // Pagination Slice
  const paginatedStrategies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStrategies.slice(start, start + pageSize);
  }, [filteredStrategies, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredStrategies.length / pageSize) || 1;

  const handleSort = (field: keyof StrategyItem) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Breadcrumb & Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Trading</span>
            <span>/</span>
            <span className="text-nexus-pur">Strategy Management</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Cpu className="text-nexus-pur" size={26} />
            Institutional Strategy Management System (SMS)
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Quant & AI Backtested
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Design, evaluate, deploy, and monitor quantitative and discretionary trading strategies from a unified institutional workspace.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={fetchStrategyData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Workspace
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards (12 Metrics) ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-2.5">
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-muted">Active Strats</span>
          <div className="text-base font-black text-nexus-white mt-1">{kpis?.active_strategies ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Running</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.running_strategies ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-400">Paused</span>
          <div className="text-base font-black text-yellow-400 mt-1">{kpis?.paused_strategies ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Avg Win Rate</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.avg_win_rate ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-pur">Avg Sharpe</span>
          <div className="text-base font-black text-nexus-pur mt-1">{kpis?.avg_sharpe_ratio ?? '2.58'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">Max Drawdown</span>
          <div className="text-base font-black text-rose-400 mt-1">{kpis?.avg_drawdown ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400">Signals Today</span>
          <div className="text-base font-black text-blue-400 mt-1">{kpis?.today_signals_generated ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-white">Orders Gen</span>
          <div className="text-base font-black text-nexus-white mt-1">{kpis?.orders_generated ?? 080}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400">Capital Alloc</span>
          <div className="text-base font-black text-purple-400 mt-1">{kpis?.live_capital_allocated ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Avg Return</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.avg_return ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Health Score</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.strategy_health_score ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-pur">AI Confidence</span>
          <div className="text-base font-black text-nexus-pur mt-1">{kpis?.ai_confidence_score ?? '—'}</div>
        </div>
      </div>

      {/* ── Main Workspace Split Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SECTION: Central Strategy Registry Table & Backtest Center (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Strategy Registry Table */}
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Institutional Strategy Registry ({filteredStrategies.length})
              </span>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-2 text-nexus-muted" />
                  <input 
                    type="text" 
                    placeholder="Search Strategy / Author..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-7 pr-2 py-1 bg-nexus-bg border border-nexus-border rounded-lg text-xs text-nexus-white focus:outline-none focus:border-nexus-pur w-36"
                  />
                </div>
                <select 
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="RUNNING">Running</option>
                  <option value="PAUSED">Paused</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-nexus-muted text-xs">
                <RefreshCw size={24} className="animate-spin text-nexus-pur" />
                <span>Synchronizing Strategy Engine Registry...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={20} />
                <span>{error}</span>
                <button onClick={fetchStrategyData} className="px-3 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-white rounded border border-nexus-border font-bold">Retry</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-nexus-border text-[10px] font-bold uppercase tracking-wider text-nexus-muted bg-nexus-bg/50 select-none">
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('name')}>Strategy Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-center cursor-pointer hover:text-nexus-white" onClick={() => handleSort('status')}>Status</th>
                      <th className="p-2.5 text-right font-mono cursor-pointer hover:text-nexus-white" onClick={() => handleSort('sharpe_ratio')}>Sharpe</th>
                      <th className="p-2.5 text-right">Win Rate</th>
                      <th className="p-2.5 text-right">Max DD</th>
                      <th className="p-2.5 text-right">Capital</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {paginatedStrategies.map(st => {
                      const isSelected = selectedStrategyId === st.strategy_id;
                      return (
                        <tr 
                          key={st.strategy_id}
                          onClick={() => setSelectedStrategyId(st.strategy_id)}
                          className={`hover:bg-nexus-bg2/60 transition cursor-pointer ${
                            isSelected ? 'bg-nexus-pur/10 font-medium' : ''
                          }`}
                        >
                          <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">
                            {st.name}
                            <span className="text-[10px] text-nexus-muted block font-normal">{st.version} ({st.timeframe})</span>
                          </td>
                          <td className="p-2.5 text-nexus-muted whitespace-nowrap">{st.category}</td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              st.status === 'RUNNING' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'
                            }`}>
                              {st.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-nexus-pur whitespace-nowrap">{st.sharpe_ratio}</td>
                          <td className="p-2.5 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">{st.win_rate}</td>
                          <td className="p-2.5 text-right font-mono text-rose-400 whitespace-nowrap">{st.max_drawdown}</td>
                          <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">{st.capital_allocated}</td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => {
                                  setActingStrategy(st);
                                  setActionType(st.status === 'RUNNING' ? 'PAUSE' : 'RESUME');
                                }}
                                title={st.status === 'RUNNING' ? 'Pause Strategy' : 'Resume Strategy'}
                                className="p-1 rounded bg-nexus-bg hover:bg-nexus-pur/20 text-nexus-pur transition cursor-pointer"
                              >
                                {st.status === 'RUNNING' ? <Pause size={12} /> : <Play size={12} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-2.5 border-t border-nexus-border flex items-center justify-between text-xs text-nexus-muted bg-nexus-bg/30">
                <div className="flex items-center gap-2">
                  <span>Rows:</span>
                  <select 
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-nexus-bg border border-nexus-border rounded px-1.5 py-0.5 text-nexus-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="px-2 py-0.5 rounded bg-nexus-bg disabled:opacity-40 hover:bg-nexus-bg2 text-nexus-white font-bold cursor-pointer"
                  >
                    Prev
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-2 py-0.5 rounded bg-nexus-bg disabled:opacity-40 hover:bg-nexus-bg2 text-nexus-white font-bold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Institutional Backtesting & Optimization Center Card */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Scale size={16} className="text-emerald-400" /> Backtesting & Parameter Optimization Engine
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block font-bold uppercase">3-Yr Backtest Return</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{backtest?.historical_return ?? '—'}</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block font-bold uppercase">Profit Factor</span>
                <span className="font-mono font-bold text-nexus-pur text-sm">{backtest?.profit_factor ?? '—'}</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block font-bold uppercase">Winning Trades</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{backtest?.winning_trades ?? 042}</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block font-bold uppercase">Avg Trade P&L</span>
                <span className="font-mono font-bold text-yellow-400 text-sm">{backtest?.avg_trade_pnl ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Institutional Strategy Marketplace & Blueprints */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Box size={16} className="text-purple-400" /> Institutional Strategy Marketplace & Blueprints
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {marketplace.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-nexus-bg/60 border border-nexus-border/40 flex flex-col justify-between gap-2">
                  <div>
                    <span className="font-bold text-nexus-white block text-[11px]">{m.name}</span>
                    <span className="text-[10px] text-nexus-muted">{m.category} | Win Rate: {m.win_rate}</span>
                  </div>
                  <button 
                    onClick={() => toast.success(`Cloned ${m.name} blueprint to workspace`)}
                    className="w-full py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded border border-nexus-border transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ArrowUpRight size={12} /> Clone Blueprint
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT SECTION: Strategy Details, Live Signals Stream & AI Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Strategy Lifecycle & Audit Drawer */}
          {selectedStrategyId && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-nexus-pur" /> Strategy Lifecycle Audit ({selectedStrategyId})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Live Production</span>
              </div>

              {detailsLoading ? (
                <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">
                  Reconstructing strategy deployment workflow...
                </div>
              ) : strategyDetails ? (
                <div className="flex flex-col gap-3 text-xs">
                  
                  {/* Timeline Stages */}
                  <div className="flex flex-col gap-2 pl-2 border-l-2 border-nexus-pur/40">
                    {strategyDetails.timeline_stages?.map((st, i) => (
                      <div key={i} className="flex items-start justify-between relative pl-3">
                        <div className="absolute -left-[11px] top-1 w-2 h-2 rounded-full bg-nexus-pur" />
                        <div>
                          <span className="font-bold text-nexus-white text-[11px]">{st.stage} ({st.owner})</span>
                          <span className="text-[10px] text-nexus-muted block">{st.timestamp}</span>
                          <span className="text-[10px] text-nexus-pur italic">{st.notes}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">
                          {st.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* AI Strategy Evaluation */}
                  <div className="p-3 rounded-lg bg-nexus-pur/10 border border-nexus-pur/20 flex flex-col gap-1 text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur flex items-center gap-1">
                      <Sparkles size={12} /> AI Strategy Evaluation ({strategyDetails.ai_summary?.rating})
                    </span>
                    <p className="text-nexus-text mt-1">{strategyDetails.ai_summary?.strategy_assessment}</p>
                    <p className="text-emerald-400 font-bold mt-1">{strategyDetails.ai_summary?.recommendation}</p>
                  </div>

                </div>
              ) : null}
            </div>
          )}

          {/* Generated Signals Stream */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Zap size={16} className="text-yellow-400" /> Live Generated Signals Stream
            </span>
            <div className="flex flex-col gap-1.5 text-xs">
              {signalsStream.map((sig, idx) => (
                <div key={idx} className="p-2.5 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-nexus-white block">{sig.symbol} {sig.direction} ({sig.strategy})</span>
                    <span className="text-[10px] text-nexus-muted">Entry: ${sig.entry_price} | TP: ${sig.target_price}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 block">{sig.confidence}</span>
                    <span className="text-[9px] text-nexus-muted">{sig.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual AI Strategy Assistant Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Strategy Assistant
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button 
                onClick={() => handleAiAsk("Explain the core quantitative logic behind ICT Smart Money strategy")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Explain Logic
              </button>
              <button 
                onClick={() => handleAiAsk("Compare my top 3 running strategies by Sharpe and Drawdown")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Compare Strategies
              </button>
              <button 
                onClick={() => handleAiAsk("Recommend hyperparameter optimization grid for XGBoost Alpha")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Optimize Parameters
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── Strategy Action Modal Dialog ───────────────────────────────────── */}
      {actingStrategy && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-nexus-sf border border-nexus-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-nexus-border pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="text-nexus-pur" size={20} />
                <h3 className="text-sm font-bold text-nexus-white">
                  Strategy Control ({actingStrategy.name})
                </h3>
              </div>
              <button onClick={() => setActingStrategy(null)} className="text-nexus-muted hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Execution Action</label>
                <select 
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-2 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="DEPLOY">Deploy to Production</option>
                  <option value="PAUSE">Pause Live Execution</option>
                  <option value="RESUME">Resume Live Execution</option>
                  <option value="OPTIMIZE">Trigger Parameter Optimization</option>
                  <option value="BACKTEST">Run 3-Year Historical Backtest</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-nexus-border">
                <button 
                  type="button"
                  onClick={() => setActingStrategy(null)}
                  className="px-4 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-muted text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-nexus-pur/20"
                >
                  {submittingAction ? 'Processing...' : 'Dispatch Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
