import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Chip } from '@mui/material';
import { apiFetch } from '../utils/api';

interface EarningsEvent {
  date: string;
  ticker: string;
  eps_estimate: number | null;
  reported_eps: number | null;
  days: number;
}

export const CalendarDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [macroEvents, setMacroEvents] = useState<any[]>([]);
  const tvContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [earnRes, macroRes] = await Promise.all([
          apiFetch('/api/calendar/earnings'),
          apiFetch('/api/market/events')
        ]);
        if (earnRes.ok && earnRes.events) {
          setEvents(earnRes.events);
        }
        if (macroRes.ok && macroRes.events) {
          setMacroEvents(macroRes.events);
        }
      } catch (err) {
        console.error('Failed to load calendars data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Inject TradingView Economic Calendar
  useEffect(() => {
    if (tvContainer.current) {
      tvContainer.current.innerHTML = '';
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "colorTheme": "dark",
        "isTransparent": true,
        "width": "100%",
        "height": "600",
        "locale": "en",
        "importanceFilter": "-1,0,1",
        "currencyFilter": "USD"
      });
      tvContainer.current.appendChild(script);
    }
  }, []);

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const renderDateBadge = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return (
      <Box sx={{ 
        minWidth: 64, 
        textAlign: 'center', 
        bgcolor: 'background.paper', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: 2, 
        p: 1 
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1.1, color: 'text.primary' }}>
          {d.getDate()}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'medium' }}>
          {MONTHS[d.getMonth()]}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 6 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Events Calendar
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Upcoming earnings reports and global macroeconomic releases.
        </Typography>
      </Box>

      {/* Grid */}
      <Grid container spacing={3}>
        {/* Earnings Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                📅 Earnings (Next 90 Days)
              </Typography>
            </Box>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={24} /></Box>
              ) : events.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No upcoming earnings reports found.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {events.map((e, idx) => (
                    <Box 
                      key={idx} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        flexWrap: 'wrap'
                      }}
                    >
                      {renderDateBadge(e.date)}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {e.ticker} Earnings Report
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Est: <strong style={{ color: '#ffffff' }}>{e.eps_estimate !== null ? `$${e.eps_estimate.toFixed(2)}` : '--'}</strong> · 
                          Act: <strong style={{ color: '#ffffff' }}>{e.reported_eps !== null ? `$${e.reported_eps.toFixed(2)}` : '--'}</strong>
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Earnings" size="small" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} />
                        <Chip 
                          label={e.days === 0 ? 'Today' : e.days === 1 ? 'Tomorrow' : `In ${e.days}d`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} 
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Economic Calendar Widget Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                🌎 Global Macro Release Events
              </Typography>
            </Box>
            <Box sx={{ p: 1, minHeight: 600 }} ref={tvContainer}>
              <div className="tradingview-widget-container__widget w-full h-full" style={{ height: '600px' }}></div>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Real-Time High-Impact Macro Timeline */}
      {macroEvents.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, letterSpacing: 1, textTransform: 'uppercase', color: 'primary.main' }}>
            🔥 Real-Time Event-Driven Market Intelligence & Volatility Feed
          </Typography>
          <Grid container spacing={2}>
            {macroEvents.map((evt, idx) => (
              <Grid size={{ xs: 12, md: 6 }} key={idx}>
                <Card sx={{ bgcolor: 'background.paper', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ p: 1.5, bgcolor: evt.impact === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: evt.impact === 'high' ? 'error.main' : 'warning.main', borderRadius: 2, fontWeight: 'bold', fontSize: '1.25rem' }}>
                      ⚡
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{evt.event_name}</Typography>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: evt.impact === 'high' ? '#ef4444' : '#f59e0b' }}>
                          {evt.impact?.toUpperCase()} IMPACT
                        </span>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Scheduled: <strong style={{ color: '#fff' }}>{evt.date}</strong> • Volatility Index: <strong style={{ color: '#fff' }}>{evt.historical_volatility_pct}%</strong>
                      </Typography>
                      <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 0.5, fontWeight: 'medium' }}>
                        Model Adjustment: {evt.confidence_adjustment_commentary}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};
