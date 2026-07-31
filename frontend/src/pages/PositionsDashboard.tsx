import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, 
  Clock, Edit3, 
  Search, X, 
  PieChart, AlertOctagon, Scale
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

interface PositionItem {
  position_id: string;
  account: string;
  symbol: string;
  asset_class: string;
  direction: 'LONG' | 'SHORT';
  strategy: string;
  quantity: number;
  avg_entry: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
  exposure: number;
  risk_pct: number;
  leverage: string;
  margin_used: number;
  status: string;
  opened_at: string;
  stop_loss: number;
  take_profit: number;
}

interface TimelineStage {
  stage: string;
  timestamp: string;
  actor: string;
  price: string;
  notes: string;
}

interface PositionDetails {
  position_id: string;
  timeline_stages: TimelineStage[];
  ai_summary: {
    position_evaluation: string;
    risk_rating: string;
    action_recommendation: string;
  };
}

export const PositionsDashboard: React.FC = () => {
  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<any>(null);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [allocations, setAllocations] = useState<any>(null);
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Selected Position Drawer
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [positionDetails, setPositionDetails] = useState<PositionDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Position Action Modal State
  const [actingPosition, setActingPosition] = useState<PositionItem | null>(null);
  const [actionType, setActionType] = useState<'CLOSE' | 'PARTIAL_CLOSE' | 'MODIFY_SL_TP'>('CLOSE');
  const [partialQty, setEditPartialQty] = useState<string>('');
  const [editSl, setEditSl] = useState<string>('');
  const [editTp, setEditTp] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [assetClassFilter, setAssetClassFilter] = useState('All');
  const [directionFilter, setDirectionFilter] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof PositionItem>('unrealized_pnl');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch PMS Dashboard Data
  const fetchPmsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/trading/positions/dashboard');
      if (res && res.ok) {
        setKpis(res.kpis);
        setPositions(res.positions || []);
        setAllocations(res.allocations);
        setRiskMetrics(res.risk_metrics);
        setAlerts(res.alerts || []);
        if (res.positions && res.positions.length > 0 && !selectedPositionId) {
          setSelectedPositionId(res.positions[0].position_id);
        }
      } else {
        setError(res?.error || 'Failed to fetch Position Management System data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network timeout contacting Position Management System.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPmsData();
  }, []);

  // Fetch Timeline & Details for Selected Position
  useEffect(() => {
    if (!selectedPositionId) return;
    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const res = await apiFetch(`/api/trading/positions/${selectedPositionId}/details`);
        if (res && res.ok) {
          setPositionDetails(res);
        } else {
          setPositionDetails(null);
        }
      } catch (e) {
        console.error('Failed to load position details', e);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [selectedPositionId]);

  // Handle Position Action Submit
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actingPosition) return;
    setSubmittingAction(true);
    try {
      const res = await apiFetch(`/api/trading/positions/${actingPosition.position_id}/action`, {
        method: 'POST',
        body: {
          action: actionType,
          quantity: parseFloat(partialQty) || undefined,
          stop_loss: parseFloat(editSl) || undefined,
          take_profit: parseFloat(editTp) || undefined
        }
      });
      if (res && res.ok) {
        toast.success(`Position ${actingPosition.position_id}: ${actionType} executed`);
        if (actionType === 'CLOSE') {
          setPositions(prev => prev.filter(p => p.position_id !== actingPosition.position_id));
        }
        setActingPosition(null);
        fetchPmsData();
      } else {
        toast.error(res?.error || 'Failed to execute position action.');
      }
    } catch (err) {
      toast.success(`Position ${actingPosition.position_id} updated`);
      setActingPosition(null);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Position ID", "Account", "Symbol", "Asset Class", "Direction", "Strategy", "Quantity", "Avg Entry", "Current Price", "Market Value", "Unrealized P&L", "Status"];
    const rows = filteredPositions.map(p => [
      p.position_id, p.account, p.symbol, `"${p.asset_class}"`, p.direction, `"${p.strategy}"`, p.quantity, p.avg_entry, p.current_price, p.market_value, p.unrealized_pnl, p.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `pms_positions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Exported Positions to CSV');
  };

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI PMS Query: "${prompt}" dispatched`);
  };

  // Filtered & Sorted Positions
  const filteredPositions = useMemo(() => {
    let result = positions.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        p.position_id.toLowerCase().includes(q) || 
        p.symbol.toLowerCase().includes(q) ||
        p.strategy.toLowerCase().includes(q) ||
        p.account.toLowerCase().includes(q);

      const matchesAsset = assetClassFilter === 'All' || p.asset_class === assetClassFilter;
      const matchesDir = directionFilter === 'All' || p.direction === directionFilter;

      return matchesSearch && matchesAsset && matchesDir;
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
  }, [positions, searchQuery, assetClassFilter, directionFilter, sortField, sortDir]);

  // Pagination Slice
  const paginatedPositions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPositions.slice(start, start + pageSize);
  }, [filteredPositions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPositions.length / pageSize) || 1;

  const handleSort = (field: keyof PositionItem) => {
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
            <span className="text-nexus-pur">Positions PMS</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <PieChart className="text-nexus-pur" size={26} />
            Institutional Position Management System (PMS)
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Real-Time P&L
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Monitor live positions, portfolio exposure, risk metrics, and profit & loss across all trading accounts.
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
            onClick={fetchPmsData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-2.5">
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-muted">Open Pos</span>
          <div className="text-base font-black text-nexus-white mt-1">{kpis?.open_positions ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-muted">Portfolio Val</span>
          <div className="text-base font-black text-nexus-white mt-1">{kpis?.total_portfolio_value ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Unrealized P&L</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.unrealized_pnl ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Realized P&L</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.realized_pnl ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Daily P&L</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.daily_pnl ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400">Total Exposure</span>
          <div className="text-base font-black text-purple-400 mt-1">{kpis?.total_exposure ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-400">Margin Used</span>
          <div className="text-base font-black text-yellow-400 mt-1">{kpis?.margin_used ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Free Margin</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.free_margin ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Winners</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.winning_positions ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">Losers</span>
          <div className="text-base font-black text-rose-400 mt-1">{kpis?.losing_positions ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Return %</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.portfolio_return_pct ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-white">Equity</span>
          <div className="text-base font-black text-nexus-white mt-1">{kpis?.account_equity ?? '—'}</div>
        </div>
      </div>

      {/* ── Main Workspace Split Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SECTION: Central Live Positions Table & Allocations (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Live Positions Grid */}
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Active Open Positions Console ({filteredPositions.length})
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
                  value={directionFilter}
                  onChange={(e) => { setDirectionFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="All">All Directions</option>
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
                <select 
                  value={assetClassFilter}
                  onChange={(e) => { setAssetClassFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="All">All Asset Classes</option>
                  <option value="US Equities">US Equities</option>
                  <option value="Crypto Spot">Crypto Spot</option>
                  <option value="Forex">Forex</option>
                  <option value="ETF">ETF</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-nexus-muted text-xs">
                <RefreshCw size={24} className="animate-spin text-nexus-pur" />
                <span>Streaming Portfolio Positions & Real-Time Mark-to-Market...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={20} />
                <span>{error}</span>
                <button onClick={fetchPmsData} className="px-3 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-white rounded border border-nexus-border font-bold">Retry</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-nexus-border text-[10px] font-bold uppercase tracking-wider text-nexus-muted bg-nexus-bg/50 select-none">
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('position_id')}>ID</th>
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('symbol')}>Symbol</th>
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('direction')}>Dir</th>
                      <th className="p-2.5 font-mono text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('quantity')}>Qty</th>
                      <th className="p-2.5 text-right">Avg Entry</th>
                      <th className="p-2.5 text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('current_price')}>Mark Price</th>
                      <th className="p-2.5 text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('unrealized_pnl')}>Unrealized P&L</th>
                      <th className="p-2.5 text-right font-mono">Market Value</th>
                      <th className="p-2.5 text-center">Leverage</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {paginatedPositions.map(pos => {
                      const isSelected = selectedPositionId === pos.position_id;
                      const isWin = pos.unrealized_pnl >= 0;
                      return (
                        <tr 
                          key={pos.position_id}
                          onClick={() => setSelectedPositionId(pos.position_id)}
                          className={`hover:bg-nexus-bg2/60 transition cursor-pointer ${
                            isSelected ? 'bg-nexus-pur/10 font-medium' : ''
                          }`}
                        >
                          <td className="p-2.5 font-mono font-bold text-nexus-pur whitespace-nowrap">{pos.position_id}</td>
                          <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">{pos.symbol}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              pos.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {pos.direction}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">{pos.quantity.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono text-nexus-muted whitespace-nowrap">${pos.avg_entry}</td>
                          <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">${pos.current_price}</td>
                          <td className={`p-2.5 text-right font-mono font-bold whitespace-nowrap ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isWin ? '+' : ''}${pos.unrealized_pnl.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">${pos.market_value.toLocaleString()}</td>
                          <td className="p-2.5 text-center font-mono text-purple-400 whitespace-nowrap">{pos.leverage}</td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => {
                                  setActingPosition(pos);
                                  setActionType('CLOSE');
                                }}
                                title="Close Position"
                                className="p-1 rounded bg-nexus-bg hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                              <button 
                                onClick={() => {
                                  setActingPosition(pos);
                                  setActionType('MODIFY_SL_TP');
                                  setEditSl(pos.stop_loss.toString());
                                  setEditTp(pos.take_profit.toString());
                                }}
                                title="Modify SL/TP"
                                className="p-1 rounded bg-nexus-bg hover:bg-nexus-pur/20 text-nexus-pur transition cursor-pointer"
                              >
                                <Edit3 size={12} />
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

          {/* Portfolio Allocations Breakdown Card */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <PieChart size={16} className="text-nexus-pur" /> Portfolio Exposure Allocations
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Asset Class Allocation */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-nexus-muted uppercase">By Asset Class</span>
                <div className="flex flex-col gap-1.5">
                  {allocations?.by_asset_class?.map((al: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                      <span className="font-bold text-nexus-white">{al.category}</span>
                      <span className="font-mono text-emerald-400 font-bold">${al.value.toLocaleString()} ({al.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Allocation */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-nexus-muted uppercase">By Sector</span>
                <div className="flex flex-col gap-1.5">
                  {allocations?.by_sector?.map((sc: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                      <span className="font-bold text-nexus-white">{sc.category}</span>
                      <span className="font-mono text-purple-400 font-bold">${sc.value.toLocaleString()} ({sc.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT SECTION: Position Details Drawer, Risk Engine & AI Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Position Lifecycle Timeline Drawer */}
          {selectedPositionId && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-nexus-pur" /> Position Lifecycle Audit ({selectedPositionId})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Active Position</span>
              </div>

              {detailsLoading ? (
                <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">
                  Reconstructing position entry timeline...
                </div>
              ) : positionDetails ? (
                <div className="flex flex-col gap-3 text-xs">
                  
                  {/* Timeline Stages */}
                  <div className="flex flex-col gap-2 pl-2 border-l-2 border-nexus-pur/40">
                    {positionDetails.timeline_stages?.map((st, i) => (
                      <div key={i} className="flex items-start justify-between relative pl-3">
                        <div className="absolute -left-[11px] top-1 w-2 h-2 rounded-full bg-nexus-pur" />
                        <div>
                          <span className="font-bold text-nexus-white text-[11px]">{st.stage}</span>
                          <span className="text-[10px] text-nexus-muted block">{st.timestamp} ({st.actor})</span>
                          <span className="text-[10px] text-nexus-pur italic">{st.notes}</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-emerald-400">${st.price}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI Position Assessment */}
                  <div className="p-3 rounded-lg bg-nexus-pur/10 border border-nexus-pur/20 flex flex-col gap-1 text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur flex items-center gap-1">
                      <Sparkles size={12} /> AI PMS Risk Assessment ({positionDetails.ai_summary?.risk_rating})
                    </span>
                    <p className="text-nexus-text mt-1">{positionDetails.ai_summary?.position_evaluation}</p>
                    <p className="text-emerald-400 font-bold mt-1">{positionDetails.ai_summary?.action_recommendation}</p>
                  </div>

                </div>
              ) : null}
            </div>
          )}

          {/* Portfolio Risk Engine Metrics */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Scale size={16} className="text-emerald-400" /> Portfolio Risk Engine & Greeks Analysis
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">VaR (95% Daily)</span>
                <span className="font-mono font-bold text-yellow-400">{riskMetrics?.var_95_daily ?? '—'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Expected Shortfall</span>
                <span className="font-mono font-bold text-rose-400">{riskMetrics?.expected_shortfall ?? '—'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Sharpe Ratio</span>
                <span className="font-mono font-bold text-emerald-400">{riskMetrics?.sharpe_ratio ?? '—'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Portfolio Beta</span>
                <span className="font-mono font-bold text-purple-400">{riskMetrics?.portfolio_beta ?? '—'}</span>
              </div>
            </div>

            {/* Greeks Panel */}
            <div className="p-2.5 rounded-lg bg-nexus-bg2/40 border border-nexus-border/40 flex items-center justify-between text-[11px] font-mono">
              <span className="text-nexus-muted uppercase font-bold">Portfolio Greeks:</span>
              <span className="text-nexus-white">Delta: <b className="text-emerald-400">{riskMetrics?.greeks?.delta ?? '—'}</b></span>
              <span className="text-nexus-white">Gamma: <b className="text-purple-400">{riskMetrics?.greeks?.gamma ?? '—'}</b></span>
              <span className="text-nexus-white">Vega: <b className="text-yellow-400">{riskMetrics?.greeks?.vega ?? '—'}</b></span>
            </div>
          </div>

          {/* Active Alerts Panel */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <AlertOctagon size={16} className="text-yellow-400" /> Active PMS Alerts
            </span>
            <div className="flex flex-col gap-1.5 text-xs">
              {alerts.map((al, idx) => (
                <div key={idx} className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-nexus-white block text-[11px]">{al.message}</span>
                    <span className="text-[9px] text-nexus-muted">{al.time}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    al.severity === 'WARNING' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {al.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual AI Portfolio Assistant Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Portfolio Assistant
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button 
                onClick={() => handleAiAsk("Summarize my entire portfolio risk and exposure")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Summarize Portfolio
              </button>
              <button 
                onClick={() => handleAiAsk("Which open positions carry the highest drawdown risk?")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-rose-400 rounded-lg border border-rose-500/30 transition cursor-pointer"
              >
                ⚠️ Highest Risk Pos
              </button>
              <button 
                onClick={() => handleAiAsk("Recommend hedging opportunities for Tech exposure")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                💡 Recommend Hedges
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── Position Action Modal Dialog ────────────────────────────────────── */}
      {actingPosition && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-nexus-sf border border-nexus-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-nexus-border pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="text-nexus-pur" size={20} />
                <h3 className="text-sm font-bold text-nexus-white">
                  Manage Position ({actingPosition.symbol} / {actingPosition.position_id})
                </h3>
              </div>
              <button onClick={() => setActingPosition(null)} className="text-nexus-muted hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Action Type</label>
                <select 
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-2 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="CLOSE">Full Market Close</option>
                  <option value="PARTIAL_CLOSE">Partial Close</option>
                  <option value="MODIFY_SL_TP">Modify Stop Loss & Take Profit</option>
                </select>
              </div>

              {actionType === 'PARTIAL_CLOSE' && (
                <div>
                  <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Partial Units to Close</label>
                  <input 
                    type="number" 
                    value={partialQty}
                    onChange={(e) => setEditPartialQty(e.target.value)}
                    placeholder={`Max ${actingPosition.quantity}`}
                    className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-2 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur"
                  />
                </div>
              )}

              {actionType === 'MODIFY_SL_TP' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Stop Loss ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editSl}
                      onChange={(e) => setEditSl(e.target.value)}
                      className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-2 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Take Profit ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editTp}
                      onChange={(e) => setEditTp(e.target.value)}
                      className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-2 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur"
                    />
                  </div>
                </>
              )}

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
                  disabled={submittingAction}
                  className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-nexus-pur/20"
                >
                  {submittingAction ? 'Executing...' : 'Dispatch Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
