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

          {/* ── Autonomous Pre-Execution Risk Gate Supervisor Widget ── */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={12}>
              <Card sx={{ bgcolor: 'background.paper', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: 'rgba(139, 92, 246, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🛡️ Autonomous Risk Supervisor pre-execution gate
                  </Typography>
                  <span className="text-[10px] px-3 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full font-bold uppercase">Active Protection</span>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">Enter order details to execute institutional risk sweep:</Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <input 
                            id="order-ticker"
                            type="text" 
                            placeholder="Ticker (e.g. AAPL)" 
                            defaultValue="AAPL"
                            className="bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur w-1/2"
                          />
                          <input 
                            id="order-qty"
                            type="number" 
                            placeholder="Quantity" 
                            defaultValue="100"
                            className="bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur w-1/2"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <select 
                            id="order-dir"
                            className="bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur w-1/2"
                          >
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                          </select>
                          <input 
                            id="order-lev"
                            type="number" 
                            placeholder="Leverage (e.g. 1)" 
                            defaultValue="1"
                            className="bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs text-nexus-white focus:outline-none focus:border-nexus-pur w-1/2"
                          />
                        </Box>
                        <button 
                          onClick={async () => {
                            const tk = (document.getElementById('order-ticker') as HTMLInputElement).value || 'AAPL';
                            const qt = Number((document.getElementById('order-qty') as HTMLInputElement).value) || 100;
                            const dir = (document.getElementById('order-dir') as HTMLSelectElement).value || 'BUY';
                            const lev = Number((document.getElementById('order-lev') as HTMLInputElement).value) || 1;
                            
                            try {
                              const res = await axios.post('/api/trading/supervisor/check', {
                                ticker: tk.toUpperCase(),
                                quantity: qt,
                                direction: dir,
                                leverage: lev
                              });
                              if (res.data && res.data.ok) {
                                const auth = res.data.authorization;
                                if (auth.status === 'APPROVED') {
                                  alert(`✅ Risk check Passed!\n\nStatus: APPROVED\nRemaining Margin: $${auth.metrics_evaluated?.available_leverage_margin?.toLocaleString()}`);
                                } else if (auth.status === 'REJECTED') {
                                  alert(`❌ Risk check Rejected!\n\nReason: ${auth.rejection_reason}\nSector limit: ${auth.risk_metrics?.sector_concentration_warning ? 'WARNING' : 'OK'}`);
                                } else {
                                  alert(`⚠️ Warning: ${auth.rejection_reason}`);
                                }
                              }
                            } catch (err) {
                              alert("Failed to submit pre-execution security check.");
                            }
                          }}
                          className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Execute Safety Risk-Gate Sweep
                        </button>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 7 }}>
                      <Box sx={{ p: 2, height: '100%', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary' }}>🛡️ Multi-Dimensional Compliance Gates Evaluated:</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>1. Portfolio Leverage Guard limits</span>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>ACTIVE (Max 3.0x)</span>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>2. Sector Concentration warning limits</span>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>ACTIVE (Max 40% of funds)</span>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>3. Correlated Asset concentration barriers</span>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>ACTIVE (Max 3 highly correlated positions)</span>
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 'auto', fontStyle: 'italic' }}>
                          *System actively prevents over-leverage or risk-limit breeches prior to order routing.
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : null}
    </Box>
  );
};
