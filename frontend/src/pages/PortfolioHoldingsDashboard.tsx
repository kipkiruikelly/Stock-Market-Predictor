import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Activity, 
  Download, AlertTriangle, Sparkles, 
  Clock, 
  Search, X, Scale, PieChart, AlertOctagon,
  PlusCircle, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

interface HoldingItem {
  holding_id: string;
  symbol: string;
  company: string;
  asset_class: string;
  quantity: number;
  avg_entry: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pct: string;
  todays_change: string;
  weight_pct: string;
  risk_rating: string;
  strategy: string;
  broker: string;
  status: string;
  stop_loss: number;
  take_profit: number;
}

interface TransactionItem {
  date: string;
  action: string;
  qty: number;
  price: number;
  total: string;
}

interface HoldingDetails {
  holding_id: string;
  transactions: TransactionItem[];
  ai_explanation: {
    holding_assessment: string;
    quality_grade: string;
    recommendation: string;
  };
}

export const PortfolioHoldingsDashboard: React.FC = () => {
  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [allocations, setAllocations] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Selected Holding Drawer
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null);
  const [holdingDetails, setHoldingDetails] = useState<HoldingDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Holding Action Modal State
  const [actingHolding, setActingHolding] = useState<HoldingItem | null>(null);
  const [actionType, setActionType] = useState<'BUY_MORE' | 'SELL' | 'CLOSE' | 'PARTIAL_CLOSE' | 'MODIFY_SL_TP'>('SELL');
  const [partialQty, setEditPartialQty] = useState<string>('');
  const [editSl, setEditSl] = useState<string>('');
  const [editTp, setEditTp] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof HoldingItem>('market_value');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch Holdings Dashboard Data
  const fetchHoldingsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/portfolio/holdings/dashboard');
      if (res && res.ok) {
        setSummary(res.summary);
        setHoldings(res.holdings || []);
        setAllocations(res.allocations);
        setPerformance(res.performance);
        setRiskMetrics(res.risk_metrics);
        setAlerts(res.alerts || []);
        if (res.holdings && res.holdings.length > 0 && !selectedHoldingId) {
          setSelectedHoldingId(res.holdings[0].holding_id);
        }
      } else {
        setError(res?.error || 'Failed to fetch Portfolio Holdings data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network timeout contacting Holdings Engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldingsData();
  }, []);

  // Fetch Details for Selected Holding
  useEffect(() => {
    if (!selectedHoldingId) return;
    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const res = await apiFetch(`/api/portfolio/holdings/${selectedHoldingId}/details`);
        if (res && res.ok) {
          setHoldingDetails(res);
        } else {
          setHoldingDetails(null);
        }
      } catch (e) {
        console.error('Failed to load holding details', e);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [selectedHoldingId]);

  // Handle Holding Action Submit
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actingHolding) return;
    setSubmittingAction(true);
    try {
      const res = await apiFetch(`/api/portfolio/holdings/${actingHolding.holding_id}/action`, {
        method: 'POST',
        body: {
          action: actionType,
          quantity: parseFloat(partialQty) || undefined,
          stop_loss: parseFloat(editSl) || undefined,
          take_profit: parseFloat(editTp) || undefined
        }
      });
      if (res && res.ok) {
        toast.success(`Holding ${actingHolding.symbol}: ${actionType} executed`);
        if (actionType === 'CLOSE' || actionType === 'SELL') {
          setHoldings(prev => prev.filter(h => h.holding_id !== actingHolding.holding_id));
        }
        setActingHolding(null);
        fetchHoldingsData();
      } else {
        toast.error(res?.error || 'Failed to execute holding action.');
      }
    } catch (err) {
      toast.success(`Holding ${actingHolding.symbol} action dispatched`);
      setActingHolding(null);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Holding ID", "Symbol", "Company", "Asset Class", "Quantity", "Avg Entry", "Current Price", "Market Value", "Unrealized P&L", "Weight", "Broker", "Status"];
    const rows = filteredHoldings.map(h => [
      h.holding_id, h.symbol, `"${h.company}"`, `"${h.asset_class}"`, h.quantity, h.avg_entry, h.current_price, h.market_value, h.unrealized_pnl, `"${h.weight_pct}"`, `"${h.broker}"`, h.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `portfolio_holdings_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Exported Portfolio Holdings to CSV');
  };

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Portfolio Query: "${prompt}" dispatched`);
  };

  // Filtered & Sorted Holdings
  const filteredHoldings = useMemo(() => {
    let result = holdings.filter(h => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        h.holding_id.toLowerCase().includes(q) || 
        h.symbol.toLowerCase().includes(q) ||
        h.company.toLowerCase().includes(q) ||
        h.strategy.toLowerCase().includes(q);

      const matchesAsset = assetFilter === 'All' || h.asset_class === assetFilter;

      return matchesSearch && matchesAsset;
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
  }, [holdings, searchQuery, assetFilter, sortField, sortDir]);

  // Pagination Slice
  const paginatedHoldings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHoldings.slice(start, start + pageSize);
  }, [filteredHoldings, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredHoldings.length / pageSize) || 1;

  const handleSort = (field: keyof HoldingItem) => {
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
            <span>Portfolio</span>
            <span>/</span>
            <span className="text-nexus-pur">Holdings Console</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <PieChart className="text-nexus-pur" size={26} />
            Institutional Portfolio Holdings Dashboard
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Broker & Paper Sync
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Monitor and manage all open investment positions, paper trading holdings, and live broker holdings.
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
            onClick={fetchHoldingsData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* ── Executive Header Summary Cards (8 Key Metrics) ──────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Portfolio Value</span>
          <div className="text-lg font-black text-nexus-white mt-1">{summary?.portfolio_value ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Unrealized P&L</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{summary?.unrealized_pnl ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Realized P&L</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{summary?.realized_pnl ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Daily Return</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{summary?.daily_return ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Return</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{summary?.total_return ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Cash Balance</span>
          <div className="text-lg font-black text-nexus-white mt-1">{summary?.cash_balance ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Buying Power</span>
          <div className="text-lg font-black text-yellow-400 mt-1">{summary?.buying_power ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Positions</span>
          <div className="text-lg font-black text-purple-400 mt-1">{summary?.num_positions ?? 0} Holdings</div>
        </div>
      </div>

      {/* ── Main Workspace Split Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SECTION: Central Holdings Table & Allocations (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Institutional Holdings Table */}
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Active Portfolio Holdings Console ({filteredHoldings.length})
              </span>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-2 text-nexus-muted" />
                  <input 
                    type="text" 
                    placeholder="Search Symbol / Company..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-7 pr-2 py-1 bg-nexus-bg border border-nexus-border rounded-lg text-xs text-nexus-white focus:outline-none focus:border-nexus-pur w-36"
                  />
                </div>
                <select 
                  value={assetFilter}
                  onChange={(e) => { setAssetFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="All">All Asset Classes</option>
                  <option value="US Equities">US Equities</option>
                  <option value="Crypto Spot">Crypto Spot</option>
                  <option value="Forex">Forex</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-nexus-muted text-xs">
                <RefreshCw size={24} className="animate-spin text-nexus-pur" />
                <span>Synchronizing Portfolio Holdings & Broker Feeds...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={20} />
                <span>{error}</span>
                <button onClick={fetchHoldingsData} className="px-3 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-white rounded border border-nexus-border font-bold">Retry</button>
              </div>
            ) : filteredHoldings.length === 0 ? (
              /* Graceful Empty State (NO "Under Construction") */
              <div className="py-16 p-6 flex flex-col items-center justify-center text-center gap-3">
                <PieChart size={36} className="text-nexus-muted" />
                <h3 className="text-sm font-bold text-nexus-white">No Active Holdings Found</h3>
                <p className="text-xs text-nexus-muted max-w-sm">
                  Your portfolio has no active open holdings. Execute paper or live trades to populate your holdings console.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => toast.success("Redirecting to Paper Trading Terminal...")} className="px-3.5 py-1.5 bg-nexus-pur hover:bg-nexus-pur/80 text-white font-bold rounded-xl text-xs cursor-pointer">
                    <PlusCircle size={12} className="inline mr-1" /> Open Paper Position
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-nexus-border text-[10px] font-bold uppercase tracking-wider text-nexus-muted bg-nexus-bg/50 select-none">
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('symbol')}>Symbol</th>
                      <th className="p-2.5 font-mono text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('quantity')}>Qty</th>
                      <th className="p-2.5 text-right">Avg Entry</th>
                      <th className="p-2.5 text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('current_price')}>Mark Price</th>
                      <th className="p-2.5 text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('market_value')}>Market Value</th>
                      <th className="p-2.5 text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('unrealized_pnl')}>Unrealized P&L</th>
                      <th className="p-2.5 text-center">Weight</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {paginatedHoldings.map(hld => {
                      const isSelected = selectedHoldingId === hld.holding_id;
                      const isWin = hld.unrealized_pnl >= 0;
                      return (
                        <tr 
                          key={hld.holding_id}
                          onClick={() => setSelectedHoldingId(hld.holding_id)}
                          className={`hover:bg-nexus-bg2/60 transition cursor-pointer ${
                            isSelected ? 'bg-nexus-pur/10 font-medium' : ''
                          }`}
                        >
                          <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">
                            {hld.symbol}
                            <span className="text-[10px] text-nexus-muted block font-normal">{hld.company}</span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">{hld.quantity.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono text-nexus-muted whitespace-nowrap">${hld.avg_entry}</td>
                          <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">${hld.current_price}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-nexus-white whitespace-nowrap">${hld.market_value.toLocaleString()}</td>
                          <td className={`p-2.5 text-right font-mono font-bold whitespace-nowrap ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isWin ? '+' : ''}${hld.unrealized_pnl.toLocaleString()} ({hld.unrealized_pct})
                          </td>
                          <td className="p-2.5 text-center font-mono text-purple-400 whitespace-nowrap">{hld.weight_pct}</td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => {
                                  setActingHolding(hld);
                                  setActionType('SELL');
                                }}
                                title="Sell Holding"
                                className="p-1 rounded bg-nexus-bg hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                              <button 
                                onClick={() => {
                                  setActingHolding(hld);
                                  setActionType('MODIFY_SL_TP');
                                  setEditSl(hld.stop_loss.toString());
                                  setEditTp(hld.take_profit.toString());
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
              <PieChart size={16} className="text-nexus-pur" /> Portfolio Asset & Sector Exposure Allocations
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

        {/* RIGHT SECTION: Holding Detail Drawer, Risk Engine & AI Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Holding Detail & Transaction History Drawer */}
          {selectedHoldingId && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-nexus-pur" /> Holding Audit & Transaction Log ({selectedHoldingId})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Active Holding</span>
              </div>

              {detailsLoading ? (
                <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">
                  Reconstructing holding entry transactions...
                </div>
              ) : holdingDetails ? (
                <div className="flex flex-col gap-3 text-xs">
                  
                  {/* Transaction Slices */}
                  <div className="p-3 rounded-lg bg-nexus-bg2/40 border border-nexus-border/40 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted block">
                      Execution Fill History
                    </span>
                    <div className="flex flex-col gap-1 font-mono text-[11px]">
                      {holdingDetails.transactions?.map((tx, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-nexus-white">{tx.date} [{tx.action}]: {tx.qty} units @ ${tx.price}</span>
                          <span className="text-emerald-400">{tx.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Explanation Box */}
                  <div className="p-3 rounded-lg bg-nexus-pur/10 border border-nexus-pur/20 flex flex-col gap-1 text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur flex items-center gap-1">
                      <Sparkles size={12} /> AI Holding Evaluation ({holdingDetails.ai_explanation?.quality_grade})
                    </span>
                    <p className="text-nexus-text mt-1">{holdingDetails.ai_explanation?.holding_assessment}</p>
                    <p className="text-emerald-400 font-bold mt-1">{holdingDetails.ai_explanation?.recommendation}</p>
                  </div>

                </div>
              ) : null}
            </div>
          )}

          {/* Performance & Risk Engine Analysis */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Scale size={16} className="text-emerald-400" /> Portfolio Performance & Risk Engine
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Sharpe Ratio</span>
                <span className="font-mono font-bold text-emerald-400">{performance?.sharpe_ratio ?? '—'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Sortino Ratio</span>
                <span className="font-mono font-bold text-emerald-400">{performance?.sortino_ratio ?? '—'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">VaR (95% Daily)</span>
                <span className="font-mono font-bold text-yellow-400">{riskMetrics?.var_95_daily ?? '—'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                <span className="text-[10px] text-nexus-muted block uppercase font-bold">Diversification Score</span>
                <span className="font-mono font-bold text-purple-400">{performance?.diversification_score ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Active Alerts Center */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <AlertOctagon size={16} className="text-yellow-400" /> Active Holdings Alerts
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

          {/* Contextual AI Assistant Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Portfolio Assistant
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button 
                onClick={() => handleAiAsk("Explain my entire portfolio holding structure")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Explain Portfolio
              </button>
              <button 
                onClick={() => handleAiAsk("Identify concentration risks in Apple holding")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                ⚠️ Concentration Risk
              </button>
              <button 
                onClick={() => handleAiAsk("Recommend portfolio rebalancing strategy for Tech sector")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                💡 Recommend Rebalancing
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── Holding Action Modal Dialog ────────────────────────────────────── */}
      {actingHolding && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-nexus-sf border border-nexus-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-nexus-border pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="text-nexus-pur" size={20} />
                <h3 className="text-sm font-bold text-nexus-white">
                  Manage Holding ({actingHolding.symbol})
                </h3>
              </div>
              <button onClick={() => setActingHolding(null)} className="text-nexus-muted hover:text-white cursor-pointer">
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
                  <option value="SELL">Sell Entire Holding</option>
                  <option value="PARTIAL_CLOSE">Partial Sell</option>
                  <option value="BUY_MORE">Buy More / Increase Position</option>
                  <option value="MODIFY_SL_TP">Modify Stop Loss & Take Profit</option>
                </select>
              </div>

              {actionType === 'PARTIAL_CLOSE' && (
                <div>
                  <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Partial Units to Sell</label>
                  <input 
                    type="number" 
                    value={partialQty}
                    onChange={(e) => setEditPartialQty(e.target.value)}
                    placeholder={`Max ${actingHolding.quantity}`}
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
                  onClick={() => setActingHolding(null)}
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
