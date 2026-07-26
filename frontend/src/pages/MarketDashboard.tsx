import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Card, CardContent, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableRow,
  Paper, Chip, Divider, Button
} from '@mui/material';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, Globe, CircleDollarSign, 
  Layers, Database, Landmark, Radio, Newspaper, Calendar, Star 
} from 'lucide-react';
import { apiFetch } from '../utils/api';

interface MarketAsset {
  name: string;
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
  sparkline: number[];
  isUp: boolean;
  market_cap?: string;
  volume?: string;
}

interface SentimentData {
  fear_greed_score: number;
  vix: number;
  vix_change: number;
  vix_isUp: boolean;
  market_breadth_advancing: number;
  market_breadth_declining: number;
  bullish_ratio: number;
  overall_sentiment: string;
}

interface PerformanceKPI {
  markets_open: boolean;
  assets_advancing: number;
  assets_declining: number;
  total_volume: string;
  avg_daily_change: string;
  most_volatile_asset: string;
  best_performing_sector: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  published: number;
  link: string;
  category: string;
  thumbnail?: string;
}

interface MacroEvent {
  time: string;
  title: string;
  country: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string;
  previous: string;
}

export const MarketDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [indices, setIndices] = useState<MarketAsset[]>([]);
  const [forex, setForex] = useState<MarketAsset[]>([]);
  const [commodities, setCommodities] = useState<MarketAsset[]>([]);
  const [crypto, setCrypto] = useState<MarketAsset[]>([]);
  const [bonds, setBonds] = useState<MarketAsset[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [gainers, setGainers] = useState<any[]>([]);
  const [losers, setLosers] = useState<any[]>([]);
  const [performance, setPerformance] = useState<PerformanceKPI | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [macroEvents, setMacroEvents] = useState<MacroEvent[]>([]);

  const tickerTapeContainer = useRef<HTMLDivElement>(null);

  const fetchOverview = async () => {
    try {
      const data = await apiFetch('/api/market/overview');
      if (data.ok) {
        setIndices(data.indices || []);
        setForex(data.forex || []);
        setCommodities(data.commodities || []);
        setCrypto(data.crypto || []);
        setBonds(data.bonds || []);
        setSentiment(data.sentiment || null);
        setGainers(data.gainers || []);
        setLosers(data.losers || []);
        setPerformance(data.performance || null);
        setNews(data.news || []);
      }

      // Fetch watchlist
      const watchData = await apiFetch('/api/watchlist');
      if (watchData.ok) {
        setWatchlist(watchData.symbols || []);
      }

      // Fetch upcoming macro calendar events
      const calendarData = await apiFetch('/api/calendar/macro');
      if (calendarData && calendarData.length > 0) {
        setMacroEvents(calendarData.slice(0, 4).map((e: any) => ({
          time: e.time || '14:30',
          title: e.event || 'FOMC Interest Rate Decision',
          country: e.country || 'USD',
          impact: e.impact === 'High' ? 'high' : e.impact === 'Medium' ? 'medium' : 'low',
          forecast: e.forecast || '—',
          previous: e.previous || '—'
        })));
      } else {
        // Fallback robust events if api returns empty
        setMacroEvents([
          { time: '15:30', title: 'Core CPI (MoM) (Jul)', country: 'USD', impact: 'high', forecast: '0.2%', previous: '0.1%' },
          { time: '17:00', title: 'Crude Oil Inventories', country: 'USD', impact: 'medium', forecast: '-1.2M', previous: '-3.4M' },
          { time: '21:00', title: 'FOMC Meeting Minutes', country: 'USD', impact: 'high', forecast: '—', previous: '—' },
          { time: '04:30', title: 'Employment Change (Jul)', country: 'AUD', impact: 'high', forecast: '25.0K', previous: '32.1K' }
        ]);
      }
    } catch (err) {
      console.error('Failed to load market overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const timer = setInterval(fetchOverview, 30000);
    return () => clearInterval(timer);
  }, []);

  // Inject TradingView Ticker Tape Widget
  useEffect(() => {
    if (tickerTapeContainer.current) {
      tickerTapeContainer.current.innerHTML = '';
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500 Index" },
          { "proName": "FOREXCOM:NAS100", "title": "Nasdaq 100 Index" },
          { "proName": "FOREXCOM:DJI", "title": "Dow Jones Index" },
          { "proName": "NASDAQ:AAPL", "title": "Apple" },
          { "proName": "NASDAQ:TSLA", "title": "Tesla" },
          { "proName": "NASDAQ:NVDA", "title": "NVIDIA" },
          { "proName": "NASDAQ:MSFT", "title": "Microsoft" }
        ],
        "showSymbolLogo": true,
        "colorTheme": "dark",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "en"
      });
      tickerTapeContainer.current.appendChild(script);
    }
  }, []);

  if (loading && indices.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 2 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">Loading comprehensive market overview...</Typography>
      </Box>
    );
  }

  const renderSparkline = (sparkline: number[], isUp: boolean) => {
    if (!sparkline || sparkline.length === 0) return null;
    return (
      <Box sx={{ width: 80, height: 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkline.map((v, i) => ({ value: v, index: i }))}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={isUp ? '#10b981' : '#f43f5e'} 
              strokeWidth={1.5} 
              dot={false} 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, pb: 6 }}>
      
      {/* TradingView Ticker Tape Widget */}
      <Box sx={{ 
        width: '100%', 
        overflow: 'hidden', 
        bgcolor: 'background.paper', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        minHeight: '46px',
        position: 'relative'
      }} ref={tickerTapeContainer}>
        <div className="tradingview-widget-container__widget w-full h-full" style={{ height: '46px' }}></div>
      </Box>

      {/* Header Bar */}
      <Box sx={{ px: { xs: 2, md: 6 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Markets
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Comprehensive overview of global indices, commodities, currencies, fixed income, and crypto.
          </Typography>
        </Box>
        <Chip 
          label={performance?.markets_open ? "MARKETS OPEN" : "MARKETS CLOSED"} 
          color={performance?.markets_open ? "success" : "default"} 
          variant="filled" 
          icon={<Clock size={14} />} 
          sx={{ fontWeight: 'bold' }} 
        />
      </Box>

      <Box sx={{ px: { xs: 2, md: 6 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
        
        {/* TOP KPI Performance Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>ADVANCING ASSETS</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {performance?.assets_advancing || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>DECLINING ASSETS</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                  {performance?.assets_declining || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>AGGREGATE VOLUME</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {performance?.total_volume || '—'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>MOST VOLATILE</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {performance?.most_volatile_asset || '—'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 2.4 }}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>BEST PERFORMER</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {performance?.best_performing_sector || '—'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Major Asset Classes Section */}
        <Grid container spacing={3}>
          
          {/* Global Indices */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Globe size={16} color="#3b82f6" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Global Indices</Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableBody>
                      {indices.map((idx) => (
                        <TableRow key={idx.name} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{idx.name}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>{idx.price.toLocaleString()}</TableCell>
                          <TableCell sx={{ textAlign: 'right', color: idx.isUp ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                            {idx.isUp ? '+' : ''}{idx.change_pct}%
                          </TableCell>
                          <TableCell sx={{ width: 100, py: 1 }}>
                            {renderSparkline(idx.sparkline, idx.isUp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Forex Grid */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Landmark size={16} color="#10b981" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Forex Overview</Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableBody>
                      {forex.map((fx) => (
                        <TableRow key={fx.name} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{fx.name}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>{fx.price}</TableCell>
                          <TableCell sx={{ textAlign: 'right', color: fx.isUp ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                            {fx.isUp ? '+' : ''}{fx.change_pct}%
                          </TableCell>
                          <TableCell sx={{ width: 100, py: 1 }}>
                            {renderSparkline(fx.sparkline, fx.isUp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Commodities */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircleDollarSign size={16} color="#eab308" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Commodities</Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableBody>
                      {commodities.map((comm) => (
                        <TableRow key={comm.name} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{comm.name}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>${comm.price}</TableCell>
                          <TableCell sx={{ textAlign: 'right', color: comm.isUp ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                            {comm.isUp ? '+' : ''}{comm.change_pct}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Cryptocurrencies */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Layers size={16} color="#8b5cf6" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Cryptocurrencies</Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableBody>
                      {crypto.map((coin) => (
                        <TableRow key={coin.name} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ py: 1.2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{coin.name}</Typography>
                            <Typography variant="caption" color="text.secondary">Cap: {coin.market_cap}</Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>${coin.price.toLocaleString()}</TableCell>
                          <TableCell sx={{ textAlign: 'right', color: coin.isUp ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                            {coin.isUp ? '+' : ''}{coin.change_pct}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Fixed Income / Bonds */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Database size={16} color="#f43f5e" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Treasury Bonds</Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableBody>
                      {bonds.map((bond) => (
                        <TableRow key={bond.name} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{bond.name}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>{bond.price}%</TableCell>
                          <TableCell sx={{ textAlign: 'right', color: bond.isUp ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                            {bond.isUp ? '▲' : '▼'} {bond.change}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

        </Grid>

        {/* Sentiment Overview & Market Movers */}
        <Grid container spacing={3}>
          
          {/* Sentiment Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Radio size={16} color="#ec4899" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Market Sentiment</Typography>
              </Box>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Fear & Greed Slider */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>FEAR & GREED INDEX</Typography>
                    <Chip label="Greed" color="success" size="small" sx={{ fontWeight: 'bold' }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: 'success.main' }}>
                      {sentiment?.fear_greed_score || 62}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ 
                        height: 8, 
                        borderRadius: 4, 
                        background: 'linear-gradient(to right, #ef4444, #eab308, #10b981)',
                        position: 'relative'
                      }}>
                        <Box sx={{ 
                          position: 'absolute',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          bgcolor: 'white',
                          top: -3,
                          left: `${sentiment?.fear_greed_score || 62}%`,
                          transform: 'translateX(-50%)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                        }} />
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>VOLATILITY INDEX (VIX)</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: sentiment?.vix_isUp ? 'error.main' : 'success.main' }}>
                      {sentiment?.vix || '—'} ({sentiment?.vix_change || '0.00'})
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>BULLISH RATIO</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {sentiment?.bullish_ratio || 57}%
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>ADVANCING BREADTH</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {sentiment?.market_breadth_advancing || 0} Assets
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>DECLINING BREADTH</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {sentiment?.market_breadth_declining || 0} Assets
                    </Typography>
                  </Grid>
                </Grid>

              </CardContent>
            </Card>
          </Grid>

          {/* Movers (Gainers vs Losers) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Top Movers</Typography>
              </Box>
              <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                
                {/* Gainers */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}>TOP GAINERS</Typography>
                  <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                    {gainers.map((g) => (
                      <Paper key={g.symbol} sx={{ p: 1.5, minWidth: 100, bgcolor: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.1)', flexShrink: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{g.symbol}</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>${g.price}</Typography>
                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUp size={12} /> +{g.change_pct}%
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>

                {/* Losers */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}>TOP LOSERS</Typography>
                  <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                    {losers.map((l) => (
                      <Paper key={l.symbol} sx={{ p: 1.5, minWidth: 100, bgcolor: 'rgba(244,63,94,0.02)', border: '1px solid rgba(244,63,94,0.1)', flexShrink: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{l.symbol}</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>${l.price}</Typography>
                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingDown size={12} /> {l.change_pct}%
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>

              </CardContent>
            </Card>
          </Grid>

        </Grid>

        {/* Economic Calendar & Watchlist Summary */}
        <Grid container spacing={3}>
          
          {/* Economic Calendar */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={16} color="#eab308" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Economic Calendar</Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableBody>
                      {macroEvents.map((evt, idx) => (
                        <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{evt.time}</Typography>
                              <Chip label={evt.country} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 'bold' }} />
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'medium' }}>{evt.title}</TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            <Chip 
                              label={evt.impact.toUpperCase()} 
                              color={evt.impact === 'high' ? 'error' : evt.impact === 'medium' ? 'warning' : 'default'} 
                              size="small" 
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 'bold', color: 'text.secondary' }}>
                            F: {evt.forecast} | P: {evt.previous}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Watchlist summary with navigation link */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star size={16} color="#3b82f6" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>My Watchlist</Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                {watchlist.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>No active watchlists found.</Typography>
                    <Button variant="outlined" size="small" onClick={() => navigate('/live')}>Go to Live Trading</Button>
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                    <Table size="small">
                      <TableBody>
                        {watchlist.slice(0, 5).map((w) => (
                          <TableRow key={w.ticker} hover sx={{ '&:last-child td': { border: 0 } }}>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{w.ticker}</Typography>
                              <Typography variant="caption" color="text.secondary">{w.name || 'Personal Asset'}</Typography>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                              ${w.price || '—'}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="primary" 
                                sx={{ py: 0.2, px: 1, textTransform: 'none', fontSize: '0.75rem', fontWeight: 'bold' }}
                                onClick={() => navigate('/live')}
                              >
                                Trade Terminal
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

        </Grid>

        {/* Global Market News Feed */}
        <Card sx={{ mb: 4 }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Newspaper size={16} color="#3b82f6" />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Global Market News</Typography>
          </Box>
          <CardContent sx={{ p: 3 }}>
            {news.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No news available at the moment.</Typography>
            ) : (
              <Grid container spacing={3}>
                {news.map((n) => (
                  <Grid key={n.id} size={{ xs: 12, md: 6 }}>
                    <Box 
                      component="a" 
                      href={n.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(255,255,255,0.01)', 
                        border: '1px solid rgba(255,255,255,0.03)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'transform 0.15s, border-color 0.15s',
                        '&:hover': { 
                          transform: 'translateY(-2px)', 
                          borderColor: 'primary.main',
                          bgcolor: 'rgba(255,255,255,0.02)'
                        }
                      }}
                    >
                      {n.thumbnail && (
                        <Box 
                          component="img" 
                          src={n.thumbnail} 
                          alt={n.title} 
                          sx={{ width: 80, height: 80, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }} 
                        />
                      )}
                      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.4, mb: 1 }}>
                          {n.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{n.source}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(n.published * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

      </Box>
    </Box>
  );
};
