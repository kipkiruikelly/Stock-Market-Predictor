import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Chip } from '@mui/material';
import { ArrowUpward, ArrowDownward, BarChart as BarChartIcon, Timeline, PieChart as PieChartIcon } from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  ok: boolean;
  is_demo: boolean;
  overview: {
    balance: number;
    equity: number;
    buying_power: number;
    unrealized_pnl: number;
    realized_pnl: number;
  };
  performance: {
    net_profit: number;
    win_rate: number;
    total_trades: number;
    profit_factor: number;
  };
  risk: {
    max_drawdown: number;
    sharpe_ratio: number;
    volatility: number;
  };
  charts: {
    equity_curve: { date: string; equity: number }[];
    daily_pnl: { date: string; pnl: number }[];
    asset_allocation: { name: string; value: number }[];
  };
}

const COLORS = ['#8b5cf6', '#4a90e2', '#10b981', '#f59e0b', '#f43f5e'];

export const TradingDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/portfolio/analytics');
        if (res.data && res.data.ok) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch portfolio analytics", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            Portfolio Performance
            {data?.is_demo && <Chip label="Demo Data" size="small" color="secondary" variant="outlined" />}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Advanced analytics, risk metrics, and historical account performance.
          </Typography>
        </Box>
      </Box>

      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <Grid container spacing={3}>
            {/* Balance */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h3" color="text.secondary" gutterBottom>Account Balance</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{formatCurrency(data.overview.balance)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Equity */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h3" color="text.secondary" gutterBottom>Total Equity</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {formatCurrency(data.overview.equity)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: data.overview.unrealized_pnl >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                      {data.overview.unrealized_pnl >= 0 ? <ArrowUpward fontSize="inherit"/> : <ArrowDownward fontSize="inherit"/>}
                      {formatCurrency(Math.abs(data.overview.unrealized_pnl))}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {/* Realized PNL */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h3" color="text.secondary" gutterBottom>Realized P/L</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: data.overview.realized_pnl >= 0 ? 'success.main' : 'error.main' }}>
                    {data.overview.realized_pnl >= 0 ? '+' : '-'}{formatCurrency(Math.abs(data.overview.realized_pnl))}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Win Rate */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h3" color="text.secondary" gutterBottom>Win Rate</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{data.performance.win_rate}%</Typography>
                  <Typography variant="body2" color="text.secondary">{data.performance.total_trades} total trades</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Row 1 */}
          <Grid container spacing={3}>
            {/* Equity Curve */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ height: 400 }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timeline fontSize="small" /> Equity Curve
                  </Typography>
                  <Box sx={{ flexGrow: 1, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.charts.equity_curve}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#888" tick={{fontSize: 12}} />
                        <YAxis stroke="#888" tick={{fontSize: 12}} domain={['auto', 'auto']} tickFormatter={(val) => `$${val}`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1a1f2e', borderColor: '#333' }}
                          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Equity']}
                        />
                        <Line type="monotone" dataKey="equity" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Risk Metrics */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Risk & Exposure</Typography>
                  
                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Buying Power</Typography>
                      <Typography variant="h5">{formatCurrency(data.overview.buying_power)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Profit Factor</Typography>
                      <Typography variant="h5">{data.performance.profit_factor}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Max Drawdown</Typography>
                      <Typography variant="h5" color="error.main">{data.risk.max_drawdown}%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Sharpe Ratio</Typography>
                      <Typography variant="h5">{data.risk.sharpe_ratio}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Row 2 */}
          <Grid container spacing={3}>
            {/* Daily PNL */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ height: 350 }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BarChartIcon fontSize="small" /> Daily Profit & Loss
                  </Typography>
                  <Box sx={{ flexGrow: 1, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.charts.daily_pnl}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" stroke="#888" tick={{fontSize: 12}} />
                        <YAxis stroke="#888" tick={{fontSize: 12}} tickFormatter={(val) => `$${val}`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1a1f2e', borderColor: '#333' }}
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'P/L']}
                        />
                        <Bar 
                          dataKey="pnl" 
                          radius={[4, 4, 0, 0]}
                        >
                          {data.charts.daily_pnl.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={_entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Asset Allocation */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: 350 }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PieChartIcon fontSize="small" /> Asset Allocation
                  </Typography>
                  <Box sx={{ flexGrow: 1, mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.charts.asset_allocation}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.charts.asset_allocation.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1a1f2e', borderColor: '#333', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : null}
    </Box>
  );
};
