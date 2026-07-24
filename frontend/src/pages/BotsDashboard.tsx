import React, { useState, useEffect } from 'react';
import { Cpu, Check, Plus, AlertCircle, Play, Radio, Activity, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  Box, Typography, Card, CardContent, Button, Grid, CircularProgress, Chip, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Switch
} from '@mui/material';
import { apiFetch } from '../utils/api';

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
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  confidence_pct: number;
  timeframe: string;
  reason: string;
  timestamp: string;
}

interface BacktestResult {
  bot_slug: string;
  ticker: string;
  period_days: number;
  performance: {
    initial_balance: number;
    final_balance: number;
    total_return_pct: number;
    win_rate_pct: number;
    profit_factor: number;
    max_drawdown_pct: number;
    total_trades_placed: number;
  };
  equity_curve: { date: string; equity: number }[];
}

export const BotsDashboard: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [signalsOpen, setSignalsOpen] = useState(false);
  const [backtestOpen, setBacktestOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);

  // Backtest Parameters
  const [backtestTicker, setBacktestTicker] = useState('SPY');
  const [backtestPeriod, setBacktestPeriod] = useState(180);
  const [backtestRisk, setBacktestRisk] = useState(1.0);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [backtesting, setBacktesting] = useState(false);

  const fetchBots = async () => {
    try {
      const json = await apiFetch('/api/bots');
      if (json.ok) {
        const botsList = json.bots || (json.data && json.data.bots) || [];
        const mapped = botsList.map((b: any) => ({
          ...b,
          is_subscribed: b.is_subscribed !== undefined ? b.is_subscribed : b.subscribed
        }));
        setBots(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch bots:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignals = async () => {
    try {
      const json = await apiFetch('/api/bots/signals');
      if (json.ok) {
        setSignals(json.signals || []);
      }
    } catch (err) {
      console.error('Failed to fetch bot signals:', err);
    }
  };

  useEffect(() => {
    fetchBots();
    fetchSignals();
  }, []);

  const toggleSubscription = async (botId: number, botName: string) => {
    try {
      const form = new FormData();
      form.append('bot_id', botId.toString());
      const data = await apiFetch('/api/bots/subscribe', {
        method: 'POST',
        body: form
      });
      
      if (data.ok) {
        const isSubscribed = data.subscribed !== undefined ? data.subscribed : (data.data && data.data.is_subscribed);
        setBots(prev => prev.map(b => 
          b.id === botId ? { ...b, is_subscribed: isSubscribed } : b
        ));
        toast.success(isSubscribed ? `Subscribed to ${botName}` : `Unsubscribed from ${botName}`);
      } else {
        toast.error(data.error || 'Failed to toggle subscription');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const toggleAutoTrade = async (botId: number, currentStatus: boolean, botName: string) => {
    try {
      const form = new FormData();
      form.append('bot_id', botId.toString());
      form.append('auto_trade_enabled', (!currentStatus).toString());
      form.append('auto_trade_mode', 'paper');
      form.append('max_risk_pct', '1.0');

      const data = await apiFetch('/api/bots/auto-trade', {
        method: 'POST',
        body: form
      });

      if (data.ok) {
        setBots(prev => prev.map(b => 
          b.id === botId ? { ...b, auto_trade_enabled: !currentStatus } : b
        ));
        toast.success(!currentStatus ? `Auto-Trading Enabled for ${botName}` : `Auto-Trading Disabled for ${botName}`);
      }
    } catch (err) {
      toast.error('Failed to configure auto-trading');
    }
  };

  const handleRunBacktest = async () => {
    if (!selectedBot) return;
    setBacktesting(true);
    try {
      const form = new FormData();
      form.append('bot_slug', selectedBot.slug || 'ict_core_m5');
      form.append('ticker', backtestTicker);
      form.append('period_days', backtestPeriod.toString());
      form.append('risk_pct', backtestRisk.toString());

      const data = await apiFetch('/api/bots/backtest', {
        method: 'POST',
        body: form
      });

      if (data.ok) {
        setBacktestResult(data.backtest);
        toast.success(`Backtest completed for ${selectedBot.name}`);
      } else {
        toast.error(data.error || 'Backtest failed');
      }
    } catch (err) {
      toast.error('Backtest error');
    } finally {
      setBacktesting(false);
    }
  };

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 6 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.5rem', color: 'text.primary' }}>
            <Cpu color="#3b82f6" />
            AI Robots & Automated Strategies
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Subscribe to automated trading strategies powered by proprietary machine learning models.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Radio size={16} />}
            onClick={() => { fetchSignals(); setSignalsOpen(true); }}
            sx={{ fontWeight: 'bold' }}
          >
            Live Signal Stream ({signals.length})
          </Button>
        </Box>
      </Box>

      {/* Grid */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid size={12}>
            <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography color="text.secondary">Loading AI models...</Typography>
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
          bots.map((bot) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={bot.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
                  }
                }}
              >
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {bot.name}
                    </Typography>
                    <Chip 
                      label={bot.asset_class} 
                      color="success" 
                      size="small" 
                      sx={{ fontWeight: 'bold', borderRadius: 1 }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flex: 1, lineHeight: 1.6 }}>
                    {bot.description}
                  </Typography>

                  {/* Auto-Trading Switch */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.03)', p: 1.5, borderRadius: 2, mb: 2 }}>
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

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto' }}>
                    <Button
                      fullWidth
                      variant={bot.is_subscribed ? "outlined" : "contained"}
                      color={bot.is_subscribed ? "secondary" : "primary"}
                      onClick={() => toggleSubscription(bot.id, bot.name)}
                      startIcon={bot.is_subscribed ? <Check size={16} /> : <Plus size={16} />}
                    >
                      {bot.is_subscribed ? 'Subscribed' : 'Subscribe'}
                    </Button>

                    <Button
                      variant="outlined"
                      color="info"
                      onClick={() => { setSelectedBot(bot); setBacktestResult(null); setBacktestOpen(true); }}
                      startIcon={<Play size={16} />}
                    >
                      Backtest
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Live Signal Stream Modal */}
      <Dialog open={signalsOpen} onClose={() => setSignalsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Radio color="#10b981" />
          Live Bot Signals Feed
        </DialogTitle>
        <DialogContent dividers>
          {signals.length === 0 ? (
            <Typography color="text.secondary">No live signals active.</Typography>
          ) : (
            <Grid container spacing={2}>
              {signals.map((sig, idx) => (
                <Grid size={12} key={idx}>
                  <Card sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {sig.bot_name} ({sig.ticker})
                      </Typography>
                      <Chip label={sig.direction} color={sig.direction === 'BUY' ? 'success' : 'error'} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {sig.reason}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, fontSize: '0.85rem' }}>
                      <Typography variant="caption">Entry: <b>{sig.entry_price}</b></Typography>
                      <Typography variant="caption">SL: <b>{sig.stop_loss}</b></Typography>
                      <Typography variant="caption">TP: <b>{sig.take_profit}</b></Typography>
                      <Typography variant="caption">Confidence: <b>{sig.confidence_pct}%</b></Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignalsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Backtest Sandbox Modal */}
      <Dialog open={backtestOpen} onClose={() => setBacktestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp color="#3b82f6" />
          Backtest Sandbox: {selectedBot?.name}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Symbol / Ticker"
            value={backtestTicker}
            onChange={(e) => setBacktestTicker(e.target.value)}
            fullWidth
          >
            <MenuItem value="SPY">SPY (S&P 500 ETF)</MenuItem>
            <MenuItem value="QQQ">QQQ (Nasdaq ETF)</MenuItem>
            <MenuItem value="AAPL">AAPL (Apple Inc.)</MenuItem>
            <MenuItem value="NVDA">NVDA (NVIDIA Corp.)</MenuItem>
            <MenuItem value="EURUSD">EURUSD (Forex Pair)</MenuItem>
            <MenuItem value="BTC">BTC (Bitcoin)</MenuItem>
          </TextField>

          <TextField
            select
            label="Backtest Period"
            value={backtestPeriod}
            onChange={(e) => setBacktestPeriod(Number(e.target.value))}
            fullWidth
          >
            <MenuItem value={30}>30 Days</MenuItem>
            <MenuItem value={90}>90 Days</MenuItem>
            <MenuItem value={180}>180 Days (6 Months)</MenuItem>
            <MenuItem value={365}>365 Days (1 Year)</MenuItem>
          </TextField>

          <TextField
            label="Risk per Trade (%)"
            type="number"
            value={backtestRisk}
            onChange={(e) => setBacktestRisk(Number(e.target.value))}
            fullWidth
          />

          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRunBacktest} 
            disabled={backtesting}
            startIcon={backtesting ? <CircularProgress size={16} /> : <Play size={16} />}
          >
            {backtesting ? 'Running Simulation...' : 'Execute Backtest'}
          </Button>

          {backtestResult && (
            <Card sx={{ p: 2.5, bgcolor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', mt: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#3b82f6' }}>
                Backtest Performance Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Total Return:</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                    +{backtestResult.performance.total_return_pct}%
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Win Rate:</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {backtestResult.performance.win_rate_pct}%
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Profit Factor:</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {backtestResult.performance.profit_factor}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Max Drawdown:</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#ef4444' }}>
                    -{backtestResult.performance.max_drawdown_pct}%
                  </Typography>
                </Grid>
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
