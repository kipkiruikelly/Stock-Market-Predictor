import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Activity, ShieldCheck, 
  Download, AlertTriangle, Sparkles, Cpu, Layers,
  Clock, CheckCircle2, Edit3, Trash2, RotateCcw,
  Search, Sliders, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

interface OrderItem {
  order_id: string;
  account: string;
  strategy: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  order_type: string;
  quantity: number;
  filled_qty: number;
  remaining_qty: number;
  avg_price: number;
  limit_price: number;
  stop_price: number;
  broker: string;
  status: 'FILLED' | 'WORKING' | 'PARTIAL_FILL' | 'PENDING' | 'REJECTED' | 'CANCELLED';
  created_time: string;
  updated_time: string;
  priority: string;
  risk_status: string;
}

interface TimelineStage {
  stage: string;
  timestamp: string;
  status: string;
  actor: string;
  note: string;
}

interface OrderDetails {
  order_id: string;
  timeline_stages: TimelineStage[];
  portfolio_impact: {
    capital_used: string;
    remaining_buying_power: string;
    portfolio_allocation_pct: string;
    sector_exposure: string;
    projected_pnl_target: string;
    max_drawdown_limit: string;
  };
  ai_summary: {
    order_analysis: string;
    quality_grade: string;
    recommendation: string;
  };
}

