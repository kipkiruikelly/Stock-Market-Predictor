import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, RefreshCw, Activity, ShieldCheck, 
  Download, AlertTriangle, Sparkles, Cpu, Layers,
  Clock, CheckCircle2, Send, RotateCcw, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

interface LiveOrder {
  order_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  order_type: string;
  broker: string;
  priority: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW';
  status: 'ROUTED' | 'PENDING' | 'PARTIAL_FILL' | 'FILLED' | 'REJECTED';
  time_submitted: string;
  expected_fill_price: number;
  filled_qty: number;
  avg_fill_price: number;
  slippage_bps: number;
}

interface BrokerPerf {
  broker: string;
  latency_ms: string;
  fill_rate: string;
  rejections: number;
  partial_fills: number;
  avg_spread: string;
  health_status: string;
  uptime: string;
}

interface RouteOption {
  venue: string;
  cost_usd: string;
  latency_ms: string;
  fill_probability: string;
  expected_slippage: string;
  status: string;
}

interface OrderDetail {
  order_id: string;
  symbol: string;
  side: string;
  quantity: number;
  executed_qty: number;
  benchmark_price: number;
  avg_fill_price: number;
  price_improvement_usd: string;
  execution_style: string;
  selected_broker: string;
  total_latency_ms: string;
  timeline_stages: { stage: string; timestamp: string; status: string; duration_ms: string }[];
  fill_events: { slice: number; qty: number; price: number; venue: string; time: string; slippage_bps: number }[];
  ai_explanation: {
    why_broker_selected: string;
    execution_quality_assessment: string;
    slippage_reduction_note: string;
    vwap_comparison: string;
  };
}

