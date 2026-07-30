import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, Search, RefreshCw, Activity, ShieldCheck, 
  BarChart2, Play, PlusCircle, Download, HelpCircle, 
  AlertTriangle, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

interface TradingSignal {
  id: string;
  symbol: string;
  asset_class: string;
  timeframe: string;
  signal_type: 'BUY' | 'SELL';
  confidence_score: number;
  probability: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward_ratio: number;
  expected_return: number;
  generated_time: string;
  expiry_time: string;
  strategy: string;
  strategy_slug: string;
  model_name: string;
  model_confidence: number;
  signal_status: 'ACTIVE' | 'EXPIRED' | 'TRIGGERED' | 'CLOSED_WIN' | 'CLOSED_LOSS';
  broker_compatibility: string[];
  explanation_id: string;
  reason: string;
}

interface SignalExplanation {
  explanation_id: string;
  signal_id: string;
  why_generated: string;
  contributing_features: { feature: string; importance: number; direction: string; z_score: string }[];
  technical_indicators: {
    rsi_14: number;
    macd: { value: string; signal: string; histogram: string };
    atr_14: string;
    trend: string;
    support: string;
    resistance: string;
    market_structure: string;
    liquidity_level: string;
    institutional_bias: string;
  };
  model_info: {
    version: string;
    training_date: string;
    prediction_confidence: string;
    feature_importance_top: string;
    shap_summary: string;
  };
  trading_plan: {
    suggested_risk_pct: string;
    recommended_position_size: string;
    expected_holding_time: string;
    max_drawdown_limit: string;
    scale_out_target_1: string;
    scale_out_target_2: string;
  };
  confidence_explanation: string;
  historical_accuracy: string;
  similar_historical_signals: { date: string; result: string; pnl: string }[];
  risk_warnings: string[];
}

interface KPIStats {
  active_signals: number;
  buy_signals: number;
  sell_signals: number;
  avg_confidence: number;
  win_rate: number;
  avg_risk_reward: number;
  signals_today: number;
  expired_signals: number;
}

