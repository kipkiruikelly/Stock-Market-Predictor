import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { 
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  CircularProgress, Chip, InputAdornment, LinearProgress, Paper
} from '@mui/material';
import { apiFetch } from '../utils/api';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface ScreenerRow {
  ticker: string;
  asset_class?: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  ai_score: number;
  alpha_signals: string[];
  lr_pred: number;
  confidence: number;
  rsi: number;
  macd_hist: number;
  atr: number;
  sparkline?: number[];
}

export const ScreenerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ScreenerRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controls
  const [interval, setIntervalVal] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'>('1d');
  const [assetClass, setAssetClass] = useState<'ALL' | 'STOCKS' | 'FOREX' | 'CRYPTO' | 'COMMODITIES' | 'INDICES'>('ALL');
  const [filterAction, setFilterAction] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchScreener = useCallback(async () => {
    try {
      const json = await apiFetch(`/api/screener?interval=${interval}&asset_class=${assetClass}`);
      if (json.ok && json.rows) {
        setData(json.rows);
      }
    } catch (err) {
      console.error('Failed to fetch screener data:', err);
    } finally {
      setLoading(false);
    }
  }, [interval, assetClass]);

  // Initial load + interval toggle
  useEffect(() => {
    setLoading(true);
    fetchScreener();
  }, [fetchScreener]);

  // Auto-refresh loop every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchScreener();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchScreener]);

  const handleRefresh = () => {
    setLoading(true);
    fetchScreener();
  };

  const handleTickerClick = (tickerSym: string) => {
    navigate(`/predict?ticker=${tickerSym}`);
  };

  // Filtered rows
  const filteredData = data.filter((row) => {
    const matchesSearch = row.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'ALL' || row.action === filterAction;
    return matchesSearch && matchesAction;
  });

  // Summary Metrics calculations
  const buyCount = data.filter(r => r.action === 'BUY').length;
  const sellCount = data.filter(r => r.action === 'SELL').length;
  const holdCount = data.filter(r => r.action === 'HOLD').length;
  const avgConf = data.length 
    ? data.reduce((sum, r) => sum + r.confidence, 0) / data.length 
    : 0;

  const getActionColor = (action: string) => {
    if (action === 'BUY') return 'success';
    if (action === 'SELL') return 'error';
    return 'default';
  };

  const getActionIcon = (action: string) => {
    if (action === 'BUY') return <TrendingUp size={14} />;
    if (action === 'SELL') return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 6 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.primary' }}>
            <Target color="#3b82f6" />
            Market Screener
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time Machine Learning signals across all covered tickers, sorted by confidence.
          </Typography>
        </Box>
        <Button variant="outlined" color="inherit" onClick={handleRefresh} disabled={loading} sx={{ fontWeight: 'bold' }}>
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>BUY SIGNALS</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {loading ? '—' : buyCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>SELL SIGNALS</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {loading ? '—' : sellCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>HOLD</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                {loading ? '—' : holdCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>AVG CONFIDENCE</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {loading ? '—' : `${avgConf.toFixed(1)}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      {/* Controls Bar: Asset Class & Timeframe Selectors */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Asset Class Filter Tabs */}
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
          {(['ALL', 'STOCKS', 'FOREX', 'CRYPTO', 'COMMODITIES', 'INDICES'] as const).map(ac => (
            <Button
              key={ac}
              size="small"
              variant={assetClass === ac ? 'contained' : 'outlined'}
              color={assetClass === ac ? 'primary' : 'inherit'}
              onClick={() => setAssetClass(ac)}
              sx={{ fontWeight: 'bold', textTransform: 'capitalize', px: 2, whiteSpace: 'nowrap' }}
            >
              {ac === 'ALL' ? 'All Assets' : ac === 'STOCKS' ? 'Stocks' : ac === 'FOREX' ? 'Forex' : ac === 'CRYPTO' ? 'Crypto' : ac === 'COMMODITIES' ? 'Commodities' : 'Indices'}
            </Button>
          ))}
        </Box>

        {/* Toolbar: Timeframe, Action Filter & Search */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyItems: 'center', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {/* Timeframe Segment */}
            <Paper sx={{ display: 'flex', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', p: 0.5, borderRadius: 2 }}>
              {(['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const).map(tf => (
                <Button 
                  key={tf}
                  size="small"
                  variant={interval === tf ? 'contained' : 'text'}
                  onClick={() => setIntervalVal(tf)}
                  sx={{ fontWeight: 'bold', px: 1.5, py: 0.5, minWidth: 40 }}
                >
                  {tf.toUpperCase()}
                </Button>
              ))}
            </Paper>

            {/* Action Filters */}
            <Box sx={{ display: 'flex', gap: 0.5, bgcolor: 'rgba(255,255,255,0.02)', p: 0.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              {(['ALL', 'BUY', 'SELL'] as const).map(action => (
                <Button 
                  key={action}
                  size="small"
                  variant={filterAction === action ? 'contained' : 'text'}
                  color={filterAction === action ? 'primary' : 'inherit'}
                  onClick={() => setFilterAction(action)}
                  sx={{ fontWeight: 'bold', px: 2, py: 0.5 }}
                >
                  {action === 'ALL' ? 'All Signals' : action}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Search */}
          <TextField 
            size="small"
            placeholder="Search Ticker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ width: { xs: '100%', sm: 200 } }}
          />
        </Box>
      </Box>

      {/* Main Signal Grid Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
              <CircularProgress size={28} />
              <Typography color="text.secondary" variant="body2">Loading signals...</Typography>
            </Box>
          ) : filteredData.length === 0 ? (
            <Box sx={{ py: 6, textClassName: 'center', textAlign: 'center', color: 'text.secondary' }}>
              No signals match the current filter.
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Ticker</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Asset Class</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Chart</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Signal</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', textAlign: 'right' }}>Price</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', textAlign: 'right' }}>Predicted Close</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', textAlign: 'right' }}>Confidence</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', textAlign: 'right' }}>RSI (14)</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', textAlign: 'right' }}>MACD Hist</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', textAlign: 'center' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((row) => {
                    const isUp = row.lr_pred > row.price;
                    const chgPct = row.price ? ((row.lr_pred - row.price) / row.price * 100) : 0;
                    return (
                      <TableRow key={row.ticker} hover sx={{ '&:last-child td': { border: 0 } }}>
                        {/* Ticker Link */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Button 
                            onClick={() => handleTickerClick(row.ticker)}
                            sx={{ 
                              p: 0, 
                              minWidth: 0, 
                              fontWeight: 'bold', 
                              textTransform: 'none', 
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' }
                            }}
                          >
                            {row.ticker}
                          </Button>
                        </TableCell>

                        {/* Asset Class Badge */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip 
                            label={row.asset_class || 'STOCKS'} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontSize: '0.7rem', fontWeight: 'bold', height: 20 }}
                          />
                        </TableCell>

                        {/* Sparkline Chart */}
                        <TableCell sx={{ width: 120, p: 0 }}>
                          {row.sparkline && row.sparkline.length > 0 ? (
                            <Box sx={{ height: 40, width: '100%', pt: 0.5 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={row.sparkline.map((v, i) => ({ value: v, index: i }))}>
                                  <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={row.action === 'BUY' ? '#10b981' : row.action === 'SELL' ? '#f43f5e' : '#8b5cf6'} 
                                    strokeWidth={2} 
                                    dot={false} 
                                    isAnimationActive={false} 
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">No Data</Typography>
                          )}
                        </TableCell>

                        {/* Signal Badge */}
                        <TableCell>
                          <Chip 
                            icon={getActionIcon(row.action)}
                            label={row.action}
                            color={getActionColor(row.action) as 'success' | 'error' | 'default'}
                            size="small"
                            sx={{ fontWeight: 'bold', borderRadius: 1 }}
                          />
                        </TableCell>

                        {/* Current Price */}
                        <TableCell sx={{ textAlign: 'right', fontWeight: 'medium' }}>
                          ${row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </TableCell>

                        {/* Predicted Close */}
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Box sx={{ display: 'inline' }}>
                            ${row.lr_pred.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </Box>
                          <Box sx={{ 
                            display: 'inline', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold', 
                            color: isUp ? 'success.main' : 'error.main', 
                            ml: 0.5 
                          }}>
                            ({isUp ? '+' : ''}{chgPct.toFixed(2)}%)
                          </Box>
                        </TableCell>

                        {/* Confidence Progress */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {row.confidence.toFixed(1)}%
                            </Typography>
                            <Box sx={{ width: 60 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={row.confidence}
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3, 
                                  bgcolor: 'rgba(255,255,255,0.05)',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: row.action === 'BUY' ? 'success.main' : row.action === 'SELL' ? 'error.main' : 'text.secondary'
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>

                        {/* RSI */}
                        <TableCell sx={{ 
                          textAlign: 'right', 
                          fontWeight: 'medium',
                          color: row.rsi >= 70 ? 'error.main' : row.rsi <= 30 ? 'success.main' : 'text.primary'
                        }}>
                          {row.rsi.toFixed(1)}
                        </TableCell>

                        {/* MACD Hist */}
                        <TableCell sx={{ 
                          textAlign: 'right', 
                          fontWeight: 'medium',
                          color: row.macd_hist >= 0 ? 'success.main' : 'error.main'
                        }}>
                          {row.macd_hist > 0 ? '+' : ''}{row.macd_hist.toFixed(4)}
                        </TableCell>

                        {/* Analyze Action */}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => handleTickerClick(row.ticker)}
                            sx={{ fontWeight: 'bold', textTransform: 'none', py: 0.2 }}
                          >
                            Analyze
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