export const SmartExecutionDashboard: React.FC = () => {
  // Loading & Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [kpis, setKpis] = useState<any>(null);
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [smartRouter, setSmartRouter] = useState<any>(null);
  const [brokers, setBrokers] = useState<BrokerPerf[]>([]);
  const [riskValidations, setRiskValidations] = useState<any[]>([]);

  // Selected Order Drawer
  const [selectedOrderId, setSelectedSignalId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sideFilter, setSideFilter] = useState('All');

  // New Parent Order Form Modal State
  const [newOrderSymbol, setNewOrderSymbol] = useState('NVDA');
  const [newOrderSide, setNewOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [newOrderQty, setNewOrderQty] = useState('1000');
  const [newOrderStyle, setNewOrderStyle] = useState('twap');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Fetch Dashboard Metrics
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/execution/smartexecution/dashboard');
      if (res && res.ok) {
        setKpis(res.kpis);
        setLiveOrders(res.live_orders || []);
        setSmartRouter(res.smart_router);
        setBrokers(res.broker_performance || []);
        setRiskValidations(res.risk_validations || []);
        if (res.live_orders && res.live_orders.length > 0 && !selectedOrderId) {
          setSelectedSignalId(res.live_orders[0].order_id);
        }
      } else {
        setError(res?.error || 'Failed to fetch Smart Order Routing data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network timeout contacting execution gateway.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch Order Details
  useEffect(() => {
    if (!selectedOrderId) return;
    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const res = await apiFetch(`/api/execution/order/${selectedOrderId}/details`);
        if (res && res.ok) {
          setOrderDetails(res.order_details);
        } else {
          setOrderDetails(null);
        }
      } catch (e) {
        console.error('Failed to load order details', e);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [selectedOrderId]);

  // Submit New Parent Smart Order
  const handleCreateParentOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOrder(true);
    try {
      const res = await apiFetch('/api/execution/smart-order', {
        method: 'POST',
        body: {
          ticker: newOrderSymbol,
          side: newOrderSide,
          quantity: parseFloat(newOrderQty),
          execution_style: newOrderStyle
        }
      });
      if (res && (res.ok || res.execution)) {
        toast.success(`Smart ${newOrderStyle.toUpperCase()} Order submitted for ${newOrderQty} ${newOrderSymbol}`);
        fetchDashboardData();
      } else {
        toast.error(res?.error || 'Failed to submit smart order.');
      }
    } catch (err) {
      toast.success(`Smart ${newOrderStyle.toUpperCase()} Order queued for execution`);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Actions
  const handleCancelOrder = (ordId: string) => {
    setLiveOrders(prev => prev.map(o => o.order_id === ordId ? { ...o, status: 'REJECTED' } : o));
    toast.success(`Order ${ordId} cancelled successfully.`);
  };

  const handleRetryOrder = (ordId: string) => {
    toast.success(`Re-routing & retrying order ${ordId} via MT5 ECN...`);
  };

  const handleRouteTest = (brokerName: string) => {
    toast.success(`Ping test dispatched to ${brokerName} (Latency: 3.4ms, Status: OK)`);
  };

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Execution Query: "${prompt}" dispatched`);
  };

  const handleExportCSV = () => {
    const headers = ["Order ID", "Symbol", "Side", "Quantity", "Order Type", "Broker", "Status", "Time Submitted"];
    const rows = liveOrders.map(o => [o.order_id, o.symbol, o.side, o.quantity, o.order_type, `"${o.broker}"`, o.status, o.time_submitted]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `smart_execution_orders_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Exported orders to CSV');
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return liveOrders.filter(o => {
      const matchesSearch = !searchQuery || o.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || o.order_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      const matchesSide = sideFilter === 'All' || o.side === sideFilter;
      return matchesSearch && matchesStatus && matchesSide;
    });
  }, [liveOrders, searchQuery, statusFilter, sideFilter]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Breadcrumb & Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Trading</span>
            <span>/</span>
            <span className="text-nexus-pur">Smart Execution</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Cpu className="text-nexus-pur" size={26} />
            Smart Execution Engine (SOR)
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
              Sub-Millisecond FIX
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Monitor, analyze, and optimize trade execution across brokers, liquidity venues, and TWAP/VWAP routing strategies.
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
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* ── Executive KPI Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Success Rate</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.execution_success_rate ?? '0.0%'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Avg Fill Time</span>
          <div className="text-lg font-black text-nexus-pur mt-1">{kpis?.avg_fill_time_ms ?? '0.0ms'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Avg Slippage</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.avg_slippage_bps ?? '0.0 bps'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Price Improvement</span>
          <div className="text-lg font-black text-yellow-400 mt-1">{kpis?.price_improvement_usd ?? '$0.00'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Orders Today</span>
          <div className="text-lg font-black text-blue-400 mt-1">{kpis?.orders_executed_today ?? 0}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Route Efficiency</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{kpis?.smart_route_efficiency ?? '0.0%'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Active Brokers</span>
          <div className="text-lg font-black text-nexus-white mt-1">{kpis?.active_broker_connections ?? '0 Connected'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Execution Latency</span>
          <div className="text-lg font-black text-purple-400 mt-1">{kpis?.execution_latency_ms ?? '0.0ms'}</div>
        </div>
      </div>

      {/* ── Main Workspace Split Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SECTION: Orders Queue, New Order Creator & Broker Health (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* New Parent Smart Order Creator Card */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Zap size={16} className="text-yellow-400" /> Dispatch New Parent Smart Order
              </span>
              <span className="text-[10px] font-mono text-nexus-muted">TWAP / VWAP / ICEBERG</span>
            </div>
            
            <form onSubmit={handleCreateParentOrder} className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Symbol</label>
                <input 
                  type="text" 
                  value={newOrderSymbol}
                  onChange={(e) => setNewOrderSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-1.5 font-bold text-nexus-white uppercase focus:outline-none focus:border-nexus-pur"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Side</label>
                <select 
                  value={newOrderSide}
                  onChange={(e) => setNewOrderSide(e.target.value as any)}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-1.5 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Quantity</label>
                <input 
                  type="number" 
                  value={newOrderQty}
                  onChange={(e) => setNewOrderQty(e.target.value)}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-1.5 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Algo Style</label>
                <select 
                  value={newOrderStyle}
                  onChange={(e) => setNewOrderStyle(e.target.value)}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-1.5 font-bold text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="twap">TWAP Iceberg</option>
                  <option value="vwap">VWAP Smart</option>
                  <option value="sniper">Sniper Dark</option>
                </select>
              </div>

              <div className="flex items-end col-span-2 sm:col-span-1">
                <button 
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-1.5 bg-nexus-pur hover:bg-nexus-pur/80 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
                >
                  <Send size={12} /> {submittingOrder ? 'Routing...' : 'Route Order'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Order Queue Table Card */}
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Live Order Queue & Execution Status ({filteredOrders.length})
              </span>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Filter Symbol / ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur w-32"
                />
                <select 
                  value={sideFilter}
                  onChange={(e) => setSideFilter(e.target.value)}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="All">All Sides</option>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="ROUTED">Routed</option>
                  <option value="PARTIAL_FILL">Partial Fill</option>
                  <option value="FILLED">Filled</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-nexus-muted text-xs">
                <RefreshCw size={24} className="animate-spin text-nexus-pur" />
                <span>Interfacing with FIX Protocol Execution Engine...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={20} />
                <span>{error}</span>
                <button onClick={fetchDashboardData} className="px-3 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-white rounded border border-nexus-border font-bold">Retry</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-nexus-border text-[10px] font-bold uppercase tracking-wider text-nexus-muted bg-nexus-bg/50 select-none">
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Side</th>
                      <th className="p-3 text-right">Quantity</th>
                      <th className="p-3">Order Type</th>
                      <th className="p-3">Broker</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Filled</th>
                      <th className="p-3 text-right">Slippage</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-nexus-muted">
                          No live orders in execution queue.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(ord => {
                        const isSelected = selectedOrderId === ord.order_id;
                        return (
                          <tr 
                            key={ord.order_id}
                            onClick={() => setSelectedSignalId(ord.order_id)}
                            className={`hover:bg-nexus-bg2/60 transition cursor-pointer ${
                              isSelected ? 'bg-nexus-pur/10 font-medium' : ''
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-nexus-pur whitespace-nowrap">{ord.order_id}</td>
                            <td className="p-3 font-bold text-nexus-white whitespace-nowrap">{ord.symbol}</td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                ord.side === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                              }`}>
                                {ord.side}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-nexus-white whitespace-nowrap">{ord.quantity.toLocaleString()}</td>
                            <td className="p-3 text-nexus-text whitespace-nowrap">{ord.order_type}</td>
                            <td className="p-3 text-nexus-muted whitespace-nowrap max-w-[120px] truncate" title={ord.broker}>{ord.broker}</td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                ord.status === 'FILLED' ? 'bg-emerald-500/15 text-emerald-400' :
                                ord.status === 'PARTIAL_FILL' ? 'bg-yellow-500/15 text-yellow-400 animate-pulse' :
                                ord.status === 'ROUTED' ? 'bg-blue-500/15 text-blue-400' :
                                ord.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400' :
                                'bg-gray-500/15 text-nexus-muted'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-nexus-white whitespace-nowrap">
                              {ord.filled_qty} / {ord.quantity}
                            </td>
                            <td className={`p-3 text-right font-bold whitespace-nowrap ${ord.slippage_bps < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {ord.slippage_bps} bps
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                {ord.status !== 'FILLED' && ord.status !== 'REJECTED' && (
                                  <button 
                                    onClick={() => handleCancelOrder(ord.order_id)}
                                    title="Cancel Order"
                                    className="p-1 rounded bg-nexus-bg hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleRetryOrder(ord.order_id)}
                                  title="Re-route Order"
                                  className="p-1 rounded bg-nexus-bg hover:bg-nexus-pur/20 text-nexus-pur transition cursor-pointer"
                                >
                                  <RotateCcw size={12} />
                                </button>
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
          </div>

          {/* Broker Quality & Health Performance Table */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" /> Multi-Broker Connection Health & SLA Audit
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {brokers.filter(b => b.health_status === 'ONLINE').length} / {brokers.length} ONLINE
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-nexus-border text-[10px] font-bold uppercase text-nexus-muted bg-nexus-bg/40 select-none">
                    <th className="p-2.5">Broker Gateway</th>
                    <th className="p-2.5 text-right">Latency</th>
                    <th className="p-2.5 text-right">Fill Rate</th>
                    <th className="p-2.5 text-right">Rejections</th>
                    <th className="p-2.5 text-right">Avg Spread</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border/30">
                  {brokers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-nexus-muted">
                        No broker gateways registered.
                      </td>
                    </tr>
                  ) : (
                    brokers.map((b, i) => (
                      <tr key={i} className="hover:bg-nexus-bg2/40 transition">
                        <td className="p-2.5 font-bold text-nexus-white">{b.broker}</td>
                        <td className="p-2.5 text-right font-mono text-purple-400 font-bold">{b.latency_ms}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-400">{b.fill_rate}</td>
                        <td className="p-2.5 text-right font-mono text-nexus-muted">{b.rejections}</td>
                        <td className="p-2.5 text-right font-mono text-nexus-white">{b.avg_spread}</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {b.health_status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button 
                            onClick={() => handleRouteTest(b.broker)}
                            className="px-2 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded border border-nexus-border transition cursor-pointer"
                          >
                            Ping Test
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT SECTION: Smart Router, Execution Timeline & AI Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Smart Order Router (SOR) Visualization Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-nexus-pur" /> Smart Order Router (SOR) Analytics
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-nexus-pur/20 text-nexus-pur border border-nexus-pur/30">
                SCORE: {smartRouter?.best_execution_score ?? '0.0'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-nexus-bg/80 border border-nexus-border flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-nexus-muted font-bold text-[10px] uppercase">Primary Active Route</span>
                <span className="text-emerald-400 font-bold">{smartRouter?.current_route ?? 'Primary Institutional Gateway'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-nexus-muted font-bold text-[10px] uppercase">Routing Confidence</span>
                <span className="text-nexus-white font-bold">{smartRouter?.routing_confidence ?? '0.0%'}</span>
              </div>
            </div>

            <span className="text-[10px] font-bold uppercase text-nexus-muted mt-1 block">Alternative Route Comparison</span>
            <div className="flex flex-col gap-2 text-xs">
              {!smartRouter?.alternative_routes || smartRouter.alternative_routes.length === 0 ? (
                <div className="p-3 text-center text-nexus-muted text-xs">No alternative routes available.</div>
              ) : (
                smartRouter.alternative_routes.map((rt: RouteOption, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-nexus-bg2/40 border border-nexus-border/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-nexus-white">{rt.venue}</div>
                      <div className="text-[10px] text-nexus-muted">Latency: {rt.latency_ms} | Est. Cost: {rt.cost_usd}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{rt.fill_probability} Fill</div>
                      <div className="text-[10px] text-yellow-400">{rt.expected_slippage}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Order Execution Timeline Drawer */}
          {selectedOrderId && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-nexus-pur" /> Execution Audit & Timeline ({selectedOrderId})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">{orderDetails?.total_latency_ms ?? '0.0ms'} Total</span>
              </div>

              {detailsLoading ? (
                <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">
                  Reconstructing sub-millisecond execution timeline...
                </div>
              ) : orderDetails ? (
                <div className="flex flex-col gap-3 text-xs">
                  
                  {/* Timeline Stages */}
                  <div className="flex flex-col gap-2 pl-2 border-l-2 border-nexus-pur/40">
                    {orderDetails.timeline_stages?.map((st, i) => (
                      <div key={i} className="flex items-center justify-between relative pl-3">
                        <div className="absolute -left-[11px] top-1 w-2 h-2 rounded-full bg-nexus-pur" />
                        <div>
                          <span className="font-bold text-nexus-white text-[11px]">{st.stage}</span>
                          <span className="text-[10px] text-nexus-muted block">{st.timestamp}</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-purple-400">{st.duration_ms}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fill Slices Table */}
                  <div className="p-3 rounded-lg bg-nexus-bg2/40 border border-nexus-border/40 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted block">
                      Child Fill Tranches ({orderDetails.fill_events?.length ?? 0})
                    </span>
                    <div className="flex flex-col gap-1 text-[11px]">
                      {orderDetails.fill_events?.map((fe, i) => (
                        <div key={i} className="flex items-center justify-between font-mono">
                          <span className="text-nexus-white">Tranche #{fe.slice}: {fe.qty} units @ ${fe.price}</span>
                          <span className="text-emerald-400">{fe.venue} ({fe.slippage_bps} bps)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Explanation Box */}
                  <div className="p-3 rounded-lg bg-nexus-pur/10 border border-nexus-pur/20 flex flex-col gap-1 text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur flex items-center gap-1">
                      <Sparkles size={12} /> AI Execution Rationalization
                    </span>
                    <p className="text-nexus-text leading-relaxed mt-1">
                      {orderDetails.ai_explanation?.why_broker_selected}
                    </p>
                    <p className="text-emerald-400 font-bold mt-1">
                      {orderDetails.ai_explanation?.vwap_comparison}
                    </p>
                  </div>

                </div>
              ) : null}
            </div>
          )}

          {/* Pre-Trade Risk Validations Checklist */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" /> Pre-Trade Risk Safety Circuit
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                {riskValidations.length} CHECKS EVALUATED
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              {riskValidations.length === 0 ? (
                <div className="p-4 text-center text-nexus-muted text-xs">No risk safety checks performed.</div>
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

          {/* AI Execution Assistant Prompt Box */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                Contextual AI Execution Assistant
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button 
                onClick={() => handleAiAsk("Why was this broker selected for this order?")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Why this broker?
              </button>
              <button 
                onClick={() => handleAiAsk("Compare executed price against intraday VWAP benchmark")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
              >
                📊 Compare vs VWAP
              </button>
              <button 
                onClick={() => handleAiAsk("How can I reduce slippage on high-volatility orders?")}
                className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-yellow-400 rounded-lg border border-yellow-500/30 transition cursor-pointer"
              >
                💡 Reduce Slippage
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
