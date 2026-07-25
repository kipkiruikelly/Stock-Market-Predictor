import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu, Check, Plus, AlertCircle, Play, Radio, Activity, TrendingUp,
  RefreshCw, Globe, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Box, Typography, Card, CardContent, Button, Grid, CircularProgress,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Switch, ToggleButtonGroup, ToggleButton, Divider, Tooltip,
} from '@mui/material';
import { apiFetch } from '../utils/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Bot {
  id: number;
  slug: string;
  name: string;
  description: string;
  asset_class: string;
  is_subscribed: boolean;
  auto_trade_enabled?: boolean;
  auto_trade_mode?: string;
  max_risk_pct?: number;
}

interface Signal {
  bot_name: string;
  bot_slug: string;
  ticker: string;
  asset_class: string;
  timeframe: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  confidence_pct: number;
  reason: string;
  timestamp: string;
  auto_trade_enabled?: boolean;
}

interface BacktestResult {
  bot_slug: string;
  ticker: string;
  timeframe: string;
  period_days: number;
  performance: {
    initial_balance: number;
    final_balance: number;
    total_return_pct: number;
    win_rate_pct: number;
    profit_factor: number;
    max_drawdown_pct: number;
    total_trades_placed: number;
    winning_trades: number;
    losing_trades: number;
  };
  equity_curve: { date: string; equity: number }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

const ASSET_CLASSES = ['Stocks', 'Forex', 'Crypto', 'Commodities', 'Indices'];

const ASSET_CLASS_TICKERS: Record<string, { value: string; label: string }[]> = {
  Stocks: [
    { value: 'SPY',  label: 'SPY  — S&P 500 ETF' },
    { value: 'QQQ',  label: 'QQQ  — Nasdaq-100 ETF' },
    { value: 'AAPL', label: 'AAPL — Apple Inc.' },
    { value: 'NVDA', label: 'NVDA — NVIDIA Corp.' },
    { value: 'MSFT', label: 'MSFT — Microsoft' },
    { value: 'TSLA', label: 'TSLA — Tesla' },
    { value: 'META', label: 'META — Meta Platforms' },
    { value: 'GOOGL',label: 'GOOGL — Alphabet' },
    { value: 'AMZN', label: 'AMZN — Amazon' },
  ],
  Forex: [
    { value: 'EURUSD', label: 'EUR/USD' },
    { value: 'GBPUSD', label: 'GBP/USD' },
    { value: 'USDJPY', label: 'USD/JPY' },
    { value: 'AUDUSD', label: 'AUD/USD' },
    { value: 'USDCHF', label: 'USD/CHF' },
    { value: 'NZDUSD', label: 'NZD/USD' },
    { value: 'USDCAD', label: 'USD/CAD' },
  ],
  Crypto: [
    { value: 'BTC',  label: 'BTC  — Bitcoin' },
    { value: 'ETH',  label: 'ETH  — Ethereum' },
    { value: 'SOL',  label: 'SOL  — Solana' },
    { value: 'BNB',  label: 'BNB  — BNB Chain' },
    { value: 'XRP',  label: 'XRP  — Ripple' },
    { value: 'ADA',  label: 'ADA  — Cardano' },
    { value: 'DOGE', label: 'DOGE — Dogecoin' },
  ],
  Commodities: [
    { value: 'GOLD',   label: 'GOLD   — Gold (XAU/USD)' },
    { value: 'SILVER', label: 'SILVER — Silver (XAG/USD)' },
    { value: 'OIL',    label: 'OIL    — Crude Oil (WTI)' },
    { value: 'NATGAS', label: 'NATGAS — Natural Gas' },
    { value: 'COPPER', label: 'COPPER — Copper' },
    { value: 'WHEAT',  label: 'WHEAT  — Wheat Futures' },
    { value: 'CORN',   label: 'CORN   — Corn Futures' },
  ],
  Indices: [
    { value: 'SPX',    label: 'SPX    — S&P 500 Index' },
    { value: 'NDX',    label: 'NDX    — Nasdaq-100 Index' },
    { value: 'DJI',    label: 'DJI    — Dow Jones' },
    { value: 'DAX',    label: 'DAX    — German Index' },
    { value: 'FTSE',   label: 'FTSE   — UK FTSE 100' },
    { value: 'NIKKEI', label: 'NIKKEI — Japan Nikkei 225' },
    { value: 'VIX',    label: 'VIX    — Volatility Index' },
  ],
};

const ASSET_CLASS_COLORS: Record<string, string> = {
  'All Markets': '#3b82f6',
  Stocks:        '#10b981',
  Forex:         '#f59e0b',
  Crypto:        '#8b5cf6',
  Commodities:   '#f97316',
  Indices:       '#06b6d4',
};

const TF_STYLE: Record<string, { label: string; color: string }> = {
  '1m':  { label: '1M  Scalp',   color: '#ef4444' },
  '5m':  { label: '5M  Scalp',   color: '#f97316' },
  '15m': { label: '15M Intraday',color: '#f59e0b' },
  '30m': { label: '30M Intraday',color: '#eab308' },
  '1h':  { label: '1H  Intraday',color: '#10b981' },
  '4h':  { label: '4H  Swing',   color: '#3b82f6' },
  '1d':  { label: '1D  Position',color: '#8b5cf6' },
};

// ── Per-bot config state ──────────────────────────────────────────────────────
interface BotConfig {
  timeframe: string;
  assetClass: string;
  ticker: string;
}

function defaultConfig(): BotConfig {
  return { timeframe: '1h', assetClass: 'Stocks', ticker: 'SPY' };
}

// ── Component ─────────────────────────────────────────────────────────────────

export const BotsDashboard: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-bot configuration
  const [botConfigs, setBotConfigs] = useState<Record<number, BotConfig>>({});