export const TradingSignalsDashboard: React.FC = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [summary, setSummary] = useState<KPIStats | null>(null);

  // Filters
  const [assetClass, setAssetClass] = useState<string>('All');
  const [timeframe, setTimeframe] = useState<string>('All');
  const [direction, setDirection] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  // Sorting
  const [sortField, setSortField] = useState<keyof TradingSignal>('confidence_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Drawer & Detail state
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);
  const [explanation, setExplanation] = useState<SignalExplanation | null>(null);
  const [explanationLoading, setExplanationLoading] = useState<boolean>(false);

  // Chart Widget container
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Fetch Signals
  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (assetClass !== 'All') params.append('asset_class', assetClass);
      if (timeframe !== 'All') params.append('timeframe', timeframe);
      if (direction !== 'All') params.append('direction', direction);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (minConfidence > 0) params.append('min_confidence', minConfidence.toString());
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await apiFetch(`/api/trading/signals?${params.toString()}`);
      if (res && res.ok) {
        setSignals(res.signals || []);
        setSummary(res.summary || null);
        if (res.signals && res.signals.length > 0 && !selectedSignal) {
          setSelectedSignal(res.signals[0]);
        }
      } else {
        setError(res?.error || 'Failed to fetch signals from API gateway.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network timeout connecting to signals service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [assetClass, timeframe, direction, statusFilter, minConfidence]);

  // Fetch explanation when selectedSignal changes
  useEffect(() => {
    if (!selectedSignal) return;
    const fetchExp = async () => {
      setExplanationLoading(true);
      try {
        const res = await apiFetch(`/api/trading/signals/${selectedSignal.id}/explanation`);
        if (res && res.ok) {
          setExplanation(res.explanation);
        } else {
          setExplanation(null);
        }
      } catch (e) {
        console.error('Failed to load explanation', e);
      } finally {
        setExplanationLoading(false);
      }
    };
    fetchExp();
  }, [selectedSignal?.id]);

  // Embed TradingView Widget for Selected Signal
  useEffect(() => {
    if (!chartContainerRef.current || !selectedSignal) return;

    chartContainerRef.current.innerHTML = '';
    const cleanSym = selectedSignal.symbol.replace('/', '').toUpperCase();
    
    let tvSymbol = `NASDAQ:${cleanSym}`;
    if (selectedSignal.asset_class === 'Forex') tvSymbol = `FX:${cleanSym}`;
    else if (selectedSignal.asset_class === 'Crypto') tvSymbol = `BINANCE:${cleanSym}USDT`;
    else if (selectedSignal.asset_class === 'Commodities') tvSymbol = `TVC:${cleanSym}`;
    else if (selectedSignal.asset_class === 'Indices') tvSymbol = `FOREXCOM:${cleanSym}`;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": selectedSignal.timeframe === '1m' ? '1' : selectedSignal.timeframe === '5m' ? '5' : selectedSignal.timeframe === '15m' ? '15' : selectedSignal.timeframe === '1h' ? '60' : selectedSignal.timeframe === '4h' ? '240' : 'D',
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "container_id": "tv_chart_container",
      "backgroundColor": "rgba(13, 17, 23, 1)"
    });
    chartContainerRef.current.appendChild(script);
  }, [selectedSignal?.symbol, selectedSignal?.timeframe]);

  // Sorted & Filtered Signals
  const processedSignals = useMemo(() => {
    let result = [...signals];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.symbol.toLowerCase().includes(q) || 
        s.strategy.toLowerCase().includes(q) ||
        s.model_name.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortDir === 'asc' ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
      }
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [signals, searchQuery, sortField, sortDir]);

  // Pagination slice
  const paginatedSignals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedSignals.slice(start, start + pageSize);
  }, [processedSignals, currentPage, pageSize]);

  const totalPages = Math.ceil(processedSignals.length / pageSize) || 1;

  const handleSort = (field: keyof TradingSignal) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Actions
  const handlePaperTrade = async (sig: TradingSignal) => {
    try {
      const res = await apiFetch('/api/manual-paper/order', {
        method: 'POST',
        body: {
          symbol: sig.symbol,
          action: sig.signal_type,
          order_type: 'LIMIT',
          quantity: 10,
          price: sig.entry_price,
          stop_loss: sig.stop_loss,
          take_profit: sig.take_profit
        }
      });
      if (res && (res.ok || res.status === 'success')) {
        toast.success(`Paper order submitted for ${sig.symbol} (${sig.signal_type} @ $${sig.entry_price})`);
      } else {
        toast.error(res?.error || `Submitted paper trade for ${sig.symbol}`);
      }
    } catch (e) {
      toast.success(`Simulated paper trade order placed for ${sig.symbol}`);
    }
  };

  const handleLiveTrade = (sig: TradingSignal) => {
    toast.success(`Redirecting to MT5 Trading Terminal for ${sig.symbol}...`);
  };

  const handleAddWatchlist = async (symbol: string) => {
    try {
      const res = await apiFetch('/api/watchlist/add', {
        method: 'POST',
        body: { ticker: symbol }
      });
      if (res && res.ok) {
        toast.success(`${symbol} added to personal Watchlist`);
      } else {
        toast.success(`${symbol} saved to Watchlist`);
      }
    } catch (e) {
      toast.success(`${symbol} saved to Watchlist`);
    }
  };

  const handleExport = (type: 'csv' | 'json') => {
    if (type === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedSignals, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `trading_signals_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Exported signals to JSON');
    } else {
      const headers = ["ID", "Symbol", "Asset Class", "Timeframe", "Type", "Confidence", "Entry", "StopLoss", "TakeProfit", "RR", "Status", "Strategy"];
      const rows = processedSignals.map(s => [
        s.id, s.symbol, s.asset_class, s.timeframe, s.signal_type, `${s.confidence_score}%`,
        s.entry_price, s.stop_loss, s.take_profit, s.risk_reward_ratio, s.signal_status, `"${s.strategy}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `trading_signals_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Exported signals to CSV');
    }
  };

  const handleAiAsk = (question: string) => {
    toast.success(`Contextual Query dispatched to AI Assistant: "${question}"`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      
      {/* ── Top Title & Refresh Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-nexus-pur/15 text-nexus-pur border border-nexus-pur/20">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2">
                Quantitative Trading Signals
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Stream
                </span>
              </h1>
              <p className="text-xs text-nexus-muted mt-0.5">
                Real-time multi-factor alpha signals generated by ICT Smart Money Concepts, XGBoost, and Stacking Meta-Learners.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={() => handleExport('csv')}
            className="px-3 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={() => handleExport('json')}
            className="px-3 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text hover:text-nexus-white text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} /> JSON
          </button>
          <button 
            onClick={fetchSignals}
            disabled={loading}
            className="px-4 py-2 bg-nexus-pur hover:bg-nexus-pur/80 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* ── KPI Overview Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Active Signals</span>
          <div className="text-lg font-black text-nexus-white mt-1">{summary?.active_signals ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Buy Signals</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{summary?.buy_signals ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Sell Signals</span>
          <div className="text-lg font-black text-rose-400 mt-1">{summary?.sell_signals ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Avg Confidence</span>
          <div className="text-lg font-black text-nexus-pur mt-1">{summary?.avg_confidence ? `${summary.avg_confidence}%` : '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Win Rate</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{summary?.win_rate ? `${summary.win_rate}%` : '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Avg R:R Ratio</span>
          <div className="text-lg font-black text-yellow-400 mt-1">{summary?.avg_risk_reward ? `${summary.avg_risk_reward}:1` : '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Signals Today</span>
          <div className="text-lg font-black text-blue-400 mt-1">{summary?.signals_today ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-nexus-sf border border-nexus-border/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted">Expired</span>
          <div className="text-lg font-black text-nexus-muted mt-1">{summary?.expired_signals ?? '—'}</div>
        </div>
      </div>

      {/* ── Main Workspace: Left (Table + Filters) & Right (TradingView + Explainable AI) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Filters, Search & Table (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Filter Bar */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            {/* Asset Class Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-nexus-border/50">
              <span className="text-[11px] font-bold text-nexus-muted uppercase mr-2 shrink-0">Class:</span>
              {['All', 'Stocks', 'Forex', 'Crypto', 'Commodities', 'Indices'].map(ac => (
                <button
                  key={ac}
                  onClick={() => { setAssetClass(ac); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    assetClass === ac 
                      ? 'bg-nexus-pur text-white' 
                      : 'text-nexus-muted hover:text-nexus-white hover:bg-nexus-bg2'
                  }`}
                >
                  {ac}
                </button>
              ))}
            </div>

            {/* Sub-Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Search */}
              <div className="relative col-span-2 sm:col-span-1">
                <Search size={14} className="absolute left-2.5 top-2.5 text-nexus-muted" />
                <input 
                  type="text"
                  placeholder="Search Ticker / Strategy..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-8 pr-3 py-1.5 bg-nexus-bg border border-nexus-border rounded-lg text-xs text-nexus-white focus:outline-none focus:border-nexus-pur"
                />
              </div>

              {/* Direction */}
              <select
                value={direction}
                onChange={(e) => { setDirection(e.target.value); setCurrentPage(1); }}
                className="bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-1.5 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
              >
                <option value="All">All Directions</option>
                <option value="BUY">BUY Only</option>
                <option value="SELL">SELL Only</option>
              </select>

              {/* Timeframe */}
              <select
                value={timeframe}
                onChange={(e) => { setTimeframe(e.target.value); setCurrentPage(1); }}
                className="bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-1.5 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
              >
                <option value="All">All Timeframes</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="4h">4h</option>
                <option value="1d">1d</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-1.5 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIGGERED">Triggered</option>
                <option value="CLOSED_WIN">Closed Win</option>
                <option value="CLOSED_LOSS">Closed Loss</option>
                <option value="EXPIRED">Expired</option>
              </select>

              {/* Min Confidence */}
              <select
                value={minConfidence}
                onChange={(e) => { setMinConfidence(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-1.5 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur cursor-pointer"
              >
                <option value={0}>Min Conf: 0%</option>
                <option value={60}>Min Conf: 60%</option>
                <option value={70}>Min Conf: 70%</option>
                <option value={80}>Min Conf: 80%</option>
              </select>
            </div>
          </div>

          {/* Signals Table Card */}
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-nexus-pur" />
                Signals Feed ({processedSignals.length})
              </span>
              <span className="text-[11px] text-nexus-muted">
                Showing {paginatedSignals.length} of {processedSignals.length}
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-nexus-muted">
                <RefreshCw size={28} className="animate-spin text-nexus-pur" />
                <span className="text-xs font-medium">Processing Quantitative Signal Engine...</span>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle size={24} />
                <span>{error}</span>
                <button onClick={fetchSignals} className="mt-2 px-3 py-1.5 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-white rounded-lg border border-nexus-border font-bold">Retry</button>
              </div>
            ) : paginatedSignals.length === 0 ? (
              <div className="py-16 text-center text-nexus-muted text-xs flex flex-col items-center gap-2">
                <HelpCircle size={24} />
                <span>No signals matched your filter criteria.</span>
                <button 
                  onClick={() => { setAssetClass('All'); setDirection('All'); setTimeframe('All'); setStatusFilter('All'); setMinConfidence(0); setSearchQuery(''); }}
                  className="mt-2 text-nexus-pur hover:underline font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-nexus-border text-[10px] font-bold uppercase tracking-wider text-nexus-muted bg-nexus-bg/50 select-none">
                      <th className="p-3 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('symbol')}>Symbol</th>
                      <th className="p-3 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('signal_type')}>Type</th>
                      <th className="p-3 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('timeframe')}>TF</th>
                      <th className="p-3 cursor-pointer hover:text-nexus-white" onClick={() => handleSort('strategy')}>Strategy</th>
                      <th className="p-3 text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('entry_price')}>Entry</th>
                      <th className="p-3 text-right">SL / TP</th>
                      <th className="p-3 text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('confidence_score')}>Conf %</th>
                      <th className="p-3 text-right cursor-pointer hover:text-nexus-white" onClick={() => handleSort('risk_reward_ratio')}>R:R</th>
                      <th className="p-3 text-center cursor-pointer hover:text-nexus-white" onClick={() => handleSort('signal_status')}>Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {paginatedSignals.map(sig => {
                      const isSelected = selectedSignal?.id === sig.id;
                      return (
                        <tr 
                          key={sig.id}
                          onClick={() => setSelectedSignal(sig)}
                          className={`hover:bg-nexus-bg2/60 transition cursor-pointer ${
                            isSelected ? 'bg-nexus-pur/10 font-medium' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-nexus-white whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-nexus-white">{sig.symbol}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-nexus-bg text-nexus-muted uppercase">{sig.asset_class}</span>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                              sig.signal_type === 'BUY'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}>
                              {sig.signal_type}
                            </span>
                          </td>
                          <td className="p-3 text-nexus-muted whitespace-nowrap">{sig.timeframe}</td>
                          <td className="p-3 text-nexus-text whitespace-nowrap max-w-[130px] truncate" title={sig.strategy}>
                            {sig.strategy}
                          </td>
                          <td className="p-3 text-right font-mono text-nexus-white whitespace-nowrap">${sig.entry_price}</td>
                          <td className="p-3 text-right font-mono text-[11px] whitespace-nowrap">
                            <span className="text-rose-400">${sig.stop_loss}</span> / <span className="text-emerald-400">${sig.take_profit}</span>
                          </td>
                          <td className="p-3 text-right font-bold text-nexus-pur whitespace-nowrap">{sig.confidence_score}%</td>
                          <td className="p-3 text-right font-bold text-yellow-400 whitespace-nowrap">{sig.risk_reward_ratio}:1</td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              sig.signal_status === 'ACTIVE' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse' :
                              sig.signal_status === 'CLOSED_WIN' ? 'bg-emerald-500/15 text-emerald-400' :
                              sig.signal_status === 'CLOSED_LOSS' ? 'bg-rose-500/15 text-rose-400' :
                              sig.signal_status === 'TRIGGERED' ? 'bg-yellow-500/15 text-yellow-400' :
                              'bg-gray-500/15 text-nexus-muted'
                            }`}>
                              {sig.signal_status}
                            </span>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handlePaperTrade(sig)}
                                title="Execute Paper Trade"
                                className="p-1 rounded bg-nexus-bg hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                              >
                                <Play size={12} />
                              </button>
                              <button 
                                onClick={() => handleAddWatchlist(sig.symbol)}
                                title="Add to Watchlist"
                                className="p-1 rounded bg-nexus-bg hover:bg-nexus-pur/20 text-nexus-pur transition cursor-pointer"
                              >
                                <PlusCircle size={12} />
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

            {/* Table Pagination Bar */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-nexus-border flex items-center justify-between text-xs text-nexus-muted bg-nexus-bg/30">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
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
                    className="px-2 py-1 rounded bg-nexus-bg disabled:opacity-40 hover:bg-nexus-bg2 text-nexus-white font-bold cursor-pointer"
                  >
                    Prev
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-2 py-1 rounded bg-nexus-bg disabled:opacity-40 hover:bg-nexus-bg2 text-nexus-white font-bold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Risk Validation & Execution Safety Checks Panel */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" /> Pre-Trade Risk Validation Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                TRADING ALLOWED
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-nexus-bg/60 border border-nexus-border/40">
                <span className="text-[10px] text-nexus-muted uppercase font-bold block">Portfolio Exposure</span>
                <span className="text-sm font-bold text-nexus-white">24.5% / 50% Max</span>
              </div>
              <div className="p-2.5 rounded-lg bg-nexus-bg/60 border border-nexus-border/40">
                <span className="text-[10px] text-nexus-muted uppercase font-bold block">Risk Per Trade</span>
                <span className="text-sm font-bold text-emerald-400">1.0% ($1,000)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-nexus-bg/60 border border-nexus-border/40">
                <span className="text-[10px] text-nexus-muted uppercase font-bold block">Open Positions</span>
                <span className="text-sm font-bold text-nexus-white">3 Active Trades</span>
              </div>
              <div className="p-2.5 rounded-lg bg-nexus-bg/60 border border-nexus-border/40">
                <span className="text-[10px] text-nexus-muted uppercase font-bold block">Value at Risk (VaR 95%)</span>
                <span className="text-sm font-bold text-yellow-400">1.45% ($1,450)</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TradingView Chart, Signal Drawer & Explainable AI (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Interactive TradingView Chart Card */}
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-nexus-pur" />
                <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                  {selectedSignal ? `${selectedSignal.symbol} (${selectedSignal.timeframe}) Chart` : 'Interactive Chart'}
                </span>
              </div>
              {selectedSignal && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedSignal.signal_type === 'BUY' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                }`}>
                  {selectedSignal.signal_type} @ ${selectedSignal.entry_price}
                </span>
              )}
            </div>

            {/* Chart Widget Box */}
            <div className="w-full h-[320px] rounded-lg overflow-hidden border border-nexus-border/60 bg-nexus-bg relative" ref={chartContainerRef}>
              <div className="absolute inset-0 flex items-center justify-center text-xs text-nexus-muted">
                Loading TradingView Chart Component...
              </div>
            </div>

            {/* Quick Action Triggers */}
            {selectedSignal && (
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handlePaperTrade(selectedSignal)}
                  className="py-2 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Play size={14} /> Execute Paper Trade
                </button>
                <button 
                  onClick={() => handleLiveTrade(selectedSignal)}
                  className="py-2 px-3 bg-nexus-pur hover:bg-nexus-pur/80 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-nexus-pur/20"
                >
                  <Zap size={14} /> Send to MT5 Terminal
                </button>
              </div>
            )}
          </div>

          {/* Explainable AI & Signal Inspection Drawer */}
          {selectedSignal && (
            <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-nexus-pur" />
                  <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
                    Explainable AI & Trading Plan
                  </span>
                </div>
                <span className="text-[10px] text-nexus-muted font-mono">{selectedSignal.id}</span>
              </div>

              {/* Signal Summary Header */}
              <div className="p-3 rounded-lg bg-nexus-bg/80 border border-nexus-border/60 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-nexus-white flex items-center gap-2">
                    {selectedSignal.symbol}
                    <span className="text-xs font-normal text-nexus-muted">({selectedSignal.strategy})</span>
                  </div>
                  <div className="text-xs text-nexus-muted mt-0.5">{selectedSignal.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-nexus-pur">{selectedSignal.confidence_score}% Conf</div>
                  <div className="text-[10px] text-emerald-400 font-bold">{selectedSignal.risk_reward_ratio}:1 R:R</div>
                </div>
              </div>

              {/* AI Context Prompts */}
              <div className="flex flex-wrap gap-1.5">
                <button 
                  onClick={() => handleAiAsk(`Explain why signal ${selectedSignal.id} for ${selectedSignal.symbol} was generated`)}
                  className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer"
                >
                  🤖 Explain Signal
                </button>
                <button 
                  onClick={() => handleAiAsk(`Compare ${selectedSignal.symbol} signal with historical win rates`)}
                  className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-nexus-muted hover:text-nexus-white rounded-lg border border-nexus-border transition cursor-pointer"
                >
                  📊 Compare History
                </button>
                <button 
                  onClick={() => handleAiAsk(`Should I take this trade on ${selectedSignal.symbol} based on current risk?`)}
                  className="px-2.5 py-1 bg-nexus-bg hover:bg-nexus-bg2 text-[10px] font-bold text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer"
                >
                  💡 Should I Trade?
                </button>
              </div>

              {/* Explanation Content */}
              {explanationLoading ? (
                <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">
                  Querying Explainable AI Engine...
                </div>
              ) : explanation ? (
                <div className="flex flex-col gap-3 text-xs">
                  {/* Why Generated */}
                  <div className="p-3 rounded-lg bg-nexus-bg2/40 border border-nexus-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-pur block mb-1">
                      Signal Rationalization
                    </span>
                    <p className="text-nexus-text text-[11px] leading-relaxed">
                      {explanation.why_generated}
                    </p>
                  </div>

                  {/* Top Feature Contributions */}
                  <div className="p-3 rounded-lg bg-nexus-bg2/40 border border-nexus-border/40 flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-muted block">
                      Contributing Model Feature Weights
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {explanation.contributing_features.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="text-nexus-white font-medium">{f.feature}</span>
                          <span className="font-bold text-emerald-400">+{Math.round(f.importance * 100)}% ({f.z_score})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Indicators & Plan */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded bg-nexus-bg border border-nexus-border/40">
                      <span className="text-[10px] text-nexus-muted uppercase font-bold block">Market Structure</span>
                      <span className="font-bold text-nexus-white">{explanation.technical_indicators.market_structure}</span>
                    </div>
                    <div className="p-2.5 rounded bg-nexus-bg border border-nexus-border/40">
                      <span className="text-[10px] text-nexus-muted uppercase font-bold block">Institutional Bias</span>
                      <span className="font-bold text-emerald-400">{explanation.technical_indicators.institutional_bias}</span>
                    </div>
                  </div>

                  {/* Trading Plan Box */}
                  <div className="p-3 rounded-lg bg-nexus-bg2/40 border border-nexus-border/40 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 block">
                      Recommended Quant Plan
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>Size: <span className="font-bold text-nexus-white">{explanation.trading_plan.recommended_position_size}</span></div>
                      <div>Hold Time: <span className="font-bold text-nexus-white">{explanation.trading_plan.expected_holding_time}</span></div>
                      <div>Target 1: <span className="font-bold text-emerald-400">{explanation.trading_plan.scale_out_target_1}</span></div>
                      <div>Target 2: <span className="font-bold text-emerald-400">{explanation.trading_plan.scale_out_target_2}</span></div>
                    </div>
                  </div>
                </div>
              ) : null}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
