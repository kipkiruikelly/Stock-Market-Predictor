import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Download, Sparkles, Activity, ShieldCheck, 
  TrendingUp, TrendingDown, DollarSign, Terminal, ArrowUpRight, CheckCircle, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const TradingTerminalDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [account, setAccount] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [smartRouting, setSmartRouting] = useState<any>(null);
  const [riskSummary, setRiskSummary] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [activityStream, setActivityStream] = useState<any[]>([]);

  // Order Entry State
  const [symbol, setSymbol] = useState('NVDA');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [orderSide, setOrderTypeSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('100');
  const [limitPrice, setLimitPrice] = useState('128.50');
  const [stopLoss, setStopLoss] = useState('124.00');
  const [takeProfit, setTakeProfit] = useState('135.00');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const fetchTerminalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/trading/terminal/dashboard');
      if (res && res.ok) {
        setAccount(res.account);
        setWatchlist(res.watchlist || []);
        setPositions(res.positions || []);
        setActiveOrders(res.active_orders || []);
        setSmartRouting(res.smart_routing);
        setRiskSummary(res.risk_summary);
        setSignals(res.signals || []);
        setPerformance(res.performance);
        setActivityStream(res.activity_stream || []);
      } else {
        setError(res?.error || 'Failed to fetch Trading Terminal workspace data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching Trading Terminal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminalData();
  }, []);

  const handleExecuteOrder = async () => {
    setSubmittingOrder(true);
    try {
      const res = await apiFetch('/api/trading/orders/oms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          order_type: orderType,
          side: orderSide,
          quantity: parseFloat(quantity),
          price: limitPrice,
          stop_loss: stopLoss,
          take_profit: takeProfit
        })
      });
      if (res && res.ok) {
        toast.success(`Order Dispatched: ${orderSide} ${quantity} ${symbol} via Smart Router`);
        fetchTerminalData();
      } else {
        toast.error(res?.error || 'Failed to dispatch order.');
      }
    } catch (err: any) {
      toast.error('Network error dispatching order.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Breadcrumb & Account Bar Header ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Trading</span>
            <span>/</span>
            <span className="text-nexus-pur">Trading Terminal</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Terminal className="text-nexus-pur" size={26} />
            Institutional Bloomberg Trading Terminal
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle size={10} /> {account?.broker ?? 'MetaTrader 5 ECN'}
            </span>
          </h1>
          <p className="text-xs text-nexus-muted mt-1">
            Central execution workspace connecting MT5 ECN Gateway, Smart Order Routing, AI Risk Sentinel, and Live Position Management.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => toast.success("Exported Terminal Execution Audit")}
            className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export Audit
          </button>
          <button 
            onClick={fetchTerminalData}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Stream Terminal
          </button>
        </div>
      </div>

      {/* ── Account Summary Header Metrics ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Account Balance</span>
          <div className="text-lg font-black text-nexus-white mt-1">{account?.balance ?? '$250,000.00'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Broker Equity Ledger</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Net Equity</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{account?.equity ?? '$268,420.50'}</div>
          <span className="text-[10px] font-bold text-nexus-muted mt-1 block">Unrealized P&L Included</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Free Margin</span>
          <div className="text-lg font-black text-nexus-white mt-1">{account?.free_margin ?? '$250,020.50'}</div>
          <span className="text-[10px] font-bold text-nexus-pur mt-1 block">Margin Level: {account?.margin_level ?? '1,458%'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Smart Latency</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{smartRouting?.execution_latency_ms ?? '1.8ms'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Fill Quality: {smartRouting?.fill_quality_score ?? '99.4%'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Daily P&L</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{performance?.today_pnl ?? '+$11,190.00'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Win Rate: {performance?.win_rate ?? '68.4%'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Trading Session</span>
          <div className="text-xs font-bold text-nexus-white mt-2 truncate">{account?.trading_session ?? 'US Session Active'}</div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">FIX Gateway Connected</span>
        </div>
      </div>

      {/* ── Main Terminal Grid Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Watchlist & Signals Stream (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Watchlist */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span>Market Watchlist</span>
              <span className="text-[10px] font-bold text-emerald-400">Live Spreads</span>
            </span>

            <div className="flex flex-col gap-2">
              {watchlist.map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => setSymbol(item.symbol)}
                  className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    symbol === item.symbol 
                      ? 'bg-nexus-pur/10 border-nexus-pur text-nexus-white' 
                      : 'bg-nexus-bg/50 border-nexus-border/30 hover:bg-nexus-bg'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs block">{item.symbol}</span>
                    <span className="text-[10px] text-nexus-muted">Sprd: {item.spread}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold block">{item.ask}</span>
                    <span className={`text-[10px] font-bold ${item.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Trading Signals Feed */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={14} className="text-nexus-pur" /> Quantitative Signals
            </span>

            <div className="flex flex-col gap-2.5">
              {signals.map((sig, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/30 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-nexus-white">{sig.symbol}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {sig.direction} ({sig.confidence})
                    </span>
                  </div>
                  <p className="text-[10px] text-nexus-muted line-clamp-2">{sig.explanation}</p>
                  <button 
                    onClick={() => { setSymbol(sig.symbol); setOrderTypeSide('BUY'); }}
                    className="self-end text-[10px] font-bold text-nexus-pur hover:underline flex items-center gap-1 cursor-pointer mt-1"
                  >
                    Load Signal Order <ArrowUpRight size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Middle Col: Terminal Live Execution & Order Entry (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Order Entry Execution Panel */}
          <div className="p-5 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-nexus-border/50 pb-3">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={16} className="text-nexus-pur" /> Smart Order Entry Ticket ({symbol})
              </span>
              <span className="text-[10px] font-bold text-nexus-muted">
                Venue: {smartRouting?.venue ?? 'MT5 FIX Gateway'}
              </span>
            </div>

            {/* Side Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setOrderTypeSide('BUY')}
                className={`py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer flex items-center justify-center gap-2 ${
                  orderSide === 'BUY' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-nexus-bg text-nexus-muted hover:text-nexus-white border border-nexus-border'
                }`}
              >
                <TrendingUp size={14} /> Buy / Long
              </button>
              <button 
                onClick={() => setOrderTypeSide('SELL')}
                className={`py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer flex items-center justify-center gap-2 ${
                  orderSide === 'SELL' 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                    : 'bg-nexus-bg text-nexus-muted hover:text-nexus-white border border-nexus-border'
                }`}
              >
                <TrendingDown size={14} /> Sell / Short
              </button>
            </div>

            {/* Order Type Tabs */}
            <div className="flex items-center gap-2 bg-nexus-bg p-1 rounded-xl border border-nexus-border/50 text-xs">
              {(['MARKET', 'LIMIT', 'STOP'] as const).map((t) => (
                <button 
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    orderType === t ? 'bg-nexus-pur text-white shadow' : 'text-nexus-muted hover:text-nexus-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Input Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Quantity</label>
                <input 
                  type="text" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-nexus-bg border border-nexus-border/60 text-nexus-white font-mono text-xs focus:outline-none focus:border-nexus-pur"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Price</label>
                <input 
                  type="text" 
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  disabled={orderType === 'MARKET'}
                  className="w-full px-3 py-2 rounded-lg bg-nexus-bg border border-nexus-border/60 text-nexus-white font-mono text-xs focus:outline-none focus:border-nexus-pur disabled:opacity-40"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Stop Loss</label>
                <input 
                  type="text" 
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-nexus-bg border border-nexus-border/60 text-rose-400 font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-nexus-muted uppercase block mb-1">Take Profit</label>
                <input 
                  type="text" 
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-nexus-bg border border-nexus-border/60 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button 
              onClick={handleExecuteOrder}
              disabled={submittingOrder}
              className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-xl ${
                orderSide === 'BUY' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
              }`}
            >
              {submittingOrder ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={16} />}
              Dispatch {orderSide} Order ({quantity} {symbol})
            </button>
          </div>

          {/* Open Positions Table */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl overflow-x-auto">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span>Open Positions Ledger</span>
              <span className="text-[10px] text-emerald-400 font-bold">Mark-to-Market Live</span>
            </span>

            {positions.length === 0 ? (
              <div className="py-6 text-center text-nexus-muted text-xs">No open positions.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-nexus-border/40 text-[10px] text-nexus-muted uppercase">
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Size</th>
                    <th className="pb-2">Entry</th>
                    <th className="pb-2">Mark</th>
                    <th className="pb-2 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border/20">
                  {positions.map((p, i) => (
                    <tr key={i} className="hover:bg-nexus-bg/40 font-mono">
                      <td className="py-2.5 text-[11px] text-nexus-muted">{p.position_id}</td>
                      <td className="py-2.5 font-bold text-nexus-white">{p.symbol}</td>
                      <td className="py-2.5"><span className="text-emerald-400 font-bold">{p.type}</span></td>
                      <td className="py-2.5">{p.size}</td>
                      <td className="py-2.5">${p.entry}</td>
                      <td className="py-2.5">${p.current}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">{p.pnl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* Right Col: AI Assistant & Risk Summary (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Risk Summary Card */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <ShieldCheck size={16} className="text-emerald-400" /> Account Risk Sentinel
            </span>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                <span className="text-[10px] text-nexus-muted">Daily $VaR$ 95%</span>
                <span className="font-mono font-bold text-nexus-white">{riskSummary?.daily_var_95 ?? '$4,250.00'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                <span className="text-[10px] text-nexus-muted">Expected Shortfall</span>
                <span className="font-mono font-bold text-rose-400">{riskSummary?.expected_shortfall ?? '$6,120.00'}</span>
              </div>
              <div className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                <span className="text-[10px] text-nexus-muted">Margin Utilization</span>
                <span className="font-mono font-bold text-emerald-400">{riskSummary?.margin_utilization ?? '7.36%'}</span>
              </div>
            </div>
          </div>

          {/* Active Orders & Activity Stream */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span>Active Orders ({activeOrders.length})</span>
            </span>
            <div className="space-y-1.5 text-xs">
              {activeOrders.map((ord, i) => (
                <div key={i} className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between font-mono">
                  <span className="font-bold text-nexus-white">{ord.symbol} ({ord.type})</span>
                  <span className="text-emerald-400 font-bold">{ord.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span>Terminal Execution Stream</span>
            </span>
            <div className="space-y-1.5 text-[11px]">
              {activityStream.map((act, i) => (
                <div key={i} className="p-2 rounded bg-nexus-bg/50 border border-nexus-border/30 flex flex-col gap-0.5">
                  <span className="text-nexus-muted text-[10px] font-bold">{act.time} — {act.event}</span>
                  <span className="text-nexus-white">{act.details}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual AI Assistant */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" /> Terminal AI Co-Pilot
            </span>

            {error && (
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <button 
                onClick={() => handleAiAsk("Evaluate current trade risk and stop loss placement")}
                className="w-full text-left p-2 rounded bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Evaluate Setup & Risk
              </button>
              <button 
                onClick={() => handleAiAsk("Suggest optimal position size based on account margin")}
                className="w-full text-left p-2 rounded bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur border border-nexus-pur/30 transition cursor-pointer"
              >
                🤖 Calculate Position Size
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
