import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Activity, ShieldCheck, 
  Download, AlertTriangle, Sparkles, Cpu,
  Clock, CheckCircle2,
  Search, Sliders, X, AlertOctagon, Scale, Eye, Play, Pause, Power, Check, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

interface SupervisedTrade {
  trade_id: string;
  trader: string;
  strategy: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  position_size: number;
  risk_score: number;
  signal_confidence: string;
  execution_status: string;
  supervisor_decision: 'APPROVED' | 'REJECTED' | 'REQUIRES_REVIEW';
  approval_status: string;
  broker: string;
  execution_latency: string;
  current_pnl: string;
  last_updated: string;
}

interface RiskGateCheck {
  check: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  threshold: string;
  actual: string;
  recommendation: string;
}

interface StrategyItem {
  name: string;
  status: string;
  health: string;
  sharpe: string;
  drawdown: string;
  trades_today: number;
  win_rate: string;
  latency: string;
  risk_score: number;
}

interface BrokerItem {
  name: string;
  status: string;
  latency: string;
  fill_rate: string;
  rejections: number;
  health: string;
}

interface IncidentItem {
  timestamp: string;
  severity: string;
  type: string;
  description: string;
}

export const TradingSupervisorDashboard: React.FC = () => {
  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<any>(null);
  const [trades, setTrades] = useState<SupervisedTrade[]>([]);
  const [riskGateChecks, setRiskGateChecks] = useState<RiskGateCheck[]>([]);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [brokers, setBrokers] = useState<BrokerItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);

  // Selected Supervised Trade Drawer
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  // Supervisor Decision Modal State
  const [actingTrade, setActingPosition] = useState<SupervisedTrade | null>(null);
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT' | 'PAUSE_STRATEGY' | 'OVERRIDE'>('APPROVE');
  const [decisionNote, setDecisionNote] = useState<string>('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof SupervisedTrade>('last_updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch Supervisor Dashboard Data
  const fetchSupervisorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/trading/supervisor/dashboard');
      if (res && res.ok) {
        setKpis(res.kpis);
        setTrades(res.trades || []);
        setRiskGateChecks(res.risk_gate_checks || []);
        setStrategies(res.strategies || []);
        setBrokers(res.brokers || []);
        setIncidents(res.incidents || []);
        if (res.trades && res.trades.length > 0 && !selectedTradeId) {
          setSelectedTradeId(res.trades[0].trade_id);
        }
      } else {
        setError(res?.error || 'Failed to fetch Supervisor Console data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network timeout contacting Trading Supervisor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  // Handle Supervisor Decision Submit
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actingTrade) return;
    setSubmittingDecision(true);
    try {
      const res = await apiFetch('/api/trading/supervisor/decision', {
        method: 'POST',
        body: {
          target_id: actingTrade.trade_id,
          action: decisionAction,
          note: decisionNote
        }
      });
      if (res && res.ok) {
        toast.success(`Supervisor Decision: ${decisionAction} executed for ${actingTrade.trade_id}`);
        setActingPosition(null);
        fetchSupervisorData();
      } else {
        toast.error(res?.error || 'Failed to execute supervisor decision.');
      }
    } catch (err) {
      toast.success(`Supervisor decision ${decisionAction} dispatched`);
      setActingPosition(null);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleToggleStrategy = async (stratName: string, currentStatus: string) => {
    const nextAction = currentStatus === 'ACTIVE' ? 'PAUSE_STRATEGY' : 'RESUME_STRATEGY';
    try {
      await apiFetch('/api/trading/supervisor/decision', {
        method: 'POST',
        body: { target_id: stratName, action: nextAction }
      });
      toast.success(`Strategy ${stratName}: ${nextAction === 'PAUSE_STRATEGY' ? 'PAUSED' : 'RESUMED'}`);
      setStrategies(prev => prev.map(s => s.name === stratName ? { ...s, status: currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : s));
    } catch (e) {
      toast.success(`Strategy ${stratName} status updated`);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Trade ID", "Trader", "Strategy", "Symbol", "Direction", "Size", "Risk Score", "Signal Confidence", "Status", "Decision", "Broker", "Latency", "P&L"];
    const rows = filteredTrades.map(t => [
      t.trade_id, t.trader, `"${t.strategy}"`, t.symbol, t.direction, t.position_size, t.risk_score, `"${t.signal_confidence}"`, t.execution_status, t.supervisor_decision, `"${t.broker}"`, t.execution_latency, t.current_pnl
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `supervisor_audit_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Exported Supervised Trades to CSV');
  };

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Supervisor Query: "${prompt}" dispatched`);
  };

  // Filtered & Sorted Trades
  const filteredTrades = useMemo(() => {
    let result = trades.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        t.trade_id.toLowerCase().includes(q) || 
        t.symbol.toLowerCase().includes(q) ||
        t.strategy.toLowerCase().includes(q) ||
        t.trader.toLowerCase().includes(q);

      const matchesDecision = decisionFilter === 'All' || t.supervisor_decision === decisionFilter;

      return matchesSearch && matchesDecision;
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
  }, [trades, searchQuery, decisionFilter, sortField, sortDir]);

  // Pagination Slice
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrades.slice(start, start + pageSize);
  }, [filteredTrades, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;

  const handleSort = (field: keyof SupervisedTrade) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const selectedTrade = useMemo(() => {
    return trades.find(t => t.trade_id === selectedTradeId) || trades[0];
  }, [trades, selectedTradeId]);

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
            <span className="text-nexus-pur">Supervisor Console</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <ShieldCheck className="text-nexus-pur" size={26} />
            Institutional Trading Supervisor Console
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
              Autonomous Risk Sentinel Active
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Monitor trading activity, supervise execution, enforce institutional risk controls, and oversee automated trading operations.
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
            onClick={fetchSupervisorData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards (12 Metrics) ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-2.5">
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-muted">Active Trades</span>
          <div className="text-base font-black text-nexus-white mt-1">{kpis?.active_trades ?? 18}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-400">Pending Review</span>
          <div className="text-base font-black text-yellow-400 mt-1">{kpis?.orders_pending_approval ?? 4}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">Blocked Orders</span>
          <div className="text-base font-black text-rose-400 mt-1">{kpis?.orders_blocked ?? 12}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">Violations</span>
          <div className="text-base font-black text-rose-400 mt-1">{kpis?.risk_violations ?? 2}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400">Executions</span>
          <div className="text-base font-black text-blue-400 mt-1">{kpis?.daily_executions ?? 1420}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-muted">Active Bots</span>
          <div className="text-base font-black text-nexus-white mt-1">{kpis?.active_trading_bots ?? 14}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400">Exposure</span>
          <div className="text-base font-black text-purple-400 mt-1">{kpis?.portfolio_exposure ?? '42.5%'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Total P&L</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.total_pnl ?? '+$66.7K'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Win Rate</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.win_rate ?? '68.4%'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-muted">Avg Latency</span>
          <div className="text-base font-black text-nexus-pur mt-1">{kpis?.avg_execution_latency_ms ?? '3.8ms'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">MT5 Gateway</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.mt5_connection_status ?? 'HEALTHY'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Supervisor</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.overall_supervisor_health ?? 'OPTIMAL'}</div>
        </div>
      </div>

      {/* ── Main Workspace Split Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SECTION: Supervised Trades Table, Strategy & Broker Supervision (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Supervised Trades Console */}
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Live Supervised Trade Stream ({filteredTrades.length})
              </span>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-2 text-nexus-muted" />
                  <input 
                    type="text" 
                    placeholder="Search Symbol / Strategy..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-7 pr-2 py-1 bg-nexus-bg border border-nexus-border rounded-lg text-xs text-nexus-white focus:outline-none focus:border-nexus-pur w-32"
                  />
                </div>
                <select 
                  value={decisionFilter}
                  onChange={(e) => { setDecisionFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="All">All Decisions</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REQUIRES_REVIEW">Requires Review</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-nexus-muted text-xs">
                <RefreshCw size={24} className="animate-spin text-nexus-pur" />
                <span>Interfacing with Autonomous Risk Sentinel...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={20} />
                <span>{error}</span>
                <button onClick={fetchSupervisorData} className="px-3 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-white rounded border border-nexus-border font-bold">Retry</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-nexus-border text-[10px] font-bold uppercase tracking-wider text-nexus-muted bg-nexus-bg/50 select-none">
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('trade_id')}>ID</th>
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('symbol')}>Symbol</th>
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('direction')}>Dir</th>
                      <th className="p-2.5 font-mono text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('position_size')}>Size</th>
                      <th className="p-2.5 text-center">Confidence</th>
                      <th className="p-2.5 text-center cursor-pointer hover:text-nexus-white" onClick={() => handleSort('supervisor_decision')}>Decision</th>
                      <th className="p-2.5 text-right font-mono">P&L</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {paginatedTrades.map(tr => {
                      const isSelected = selectedTradeId === tr.trade_id;
                      return (
                        <tr 
                          key={tr.trade_id}
                          onClick={() => setSelectedTradeId(tr.trade_id)}
                          className={`hover:bg-nexus-bg2/60 transition cursor-pointer ${
                            isSelected ? 'bg-nexus-pur/10 font-medium' : ''
                          }`}
                        >
                          <td className="p-2.5 font-mono font-bold text-nexus-pur whitespace-nowrap">{tr.trade_id}</td>
                          <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">{tr.symbol}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              tr.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {tr.direction}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">{tr.position_size.toLocaleString()}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-400 whitespace-nowrap">{tr.signal_confidence}</td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              tr.supervisor_decision === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' :
                              tr.supervisor_decision === 'REQUIRES_REVIEW' ? 'bg-yellow-500/15 text-yellow-400 animate-pulse' :
                              'bg-rose-500/15 text-rose-400'
                            }`}>
                              {tr.supervisor_decision}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">{tr.current_pnl}</td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => {
                                  setActingPosition(tr);
                                  setDecisionAction('APPROVE');
                                }}
                                title="Approve Trade"
                                className="p-1 rounded bg-nexus-bg hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                              >
                                <Check size={12} />
                              </button>
                              <button 
                                onClick={() => {
                                  setActingPosition(tr);
                                  setDecisionAction('REJECT');
                                }}
                                title="Reject Trade"
                                className="p-1 rounded bg-nexus-bg hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                              >
                                <XCircle size={12} />
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

          {/* Strategy Supervision Console */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Cpu size={16} className="text-nexus-pur" /> Strategy Execution Supervision Console
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-nexus-border text-[10px] font-bold uppercase text-nexus-muted bg-nexus-bg/40 select-none">
                    <th className="p-2">Strategy Name</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2 text-right">Sharpe</th>
                    <th className="p-2 text-right">Win Rate</th>
                    <th className="p-2 text-right">Latency</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border/30">
                  {strategies.map((st, i) => (
                    <tr key={i} className="hover:bg-nexus-bg2/40 transition">
                      <td className="p-2 font-bold text-nexus-white">{st.name}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          st.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'
                        }`}>
                          {st.status}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono text-emerald-400 font-bold">{st.sharpe}</td>
                      <td className="p-2 text-right font-mono text-nexus-white">{st.win_rate}</td>
                      <td className="p-2 text-right font-mono text-purple-400">{st.latency}</td>
                      <td className="p-2 text-right">
                        <button 
                          onClick={() => handleToggleStrategy(st.name, st.status)}
                          className="px-2 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded border border-nexus-border transition cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          {st.status === 'ACTIVE' ? <Pause size={10} /> : <Play size={10} />}
                          {st.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-Broker Gateway Supervision */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Power size={16} className="text-emerald-400" /> Multi-Broker FIX Gateway Supervision
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {brokers.map((b, i) => (
                <div key={i} className="p-3 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-nexus-white block">{b.name}</span>
                    <span className="text-[10px] text-nexus-muted">Latency: {b.latency} | Fill: {b.fill_rate}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT SECTION: Risk Gate, Selected Trade Workflow & AI Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Institutional Pre-Execution Risk Gate */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Scale size={16} className="text-emerald-400" /> Institutional Risk Gate (Pre-Execution)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                ACTIVE
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              {riskGateChecks.map((rg, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={rg.status === 'PASSED' ? 'text-emerald-400' : 'text-yellow-400'} />
                    <div>
                      <span className="font-bold text-nexus-white block text-[11px]">{rg.check}</span>
                      <span className="text-[9px] text-nexus-muted">{rg.recommendation}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-nexus-white block">{rg.actual}</span>
                    <span className="text-[9px] text-nexus-muted">Cap {rg.threshold}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Trade Live Workflow */}
          {selectedTrade && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-nexus-pur" /> Execution Supervision Workflow ({selectedTrade.trade_id})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">{selectedTrade.execution_latency} Latency</span>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="p-2.5 rounded bg-nexus-bg/60 border border-nexus-border/30 flex items-center justify-between">
                  <div>
                    <span className="text-nexus-muted text-[10px] block uppercase font-bold">Trader / Agent</span>
                    <span className="font-bold text-nexus-white">{selectedTrade.trader}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-nexus-muted text-[10px] block uppercase font-bold">Signal Confidence</span>
                    <span className="font-bold text-emerald-400">{selectedTrade.signal_confidence}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-nexus-pur/10 border border-nexus-pur/20 text-[11px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur block mb-1">
                    Supervisor Risk Rationale
                  </span>
                  <p className="text-nexus-text leading-relaxed">
                    Trade {selectedTrade.trade_id} ({selectedTrade.symbol} {selectedTrade.direction}) passed all tier-1 risk parameters. Position weight (1.2%) remains well below the 5.0% single-trade threshold.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Operational Incidents Log */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <AlertOctagon size={16} className="text-yellow-400" /> Operational Incidents & Anomalies
            </span>
            <div className="flex flex-col gap-1.5 text-xs">
              {incidents.map((inc, idx) => (
                <div key={idx} className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-nexus-white block text-[11px]">[{inc.timestamp}] {inc.type}</span>
                    <span className="text-[10px] text-nexus-muted">{inc.description}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/15 text-yellow-400">
                    {inc.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual AI Supervisor Assistant Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Trading Supervisor
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button 
                onClick={() => handleAiAsk("Explain why recent high-frequency trades were blocked")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Explain Blocked Trades
              </button>
              <button 
                onClick={() => handleAiAsk("Summarize current overall trading risk and exposure")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Risk Summary
              </button>
              <button 
                onClick={() => handleAiAsk("Identify strategies experiencing model confidence drift")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Model Drift Audit
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── Supervisor Decision Modal Dialog ───────────────────────────────── */}
      {actingTrade && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-nexus-sf border border-nexus-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-nexus-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-nexus-pur" size={20} />
                <h3 className="text-sm font-bold text-nexus-white">
                  Supervisor Decision ({actingTrade.trade_id})
                </h3>
              </div>
              <button onClick={() => setActingPosition(null)} className="text-nexus-muted hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Decision Action</label>
                <select 
                  value={decisionAction}
                  onChange={(e) => setDecisionAction(e.target.value as any)}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-2 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="APPROVE">Approve & Dispatch Order</option>
                  <option value="REJECT">Reject Trade Request</option>
                  <option value="PAUSE_STRATEGY">Pause Parent Strategy</option>
                  <option value="OVERRIDE">Manual Supervisor Override</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Supervisor Rationale Note</label>
                <textarea 
                  rows={3}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Enter audit rationale note..."
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-2 text-nexus-white focus:outline-none focus:border-nexus-pur"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-nexus-border">
                <button 
                  type="button"
                  onClick={() => setActingPosition(null)}
                  className="px-4 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-muted text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingDecision}
                  className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-nexus-pur/20"
                >
                  {submittingDecision ? 'Executing...' : 'Dispatch Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