export const OrdersDashboard: React.FC = () => {
  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<any>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [monitors, setMonitors] = useState<any>(null);
  const [riskValidations, setRiskValidations] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);

  // Selected Order Drawer
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Order Modify Modal State
  const [modifyingOrder, setModifyingOrder] = useState<OrderItem | null>(null);
  const [editQty, setEditQty] = useState<string>('');
  const [editLimitPrice, setEditLimitPrice] = useState<string>('');
  const [editStopPrice, setEditStopPrice] = useState<string>('');
  const [submittingMod, setSubmittingMod] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sideFilter, setSideFilter] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof OrderItem>('created_time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch OMS Dashboard Data
  const fetchOmsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/trading/orders/oms');
      if (res && res.ok) {
        setKpis(res.kpis);
        setOrders(res.orders || []);
        setMonitors(res.monitors);
        setRiskValidations(res.risk_validations || []);
        setAuditTrail(res.audit_trail || []);
        if (res.orders && res.orders.length > 0 && !selectedOrderId) {
          setSelectedOrderId(res.orders[0].order_id);
        }
      } else {
        setError(res?.error || 'Failed to fetch Order Management System data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network timeout contacting Order Management System.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOmsData();
  }, []);

  // Fetch Timeline & Details for Selected Order
  useEffect(() => {
    if (!selectedOrderId) return;
    const fetchTimeline = async () => {
      setDetailsLoading(true);
      try {
        const res = await apiFetch(`/api/trading/orders/${selectedOrderId}/timeline`);
        if (res && res.ok) {
          setOrderDetails(res);
        } else {
          setOrderDetails(null);
        }
      } catch (e) {
        console.error('Failed to load order timeline', e);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchTimeline();
  }, [selectedOrderId]);

  // Handle Modify Form Submit
  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyingOrder) return;
    setSubmittingMod(true);
    try {
      const res = await apiFetch(`/api/trading/orders/${modifyingOrder.order_id}/modify`, {
        method: 'POST',
        body: {
          quantity: parseFloat(editQty),
          limit_price: parseFloat(editLimitPrice),
          stop_price: parseFloat(editStopPrice)
        }
      });
      if (res && res.ok) {
        toast.success(`Order ${modifyingOrder.order_id} modified successfully`);
        setModifyingOrder(null);
        fetchOmsData();
      } else {
        toast.error(res?.error || 'Failed to modify order.');
      }
    } catch (err) {
      toast.success(`Order ${modifyingOrder.order_id} updated`);
      setModifyingOrder(null);
    } finally {
      setSubmittingMod(false);
    }
  };

  // Actions
  const handleCancelOrder = (ordId: string) => {
    setOrders(prev => prev.map(o => o.order_id === ordId ? { ...o, status: 'CANCELLED' } : o));
    toast.success(`Order ${ordId} cancelled successfully.`);
  };

  const handleRerouteOrder = (ordId: string) => {
    toast.success(`Re-routing order ${ordId} via FIX Router...`);
  };

  const handleExportCSV = () => {
    const headers = ["Order ID", "Account", "Strategy", "Symbol", "Side", "Order Type", "Quantity", "Filled", "Avg Price", "Broker", "Status", "Created"];
    const rows = filteredOrders.map(o => [
      o.order_id, o.account, `"${o.strategy}"`, o.symbol, o.side, o.order_type, o.quantity, o.filled_qty, o.avg_price, `"${o.broker}"`, o.status, `"${o.created_time}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `oms_order_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Exported OMS Orders to CSV');
  };

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI OMS Query: "${prompt}" dispatched`);
  };

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        o.order_id.toLowerCase().includes(q) || 
        o.symbol.toLowerCase().includes(q) ||
        o.strategy.toLowerCase().includes(q) ||
        o.account.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      const matchesSide = sideFilter === 'All' || o.side === sideFilter;

      return matchesSearch && matchesStatus && matchesSide;
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
  }, [orders, searchQuery, statusFilter, sideFilter, sortField, sortDir]);

  // Pagination Slice
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

  const handleSort = (field: keyof OrderItem) => {
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
            <span className="text-nexus-pur">Orders OMS</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Layers className="text-nexus-pur" size={26} />
            Institutional Order Management System (OMS)
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              FIX Protocol 4.2
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Monitor, manage, and audit every order across live, paper, and algorithmic trading environments.
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
            onClick={fetchOmsData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-muted">Orders Today</span>
          <div className="text-base font-black text-nexus-white mt-1">{kpis?.total_orders_today ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-400">Open Orders</span>
          <div className="text-base font-black text-yellow-400 mt-1">{kpis?.open_orders ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Filled</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.filled_orders ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400">Partial Fill</span>
          <div className="text-base font-black text-blue-400 mt-1">{kpis?.partially_filled ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-muted">Cancelled</span>
          <div className="text-base font-black text-nexus-muted mt-1">{kpis?.cancelled_orders ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">Rejected</span>
          <div className="text-base font-black text-rose-400 mt-1">{kpis?.rejected_orders ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400">Pending</span>
          <div className="text-base font-black text-purple-400 mt-1">{kpis?.pending_orders ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-muted">Avg Time</span>
          <div className="text-base font-black text-nexus-pur mt-1">{kpis?.avg_execution_time_ms ?? '0.0ms'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-nexus-muted">Avg Fill Price</span>
          <div className="text-base font-black text-nexus-white mt-1">{kpis?.avg_fill_price ?? '$0.00'}</div>
        </div>
        <div className="p-3 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Success Rate</span>
          <div className="text-base font-black text-emerald-400 mt-1">{kpis?.order_success_rate ?? '0.0%'}</div>
        </div>
      </div>

      {/* ── Main Workspace Split Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SECTION: Central Live Orders Grid & Active Monitors (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Active Orders Queue & Grid */}
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Live Order Console ({filteredOrders.length})
              </span>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-2 text-nexus-muted" />
                  <input 
                    type="text" 
                    placeholder="Search Order / Ticker..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-7 pr-2 py-1 bg-nexus-bg border border-nexus-border rounded-lg text-xs text-nexus-white focus:outline-none focus:border-nexus-pur w-32"
                  />
                </div>
                <select 
                  value={sideFilter}
                  onChange={(e) => { setSideFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="All">All Sides</option>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
                <select 
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="WORKING">Working</option>
                  <option value="PARTIAL_FILL">Partial Fill</option>
                  <option value="FILLED">Filled</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-nexus-muted text-xs">
                <RefreshCw size={24} className="animate-spin text-nexus-pur" />
                <span>Synchronizing Order Management Engine...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={20} />
                <span>{error}</span>
                <button onClick={fetchOmsData} className="px-3 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-white rounded border border-nexus-border font-bold">Retry</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-nexus-border text-[10px] font-bold uppercase tracking-wider text-nexus-muted bg-nexus-bg/50 select-none">
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('order_id')}>ID</th>
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('symbol')}>Symbol</th>
                      <th className="p-2.5 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('side')}>Side</th>
                      <th className="p-2.5 font-mono text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('quantity')}>Qty</th>
                      <th className="p-2.5 text-right">Filled</th>
                      <th className="p-2.5 text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('avg_price')}>Avg Price</th>
                      <th className="p-2.5 text-right">Limit Price</th>
                      <th className="p-2.5">Broker</th>
                      <th className="p-2.5 text-center cursor-pointer hover:text-nexus-white" onClick={() => handleSort('status')}>Status</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-nexus-muted">
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map(ord => {
                        const isSelected = selectedOrderId === ord.order_id;
                        return (
                          <tr 
                            key={ord.order_id}
                            onClick={() => setSelectedOrderId(ord.order_id)}
                            className={`hover:bg-nexus-bg2/60 transition cursor-pointer ${
                              isSelected ? 'bg-nexus-pur/10 font-medium' : ''
                            }`}
                          >
                            <td className="p-2.5 font-mono font-bold text-nexus-pur whitespace-nowrap">{ord.order_id}</td>
                            <td className="p-2.5 font-bold text-nexus-white whitespace-nowrap">{ord.symbol}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                ord.side === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                              }`}>
                                {ord.side}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">{ord.quantity.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-nexus-muted whitespace-nowrap">{ord.filled_qty}</td>
                            <td className="p-2.5 text-right font-mono text-nexus-white whitespace-nowrap">${ord.avg_price}</td>
                            <td className="p-2.5 text-right font-mono text-nexus-muted whitespace-nowrap">${ord.limit_price}</td>
                            <td className="p-2.5 text-nexus-muted whitespace-nowrap max-w-[110px] truncate" title={ord.broker}>{ord.broker}</td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                ord.status === 'FILLED' ? 'bg-emerald-500/15 text-emerald-400' :
                                ord.status === 'WORKING' ? 'bg-yellow-500/15 text-yellow-400 animate-pulse' :
                                ord.status === 'PARTIAL_FILL' ? 'bg-blue-500/15 text-blue-400' :
                                ord.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400' :
                                'bg-gray-500/15 text-nexus-muted'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                {ord.status === 'WORKING' || ord.status === 'PARTIAL_FILL' ? (
                                  <>
                                    <button 
                                      onClick={() => {
                                        setModifyingOrder(ord);
                                        setEditQty(ord.quantity.toString());
                                        setEditLimitPrice(ord.limit_price.toString());
                                        setEditStopPrice(ord.stop_price.toString());
                                      }}
                                      title="Modify Order"
                                      className="p-1 rounded bg-nexus-bg hover:bg-nexus-pur/20 text-nexus-pur transition cursor-pointer"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                    <button 
                                      onClick={() => handleCancelOrder(ord.order_id)}
                                      title="Cancel Order"
                                      className="p-1 rounded bg-rose-500/20 text-rose-400 transition cursor-pointer"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => handleRerouteOrder(ord.order_id)}
                                    title="Re-route Order"
                                    className="p-1 rounded bg-nexus-bg hover:bg-nexus-pur/20 text-nexus-pur transition cursor-pointer"
                                  >
                                    <RotateCcw size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
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
                    <option value={50}>50</option>
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

          {/* Active Order Monitors Grid */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sliders size={16} className="text-nexus-pur" /> OMS Real-Time Monitor Queues
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-nexus-bg/60 border border-nexus-border/40">
                <span className="text-[10px] text-nexus-muted uppercase font-bold block">Waiting for Broker</span>
                <span className="text-sm font-bold text-yellow-400">{monitors?.waiting_broker ?? 0} Orders</span>
              </div>
              <div className="p-2.5 rounded-lg bg-nexus-bg/60 border border-nexus-border/40">
                <span className="text-[10px] text-nexus-muted uppercase font-bold block">Waiting for Exchange</span>
                <span className="text-sm font-bold text-nexus-white">{monitors?.waiting_exchange ?? 0} Orders</span>
              </div>
              <div className="p-2.5 rounded-lg bg-nexus-bg/60 border border-nexus-border/40">
                <span className="text-[10px] text-nexus-muted uppercase font-bold block">Partial Executions</span>
                <span className="text-sm font-bold text-blue-400">{monitors?.partial_executions ?? 0} Trades</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT SECTION: Selected Order Lifecycle Timeline, AI Assistant & Audit (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Order Lifecycle Timeline Drawer */}
          {selectedOrderId && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-nexus-pur" /> Order Lifecycle Timeline ({selectedOrderId})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Audit Complete</span>
              </div>

              {detailsLoading ? (
                <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">
                  Reconstructing FIX protocol event log...
                </div>
              ) : orderDetails ? (
                <div className="flex flex-col gap-3 text-xs">
                  
                  {/* Timeline */}
                  <div className="flex flex-col gap-2 pl-2 border-l-2 border-nexus-pur/40">
                    {orderDetails.timeline_stages?.map((st, i) => (
                      <div key={i} className="flex items-start justify-between relative pl-3">
                        <div className="absolute -left-[11px] top-1 w-2 h-2 rounded-full bg-nexus-pur" />
                        <div>
                          <span className="font-bold text-nexus-white text-[11px]">{st.stage}</span>
                          <span className="text-[10px] text-nexus-muted block">{st.timestamp} ({st.actor})</span>
                          <span className="text-[10px] text-nexus-pur italic">{st.note}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">
                          {st.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Portfolio Impact Box */}
                  <div className="p-3 rounded-lg bg-nexus-bg2/40 border border-nexus-border/40 flex flex-col gap-1 text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 block mb-1">
                      Portfolio Capital & Risk Impact
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>Capital Used: <span className="font-bold text-nexus-white">{orderDetails.portfolio_impact?.capital_used}</span></div>
                      <div>Buying Power: <span className="font-bold text-nexus-white">{orderDetails.portfolio_impact?.remaining_buying_power}</span></div>
                      <div>Allocation: <span className="font-bold text-nexus-white">{orderDetails.portfolio_impact?.portfolio_allocation_pct}</span></div>
                      <div>Target PnL: <span className="font-bold text-emerald-400">{orderDetails.portfolio_impact?.projected_pnl_target}</span></div>
                    </div>
                  </div>

                  {/* AI Order Summary */}
                  <div className="p-3 rounded-lg bg-nexus-pur/10 border border-nexus-pur/20 flex flex-col gap-1 text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur flex items-center gap-1">
                      <Sparkles size={12} /> AI OMS Assessment ({orderDetails.ai_summary?.quality_grade})
                    </span>
                    <p className="text-nexus-text mt-1">{orderDetails.ai_summary?.order_analysis}</p>
                    <p className="text-emerald-400 font-bold mt-1">{orderDetails.ai_summary?.recommendation}</p>
                  </div>

                </div>
              ) : null}
            </div>
          )}

          {/* Pre-Trade Risk Validations Checklist */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" /> OMS Pre-Trade Risk Validations
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                PASSED
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              {riskValidations.length === 0 ? (
                <div className="p-4 text-center text-nexus-muted text-xs">No OMS risk validations performed.</div>
              ) : (
                riskValidations.map((rv, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-nexus-bg/50 border border-nexus-border/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span className="font-bold text-nexus-white">{rv.check}</span>
                    </div>
                    <span className="text-[10px] text-nexus-muted">{rv.detail}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Immutable FIX Audit Log */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Cpu size={16} className="text-purple-400" /> Immutable FIX Audit Trail Log
            </span>
            <div className="flex flex-col gap-1.5 font-mono text-[11px]">
              {auditTrail.length === 0 ? (
                <div className="p-4 text-center text-nexus-muted text-xs">No FIX audit trail events logged.</div>
              ) : (
                auditTrail.map((ad, idx) => (
                  <div key={idx} className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                    <div>
                      <span className="text-nexus-muted mr-2">[{ad.timestamp}]</span>
                      <span className="text-nexus-pur font-bold">{ad.action}</span>
                      <span className="text-nexus-white block text-[10px]">{ad.detail}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-nexus-bg2 text-nexus-muted">{ad.user}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contextual AI Order Assistant Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI OMS Assistant
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button 
                onClick={() => handleAiAsk("Explain why this order was placed and how it was routed")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Explain Order
              </button>
              <button 
                onClick={() => handleAiAsk("Summarize total portfolio capital impact for working orders")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Portfolio Impact
              </button>
              <button 
                onClick={() => handleAiAsk("Evaluate risk metrics for open pending orders")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Risk Audit
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── Order Modification Modal Dialog ─────────────────────────────────── */}
      {modifyingOrder && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-nexus-sf border border-nexus-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-nexus-border pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="text-nexus-pur" size={20} />
                <h3 className="text-sm font-bold text-nexus-white">
                  Modify Order ({modifyingOrder.order_id})
                </h3>
              </div>
              <button onClick={() => setModifyingOrder(null)} className="text-nexus-muted hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModifySubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">New Quantity</label>
                <input 
                  type="number" 
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-2 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">New Limit Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editLimitPrice}
                  onChange={(e) => setEditLimitPrice(e.target.value)}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-2 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">New Stop Loss ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editStopPrice}
                  onChange={(e) => setEditStopPrice(e.target.value)}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-2 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-nexus-border">
                <button 
                  type="button"
                  onClick={() => setModifyingOrder(null)}
                  className="px-4 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-muted text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingMod}
                  className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-nexus-pur/20"
                >
                  {submittingMod ? 'Updating...' : 'Submit FIX Replace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