  // Global signal stream filters
  const [streamTicker, setStreamTicker] = useState('SPY');
  const [streamTf, setStreamTf] = useState('1h');
  const [streamAsset, setStreamAsset] = useState('Stocks');
  const [streamLoading, setStreamLoading] = useState(false);

  // Dialog States
  const [signalsOpen, setSignalsOpen] = useState(false);
  const [backtestOpen, setBacktestOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);

  // Backtest Parameters
  const [backtestTicker, setBacktestTicker] = useState('SPY');
  const [backtestTf, setBacktestTf] = useState('1d');
  const [backtestAsset, setBacktestAsset] = useState('Stocks');
  const [backtestPeriod, setBacktestPeriod] = useState(180);
  const [backtestRisk, setBacktestRisk] = useState(1.0);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [backtesting, setBacktesting] = useState(false);

  // ── Data Fetching ────────────────────────────────────────────────────────────

  const fetchBots = async () => {
    try {
      const json = await apiFetch('/api/bots');
      if (json.ok) {
        const list = json.bots || json.data?.bots || [];
        const mapped = list.map((b: any) => ({
          ...b,
          is_subscribed: b.is_subscribed !== undefined ? b.is_subscribed : b.subscribed,
        }));
        setBots(mapped);
        // Initialise per-bot configs
        const configs: Record<number, BotConfig> = {};
        mapped.forEach((b: Bot) => { configs[b.id] = defaultConfig(); });
        setBotConfigs(configs);
      }
    } catch (err) {
      console.error('Failed to fetch bots:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignals = useCallback(async (
    ticker = streamTicker,
    tf = streamTf,
    asset = streamAsset,
  ) => {
    setStreamLoading(true);
    try {
      const qs = new URLSearchParams({ ticker, timeframe: tf, asset_class: asset });
      const json = await apiFetch(`/api/bots/signals?${qs}`);
      if (json.ok) setSignals(json.signals || []);
    } catch (err) {
      console.error('Failed to fetch bot signals:', err);
    } finally {
      setStreamLoading(false);
    }
  }, [streamTicker, streamTf, streamAsset]);

  useEffect(() => { fetchBots(); fetchSignals(); }, []);

  // ── Bot Config Helpers ───────────────────────────────────────────────────────

  const setBotField = (id: number, field: keyof BotConfig, value: string) => {
    setBotConfigs(prev => {
      const cfg = { ...(prev[id] || defaultConfig()), [field]: value };
      // Reset ticker to first in asset class when class changes
      if (field === 'assetClass') {
        cfg.ticker = ASSET_CLASS_TICKERS[value]?.[0]?.value || 'SPY';
      }
      return { ...prev, [id]: cfg };
    });
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const toggleSubscription = async (botId: number, botName: string) => {
    try {
      const form = new FormData();
      form.append('bot_id', botId.toString());
      const data = await apiFetch('/api/bots/subscribe', { method: 'POST', body: form });
      if (data.ok) {
        const isSubscribed = data.subscribed !== undefined ? data.subscribed : data.data?.is_subscribed;
        setBots(prev => prev.map(b => b.id === botId ? { ...b, is_subscribed: isSubscribed } : b));
        toast.success(isSubscribed ? `Subscribed to ${botName}` : `Unsubscribed from ${botName}`);
      } else {
        toast.error(data.error || 'Failed to toggle subscription');
      }
    } catch { toast.error('Network error'); }
  };

  const toggleAutoTrade = async (botId: number, current: boolean, botName: string) => {
    try {
      const form = new FormData();
      form.append('bot_id', botId.toString());
      form.append('auto_trade_enabled', (!current).toString());
      form.append('auto_trade_mode', 'paper');
      form.append('max_risk_pct', '1.0');
      const data = await apiFetch('/api/bots/auto-trade', { method: 'POST', body: form });
      if (data.ok) {
        setBots(prev => prev.map(b => b.id === botId ? { ...b, auto_trade_enabled: !current } : b));
        toast.success(!current ? `Auto-Trading ON — ${botName}` : `Auto-Trading OFF — ${botName}`);
      }
    } catch { toast.error('Failed to configure auto-trading'); }
  };

  const handleGetSignal = (bot: Bot) => {
    const cfg = botConfigs[bot.id] || defaultConfig();
    setStreamTicker(cfg.ticker);
    setStreamTf(cfg.timeframe);
    setStreamAsset(cfg.assetClass);
    fetchSignals(cfg.ticker, cfg.timeframe, cfg.assetClass);
    setSignalsOpen(true);
  };

  const handleRunBacktest = async () => {
    if (!selectedBot) return;
    setBacktesting(true);
    try {
      const form = new FormData();
      form.append('bot_slug', selectedBot.slug || 'ict_core_m5');
      form.append('ticker', backtestTicker);
      form.append('timeframe', backtestTf);
      form.append('period_days', backtestPeriod.toString());
      form.append('risk_pct', backtestRisk.toString());
      const data = await apiFetch('/api/bots/backtest', { method: 'POST', body: form });
      if (data.ok) {
        setBacktestResult(data.backtest);
        toast.success(`Backtest completed for ${selectedBot.name}`);
      } else {
        toast.error(data.error || 'Backtest failed');
      }
    } catch { toast.error('Backtest error'); }
    finally { setBacktesting(false); }
  };

  const openBacktest = (bot: Bot) => {
    const cfg = botConfigs[bot.id] || defaultConfig();
    setSelectedBot(bot);
    setBacktestAsset(cfg.assetClass);
    setBacktestTicker(cfg.ticker);
    setBacktestTf(cfg.timeframe);
    setBacktestResult(null);
    setBacktestOpen(true);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 6 }, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.5rem', color: 'text.primary' }}>
            <Cpu color="#3b82f6" />
            AI Robots &amp; Automated Strategies
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Every robot trades across <b>all 7 timeframes</b> and <b>all 5 asset classes</b> — configure per robot below.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Radio size={16} />}
          onClick={() => { fetchSignals(); setSignalsOpen(true); }}
          sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
        >
          Live Signal Stream ({signals.length})
        </Button>
      </Box>

      {/* ── Timeframe legend ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {TIMEFRAMES.map(tf => (
          <Chip
            key={tf}
            label={TF_STYLE[tf].label}
            size="small"
            sx={{ bgcolor: TF_STYLE[tf].color + '22', color: TF_STYLE[tf].color, fontWeight: 'bold', fontSize: '0.7rem' }}
          />
        ))}
      </Box>

      {/* ── Bot Grid ── */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid size={12}>
            <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography color="text.secondary">Loading AI models…</Typography>
            </Box>
          </Grid>
        ) : bots.length === 0 ? (
          <Grid size={12}>
            <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <AlertCircle size={48} color="rgba(255,255,255,0.3)" />
              <Typography color="text.secondary">No active robots found.</Typography>
            </Box>
          </Grid>
        ) : (
          bots.map((bot) => {
            const cfg = botConfigs[bot.id] || defaultConfig();
            const tfMeta = TF_STYLE[cfg.timeframe] || TF_STYLE['1h'];
            const assetColor = ASSET_CLASS_COLORS[cfg.assetClass] || '#3b82f6';
            const tickerList = ASSET_CLASS_TICKERS[cfg.assetClass] || ASSET_CLASS_TICKERS.Stocks;

            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={bot.id}>
                <Card sx={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: bot.is_subscribed ? `1px solid ${assetColor}55` : '1px solid transparent',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }
                }}>
                  <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* Title row */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.3 }}>
                        {bot.name}
                      </Typography>
                      <Chip
                        label="All Markets"
                        size="small"
                        sx={{ bgcolor: '#3b82f622', color: '#3b82f6', fontWeight: 'bold', borderRadius: 1, ml: 1, flexShrink: 0 }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {bot.description}
                    </Typography>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                    {/* ── Per-bot configuration ── */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Globe size={12} /> Asset Class
                      </Typography>
                      <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={cfg.assetClass}
                        onChange={(_, v) => v && setBotField(bot.id, 'assetClass', v)}
                        sx={{ flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButton-root': { px: 1, py: 0.25, fontSize: '0.65rem', borderRadius: '4px !important', border: '1px solid rgba(255,255,255,0.12) !important' } }}
                      >
                        {ASSET_CLASSES.map(ac => (
                          <ToggleButton key={ac} value={ac} sx={{ color: cfg.assetClass === ac ? ASSET_CLASS_COLORS[ac] : 'text.secondary', bgcolor: cfg.assetClass === ac ? ASSET_CLASS_COLORS[ac] + '22' : 'transparent' }}>
                            {ac}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Clock size={12} /> Timeframe
                      </Typography>
                      <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={cfg.timeframe}
                        onChange={(_, v) => v && setBotField(bot.id, 'timeframe', v)}
                        sx={{ flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButton-root': { px: 1, py: 0.25, fontSize: '0.65rem', borderRadius: '4px !important', border: '1px solid rgba(255,255,255,0.12) !important' } }}
                      >
                        {TIMEFRAMES.map(tf => (
                          <Tooltip key={tf} title={TF_STYLE[tf].label} placement="top">
                            <ToggleButton value={tf} sx={{ color: cfg.timeframe === tf ? TF_STYLE[tf].color : 'text.secondary', bgcolor: cfg.timeframe === tf ? TF_STYLE[tf].color + '22' : 'transparent' }}>
                              {tf}
                            </ToggleButton>
                          </Tooltip>
                        ))}
                      </ToggleButtonGroup>
                    </Box>

                    {/* Ticker selector */}
                    <TextField
                      select
                      size="small"
                      label="Instrument"
                      value={cfg.ticker}
                      onChange={(e) => setBotField(bot.id, 'ticker', e.target.value)}
                      fullWidth
                      sx={{ '& .MuiSelect-select': { fontSize: '0.8rem' } }}
                    >
                      {tickerList.map(t => (
                        <MenuItem key={t.value} value={t.value} sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    {/* Active TF badge */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={tfMeta.label} size="small" sx={{ bgcolor: tfMeta.color + '22', color: tfMeta.color, fontWeight: 'bold', fontSize: '0.65rem' }} />
                      <Chip label={cfg.ticker} size="small" sx={{ bgcolor: assetColor + '22', color: assetColor, fontWeight: 'bold', fontSize: '0.65rem', fontFamily: 'monospace' }} />
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                    {/* Auto-Trading */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.03)', p: 1.5, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={16} color="#3b82f6" />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Auto-Trading</Typography>
                      </Box>
                      <Switch
                        size="small"
                        checked={!!bot.auto_trade_enabled}
                        onChange={() => toggleAutoTrade(bot.id, !!bot.auto_trade_enabled, bot.name)}
                      />
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                      <Button
                        fullWidth
                        variant={bot.is_subscribed ? 'outlined' : 'contained'}
                        color={bot.is_subscribed ? 'secondary' : 'primary'}
                        onClick={() => toggleSubscription(bot.id, bot.name)}
                        startIcon={bot.is_subscribed ? <Check size={14} /> : <Plus size={14} />}
                        size="small"
                      >
                        {bot.is_subscribed ? 'Subscribed' : 'Subscribe'}
                      </Button>

                      <Tooltip title="Get live signal for this config">
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          onClick={() => handleGetSignal(bot)}
                          startIcon={<RefreshCw size={14} />}
                        >
                          Signal
                        </Button>
                      </Tooltip>

                      <Tooltip title="Run backtest with this config">
                        <Button
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={() => openBacktest(bot)}
                          startIcon={<Play size={14} />}
                        >
                          BT
                        </Button>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* ── Live Signal Stream Modal ── */}
      <Dialog open={signalsOpen} onClose={() => setSignalsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Radio color="#10b981" />
          Live Bot Signal Stream
        </DialogTitle>
        <DialogContent dividers>
          {/* Global stream filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              select size="small" label="Asset Class" value={streamAsset}
              onChange={e => { setStreamAsset(e.target.value); setStreamTicker(ASSET_CLASS_TICKERS[e.target.value]?.[0]?.value || 'SPY'); }}
              sx={{ minWidth: 140 }}
            >
              {ASSET_CLASSES.map(ac => <MenuItem key={ac} value={ac}>{ac}</MenuItem>)}
            </TextField>
            <TextField
              select size="small" label="Instrument" value={streamTicker}
              onChange={e => setStreamTicker(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {(ASSET_CLASS_TICKERS[streamAsset] || []).map(t => <MenuItem key={t.value} value={t.value} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.label}</MenuItem>)}
            </TextField>
            <TextField
              select size="small" label="Timeframe" value={streamTf}
              onChange={e => setStreamTf(e.target.value)}
              sx={{ minWidth: 110 }}
            >
              {TIMEFRAMES.map(tf => <MenuItem key={tf} value={tf}>{TF_STYLE[tf].label}</MenuItem>)}
            </TextField>
            <Button
              variant="contained" size="small"
              startIcon={streamLoading ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
              onClick={() => fetchSignals(streamTicker, streamTf, streamAsset)}
              disabled={streamLoading}
            >
              Refresh
            </Button>
          </Box>

          {signals.length === 0 ? (
            <Typography color="text.secondary">No live signals active. Subscribe to a bot and click Refresh.</Typography>
          ) : (
            <Grid container spacing={2}>
              {signals.map((sig, idx) => {
                const tfColor = TF_STYLE[sig.timeframe]?.color || '#3b82f6';
                const acColor = ASSET_CLASS_COLORS[sig.asset_class] || '#3b82f6';
                return (
                  <Grid size={12} key={idx}>
                    <Card sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: `1px solid ${sig.direction === 'BUY' ? '#10b98133' : '#ef444433'}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {sig.bot_name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip label={sig.ticker} size="small" sx={{ bgcolor: acColor + '22', color: acColor, fontFamily: 'monospace', fontWeight: 'bold' }} />
                          <Chip label={sig.timeframe} size="small" sx={{ bgcolor: tfColor + '22', color: tfColor, fontWeight: 'bold' }} />
                          <Chip label={sig.direction} size="small" color={sig.direction === 'BUY' ? 'success' : 'error'} />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                        {sig.reason}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Typography variant="caption">Entry: <b>{sig.entry_price}</b></Typography>
                        <Typography variant="caption" color="error.light">SL: <b>{sig.stop_loss}</b></Typography>
                        <Typography variant="caption" color="success.light">TP: <b>{sig.take_profit}</b></Typography>
                        <Typography variant="caption" color="primary.light">Conf: <b>{sig.confidence_pct}%</b></Typography>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignalsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Backtest Sandbox Modal ── */}
      <Dialog open={backtestOpen} onClose={() => setBacktestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp color="#3b82f6" />
          Backtest: {selectedBot?.name}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          <TextField select label="Asset Class" value={backtestAsset}
            onChange={e => { setBacktestAsset(e.target.value); setBacktestTicker(ASSET_CLASS_TICKERS[e.target.value]?.[0]?.value || 'SPY'); }}
            fullWidth size="small"
          >
            {ASSET_CLASSES.map(ac => <MenuItem key={ac} value={ac}>{ac}</MenuItem>)}
          </TextField>

          <TextField select label="Instrument / Symbol" value={backtestTicker}
            onChange={e => setBacktestTicker(e.target.value)}
            fullWidth size="small"
          >
            {(ASSET_CLASS_TICKERS[backtestAsset] || []).map(t => (
              <MenuItem key={t.value} value={t.value} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.label}</MenuItem>
            ))}
          </TextField>

          <TextField select label="Timeframe" value={backtestTf}
            onChange={e => setBacktestTf(e.target.value)}
            fullWidth size="small"
          >
            {TIMEFRAMES.map(tf => <MenuItem key={tf} value={tf}>{TF_STYLE[tf].label}</MenuItem>)}
          </TextField>

          <TextField select label="Backtest Period" value={backtestPeriod}
            onChange={e => setBacktestPeriod(Number(e.target.value))}
            fullWidth size="small"
          >
            <MenuItem value={7}>7 Days</MenuItem>
            <MenuItem value={30}>30 Days</MenuItem>
            <MenuItem value={90}>90 Days</MenuItem>
            <MenuItem value={180}>180 Days (6 Months)</MenuItem>
            <MenuItem value={365}>365 Days (1 Year)</MenuItem>
            <MenuItem value={730}>730 Days (2 Years)</MenuItem>
          </TextField>

          <TextField
            label="Risk per Trade (%)" type="number" value={backtestRisk} size="small"
            slotProps={{ htmlInput: { min: 0.1, max: 10, step: 0.1 } }}
            onChange={e => setBacktestRisk(Number(e.target.value))}
            fullWidth
          />

          <Button
            variant="contained" color="primary" onClick={handleRunBacktest}
            disabled={backtesting}
            startIcon={backtesting ? <CircularProgress size={16} /> : <Play size={16} />}
          >
            {backtesting ? 'Running Simulation…' : 'Execute Backtest'}
          </Button>

          {backtestResult && (
            <Card sx={{ p: 2.5, bgcolor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, color: '#3b82f6' }}>
                Backtest Results — {backtestResult.ticker} · {backtestResult.timeframe}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                {backtestResult.performance.total_trades_placed} trades over {backtestResult.period_days} days
                &nbsp;·&nbsp; {backtestResult.performance.winning_trades}W / {backtestResult.performance.losing_trades}L
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Total Return',   value: `+${backtestResult.performance.total_return_pct}%`, color: '#10b981' },
                  { label: 'Win Rate',       value: `${backtestResult.performance.win_rate_pct}%`,     color: 'text.primary' },
                  { label: 'Profit Factor',  value: `${backtestResult.performance.profit_factor}x`,    color: 'text.primary' },
                  { label: 'Max Drawdown',   value: `-${backtestResult.performance.max_drawdown_pct}%`, color: '#ef4444' },
                  { label: 'Final Balance',  value: `$${backtestResult.performance.final_balance.toLocaleString()}`, color: '#3b82f6' },
                ].map(item => (
                  <Grid size={6} key={item.label}>
                    <Typography variant="body2" color="text.secondary">{item.label}:</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: item.color }}>{item.value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBacktestOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
