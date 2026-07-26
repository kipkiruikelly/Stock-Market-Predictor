import { useEffect, useRef, useState, useMemo } from 'react';
import { Box, Button, ButtonGroup, Typography, CircularProgress, FormControlLabel, Checkbox, useTheme, Tooltip, Chip } from '@mui/material';
import { Maximize2, Minimize2, ShieldAlert, Wifi, WifiOff, Activity } from 'lucide-react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, createSeriesMarkers, LineStyle, ColorType, CrosshairMode } from 'lightweight-charts';
import { calculateSMA, calculateEMA } from '../utils/indicators';
import { apiFetch } from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';

export const ChartWidget = ({ symbol = "SPY" }: { symbol?: string }) => {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeframe, setTimeframe] = useState<string>('1d'); // default timeframe
  const [showIndicators, setShowIndicators] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showSMA, setShowSMA] = useState(false);
  const [showTrades, setShowTrades] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPrediction, setCurrentPrediction] = useState<any>(null);
  const [runningTrade, setRunningTrade] = useState<any>(null);
  
  const chartInstance = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const emaSeriesRef = useRef<any>(null);
  const smaSeriesRef = useRef<any>(null);
  const dataCache = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);

  const getIntervalSeconds = (intv: string) => {
    switch (intv) {
      case '1m': return 60;
      case '5m': return 300;
      case '15m': return 900;
      case '30m': return 1800;
      case '1h': return 3600;
      case '4h': return 14400;
      case '1d': return 86400;
      default: return 86400;
    }
  };

  // ── WebSocket for live chart streaming ──────────────────────────────────
  const cleanSymbol = useMemo(() => symbol.split(':').pop() || symbol, [symbol]);
  
  const wsUrl = useMemo(() => {
    const host = window.location.hostname || 'localhost';
    return `ws://${host}:8002/ws/candles/${cleanSymbol}?interval=${timeframe}`;
  }, [cleanSymbol, timeframe]);

  const handleLiveTick = (msg: any) => {
    const series = candleSeriesRef.current;
    if (!series) return;

    // Validate incoming data before touching the chart
    const candleTime = msg.candle_time;
    const price = msg.price;
    if (candleTime == null || price == null || typeof price !== 'number') return;

    try {
      const seriesData = series.data();
      if (!seriesData || seriesData.length === 0) return;

      const lastCandle = seriesData[seriesData.length - 1];

      if (lastCandle.time === candleTime) {
        // Update the current candle in-place — no full re-render
        series.update({
          time: candleTime,
          open: lastCandle.open,
          high: Math.max(lastCandle.high, price),
          low: Math.min(lastCandle.low, price),
          close: price,
        });
      } else if (candleTime > lastCandle.time) {
        // New candle period — append fresh candle
        series.update({
          time: candleTime,
          open: price,
          high: price,
          low: price,
          close: price,
        });
      }
      // If candleTime < lastCandle.time, it's a delayed tick — skip
    } catch {
      // Series data access may fail during chart transition; safe to ignore
    }
  };

  const handleWsMessage = (msg: any) => {
    switch (msg.type) {
      case 'init':
        // Initial history received — could be used as fallback or to pre-warm
        // but our REST fetch already loads the full data with predictions.
        // Store for reference if needed.
        break;
      case 'tick':
        handleLiveTick(msg);
        break;
      case 'candle_new_period':
        handleLiveTick(msg);
        break;
      default:
        break;
    }
  };

  const { connectionState } = useWebSocket({
    url: wsUrl,
    onMessage: handleWsMessage,
    reconnectBaseMs: 2000,
    reconnectMaxMs: 30000,
  });



  // Fetch and Render Chart Data
  useEffect(() => {
    const fetchAndRenderChart = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const cleanSymbol = symbol.split(':').pop() || symbol;
        const json = await apiFetch(`/api/market/history?symbol=${cleanSymbol}&interval=${timeframe}`);
        
        if (!json || !json.ok || !json.candles) {
          throw new Error(json?.error || 'Failed to load historical data');
        }

        dataCache.current = json;
        setCurrentPrediction(json.current_prediction);
        setRunningTrade(json.active_trade);

        if (!chartContainerRef.current) return;

        // Clean previous instances
        if (chartInstance.current) {
          try { chartInstance.current.remove(); } catch {}
          chartInstance.current = null;
          candleSeriesRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 500,
          layout: {
            background: { type: ColorType.Solid, color: '#0D1117' },
            textColor: '#E6EDF3',
          },
          grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.08)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.08)' },
          },
          rightPriceScale: {
            borderColor: '#8B949E',
            autoScale: true,
          },
          timeScale: {
            borderColor: '#8B949E',
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 12,
            barSpacing: 10,
          },
          crosshair: {
            mode: CrosshairMode.Magnet,
            vertLine: {
              color: 'rgba(255, 255, 255, 0.4)',
              width: 1,
              style: LineStyle.Dashed,
              labelBackgroundColor: '#7C4DFF',
            },
            horzLine: {
              color: 'rgba(255, 255, 255, 0.4)',
              width: 1,
              style: LineStyle.Dashed,
              labelBackgroundColor: '#7C4DFF',
            },
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          }
        }) as any;

        chartInstance.current = chart;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#00C853',
          downColor: '#FF5252',
          borderDownColor: '#FF5252',
          borderUpColor: '#00C853',
          wickDownColor: '#FF5252',
          wickUpColor: '#00C853',
        });

        candleSeriesRef.current = candlestickSeries;

        // Sort and load candles
        const sortedData = [...json.candles].sort((a: any, b: any) => a.time - b.time);
        const candlePoints = sortedData.map((c: any) => ({
          time: Math.floor(c.time / 1000), // convert to seconds
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        candlestickSeries.setData(candlePoints);

        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        });
        
        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        
        volumeSeriesRef.current = volumeSeries;

        const volumePoints = sortedData.map((c: any) => ({
          time: Math.floor(c.time / 1000),
          value: c.volume || 0,
          color: c.close >= c.open ? 'rgba(0, 200, 83, 0.5)' : 'rgba(255, 82, 82, 0.5)',
        }));
        
        volumeSeries.setData(volumePoints);

        // Indicators
        const emaSeries = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2 });
        emaSeriesRef.current = emaSeries;
        const smaSeries = chart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 2 });
        smaSeriesRef.current = smaSeries;

        // Apply initial markers, levels, and indicators
        applyMarkersAndLevels();

        // Fit content
        chart.timeScale().fitContent();

      } catch (err: any) {
        setErrorMsg(err.message || 'Error initializing custom chart');
      } finally {
        setLoading(false);
      }
    };

    fetchAndRenderChart();

    const handleResize = () => {
      if (chartInstance.current && chartContainerRef.current) {
        chartInstance.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        try { chartInstance.current.remove(); } catch {}
        chartInstance.current = null;
        candleSeriesRef.current = null;
      }
    };
  }, [symbol, timeframe, isDark]);

  // Re-apply markers and levels when options change
  useEffect(() => {
    applyMarkersAndLevels();
  }, [showIndicators, showTrades, showEMA, showSMA]);

  const applyMarkersAndLevels = () => {
    const json = dataCache.current;
    const series = candleSeriesRef.current;
    const chart = chartInstance.current;
    if (!json || !series || !chart) return;

    // 1. Clear previous horizontal price lines
    priceLinesRef.current.forEach((line: any) => {
      series.removePriceLine(line);
    });
    priceLinesRef.current = [];

    const markers: any[] = [];
    const sortedData = [...json.candles].sort((a: any, b: any) => a.time - b.time);
    const candlePoints = sortedData.map((c: any) => ({
      time: Math.floor(c.time / 1000),
      close: c.close,
    }));

    if (showEMA && emaSeriesRef.current) {
      emaSeriesRef.current.setData(calculateEMA(candlePoints, 20));
    } else if (emaSeriesRef.current) {
      emaSeriesRef.current.setData([]);
    }

    if (showSMA && smaSeriesRef.current) {
      smaSeriesRef.current.setData(calculateSMA(candlePoints, 50));
    } else if (smaSeriesRef.current) {
      smaSeriesRef.current.setData([]);
    }

    // 2. Loop candles to add historical markers (e.g. executions entry/exit)
    sortedData.forEach((c: any) => {
      const candleTime = Math.floor(c.time / 1000);

      // Trade executions historical markers
      if (showTrades && json.executions) {
        const matches = json.executions.filter((ex: any) => {
          const exTime = Math.floor(ex.time / 1000);
          if (timeframe === '1d') {
            return new Date(ex.time).toDateString() === new Date(c.time).toDateString();
          } else {
            const duration = getIntervalSeconds(timeframe);
            return exTime >= candleTime && exTime < candleTime + duration;
          }
        });

        matches.forEach((ex: any) => {
          markers.push({
            time: candleTime,
            position: ex.action === 'ENTRY' ? 'belowBar' : 'aboveBar',
            color: ex.type === 'BUY' ? '#10b981' : '#ef4444',
            shape: ex.type === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: `${ex.type} ${ex.action} @ ${ex.price}`,
          });
        });
      }
    });

    // 3. Draw active prediction / trade price levels
    if (showTrades) {
      // A. Next Prediction Levels
      if (json.current_prediction) {
        const isLong = json.current_prediction.side === 'LONG';
        const nextEntry = series.createPriceLine({
          price: json.current_prediction.entry_price,
          color: isLong ? '#00C853' : '#FF5252',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Next Entry: ${json.current_prediction.entry_price.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        });
        priceLinesRef.current.push(nextEntry);

        const nextSL = series.createPriceLine({
          price: json.current_prediction.stop_price,
          color: '#FF5252',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `Next SL: ${json.current_prediction.stop_price.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        });
        priceLinesRef.current.push(nextSL);

        const nextTP = series.createPriceLine({
          price: json.current_prediction.target_price,
          color: '#00C853',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `Next TP: ${json.current_prediction.target_price.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        });
        priceLinesRef.current.push(nextTP);
      }

      // B. Running Position Levels (Dotted lines, Green/Red/Blue theme)
      if (json.active_trade) {
        const isLong = json.active_trade.side === 'LONG';
        const runEntry = series.createPriceLine({
          price: json.active_trade.entry_price,
          color: isLong ? '#00C853' : '#FF5252',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `Entry: ${json.active_trade.entry_price.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        });
        priceLinesRef.current.push(runEntry);

        const runSL = series.createPriceLine({
          price: json.active_trade.stop_price,
          color: '#FF5252',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SL: ${json.active_trade.stop_price.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        });
        priceLinesRef.current.push(runSL);

        const runTP = series.createPriceLine({
          price: json.active_trade.target_price,
          color: '#00C853',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP: ${json.active_trade.target_price.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        });
        priceLinesRef.current.push(runTP);
      } else if (!json.current_prediction && json.last_closed_trade) {
        // Only draw closed trade exit levels if there is no next prediction or active trade
        const lastEntry = series.createPriceLine({
          price: json.last_closed_trade.entry_price,
          color: 'rgba(107, 114, 128, 0.4)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Last Entry: ${json.last_closed_trade.entry_price.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        });
        priceLinesRef.current.push(lastEntry);

        const lastExit = series.createPriceLine({
          price: json.last_closed_trade.exit_price,
          color: '#6b7280',
          lineWidth: 2,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `Last Exit: ${json.last_closed_trade.exit_price.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        });
        priceLinesRef.current.push(lastExit);
      }
    }

    // 4. Draw Current OB and FVG Zones (Solid and Dotted horizontal lines)
    if (showIndicators) {
      let latestBullOBPrice: number | null = null;
      let latestBearOBPrice: number | null = null;
      let latestBullFVGPrice: number | null = null;
      let latestBearFVGPrice: number | null = null;

      // Find latest levels starting from end of sorted candles array
      for (let i = sortedData.length - 1; i >= 0; i--) {
        const sc = sortedData[i];
        if (latestBullOBPrice === null && sc.bull_ob > 0) {
          latestBullOBPrice = sc.low;
        }
        if (latestBearOBPrice === null && sc.bear_ob > 0) {
          latestBearOBPrice = sc.high;
        }
        if (latestBullFVGPrice === null && sc.bull_fvg > 0) {
          latestBullFVGPrice = sc.low;
        }
        if (latestBearFVGPrice === null && sc.bear_fvg > 0) {
          latestBearFVGPrice = sc.high;
        }
      }

      if (latestBullOBPrice !== null) {
        const bullOBLine = series.createPriceLine({
          price: latestBullOBPrice,
          color: '#00C853',
          lineWidth: 3,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'Bullish OB',
        });
        priceLinesRef.current.push(bullOBLine);
      }

      if (latestBearOBPrice !== null) {
        const bearOBLine = series.createPriceLine({
          price: latestBearOBPrice,
          color: '#FF5252',
          lineWidth: 3,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'Bearish OB',
        });
        priceLinesRef.current.push(bearOBLine);
      }

      if (latestBullFVGPrice !== null) {
        const bullFVGLine = series.createPriceLine({
          price: latestBullFVGPrice,
          color: '#2979FF',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Bullish FVG',
        });
        priceLinesRef.current.push(bullFVGLine);
      }

      if (latestBearFVGPrice !== null) {
        const bearFVGLine = series.createPriceLine({
          price: latestBearFVGPrice,
          color: '#FF9800',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Bearish FVG',
        });
        priceLinesRef.current.push(bearFVGLine);
      }
    }

    // Sort markers chronologically
    markers.sort((a: any, b: any) => a.time - b.time);
    createSeriesMarkers(series, markers);
  };

  // Fullscreen management
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === widgetContainerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!widgetContainerRef.current) return;
    if (!document.fullscreenElement) {
      widgetContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <Box 
      ref={widgetContainerRef} 
      sx={{ 
        width: '100%', 
        height: isFullscreen ? '100vh' : 'calc(100vh - 280px)', 
        minHeight: isFullscreen ? '100vh' : '520px',
        position: 'relative',
        bgcolor: isDark ? '#16181d' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(99, 71, 246, 0.15)'
      }}
    >
      {/* Floating Action Bars */}
      <Box sx={{ 
        position: 'absolute', 
        top: 8, 
        left: 8, 
        zIndex: 50,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        alignItems: 'center',
        bgcolor: isDark ? 'rgba(22, 24, 29, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(99, 71, 246, 0.2)',
        borderRadius: 2,
        p: 1,
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(99, 71, 246, 0.08)'
      }}>
        {/* Timeframe Buttons */}
        <ButtonGroup variant="contained" size="small">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
            <Button
              key={tf}
              onClick={() => setTimeframe(tf)}
              sx={{
                bgcolor: timeframe === tf ? '#8b5cf6' : 'transparent',
                color: isDark ? '#fff' : '#0f0f1a',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                minWidth: '36px',
                border: 'none',
                '&:hover': { bgcolor: timeframe === tf ? '#7c3aed' : 'rgba(255, 255, 255, 0.08)' }
              }}
            >
              {tf}
            </Button>
          ))}
        </ButtonGroup>

        {/* Connection state indicator */}
        <Tooltip title={
          connectionState === 'connected' ? 'Live streaming active' :
          connectionState === 'connecting' ? 'Connecting to stream...' :
          connectionState === 'reconnecting' ? 'Reconnecting...' : 'Stream disconnected'
        }>
          <Chip
            icon={
              connectionState === 'connected' ? <Wifi size={12} /> :
              connectionState === 'disconnected' ? <WifiOff size={12} /> :
              <Activity size={12} />
            }
            label={
              connectionState === 'connected' ? 'LIVE' :
              connectionState === 'connecting' ? '...' :
              connectionState === 'reconnecting' ? 'RECON' : 'OFF'
            }
            size="small"
            sx={{
              height: 22,
              fontSize: '0.6rem',
              fontWeight: 700,
              bgcolor: connectionState === 'connected' ? 'rgba(16,185,129,0.15)' :
                       connectionState === 'disconnected' ? 'rgba(239,68,68,0.1)' :
                       'rgba(234,179,8,0.1)',
              color: connectionState === 'connected' ? '#10b981' :
                     connectionState === 'disconnected' ? '#ef4444' : '#fbbf24',
            }}
          />
        </Tooltip>

        {/* View Toggle Checkboxes */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox 
                size="small" 
                checked={showEMA} 
                onChange={(e) => setShowEMA(e.target.checked)}
                sx={{ color: '#2962FF', '&.Mui-checked': { color: '#2962FF' } }}
              />
            }
            label={<Typography sx={{ fontSize: '0.7rem', color: isDark ? '#fff' : '#0f0f1a', fontWeight: 600 }}>EMA 20</Typography>}
            sx={{ m: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox 
                size="small" 
                checked={showSMA} 
                onChange={(e) => setShowSMA(e.target.checked)}
                sx={{ color: '#FF6D00', '&.Mui-checked': { color: '#FF6D00' } }}
              />
            }
            label={<Typography sx={{ fontSize: '0.7rem', color: isDark ? '#fff' : '#0f0f1a', fontWeight: 600 }}>SMA 50</Typography>}
            sx={{ m: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox 
                size="small" 
                checked={showIndicators} 
                onChange={(e) => setShowIndicators(e.target.checked)}
                sx={{ color: '#8b5cf6', '&.Mui-checked': { color: '#8b5cf6' } }}
              />
            }
            label={<Typography sx={{ fontSize: '0.7rem', color: isDark ? '#fff' : '#0f0f1a', fontWeight: 600 }}>Current OB / FVG</Typography>}
            sx={{ m: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox 
                size="small" 
                checked={showTrades} 
                onChange={(e) => setShowTrades(e.target.checked)}
                sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }}
              />
            }
            label={<Typography sx={{ fontSize: '0.7rem', color: isDark ? '#fff' : '#0f0f1a', fontWeight: 600 }}>Predictions Overlay</Typography>}
            sx={{ m: 0 }}
          />
        </Box>
      </Box>

      {/* Fullscreen Button */}
      <Box sx={{ 
        position: 'absolute', 
        top: 14, 
        right: 8, 
        zIndex: 50, 
      }}>
        <Button
          variant="contained"
          size="small"
          onClick={toggleFullscreen}
          startIcon={isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          sx={{
            bgcolor: isDark ? 'rgba(22, 24, 29, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(99, 71, 246, 0.2)',
            color: isDark ? '#fff' : '#0f0f1a',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
            minWidth: 0,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#8b5cf6',
              borderColor: '#8b5cf6',
              color: '#fff'
            }
          }}
        >
          {isFullscreen ? "Exit" : "Fullscreen"}
        </Button>
      </Box>

      {/* Active Running & Next Predictions Card */}
      {showTrades && (currentPrediction || runningTrade) && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          maxHeight: '320px',
          overflowY: 'auto',
          minWidth: '240px'
        }}>
          {/* A. Next Prediction (Prioritized / Pending) */}
          {currentPrediction && (
            <Box sx={{
              bgcolor: isDark ? 'rgba(22, 24, 29, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(8px)',
              border: '2px solid #8b5cf6', // bold highlight for next prediction
              borderRadius: 2,
              p: 1.5,
              color: isDark ? '#fff' : '#0f0f1a',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#8b5cf6', display: 'block', mb: 0.5, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Next Prediction (Pending)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                  Direction: <span style={{
                    color: currentPrediction.side === 'LONG' ? '#10b981' : currentPrediction.side === 'SHORT' ? '#ef4444' : '#6b7280',
                    fontWeight: 800
                  }}>
                    {currentPrediction.side === 'LONG' ? 'BUY' : currentPrediction.side === 'SHORT' ? 'SELL' : 'HOLD'}
                  </span>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'space-between' }}>
                  Entry Price: <span>${currentPrediction.entry_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'space-between' }}>
                  Stop Loss (SL): <span style={{ color: '#ef4444', fontWeight: 'bold' }}>${currentPrediction.stop_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'space-between' }}>
                  Take Profit (TP): <span style={{ color: '#10b981', fontWeight: 'bold' }}>${currentPrediction.target_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </Typography>
                {currentPrediction.confidence && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'space-between', mt: 0.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,71,246,0.08)', pt: 0.5 }}>
                    Confidence: <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                      {(currentPrediction.confidence > 1 ? currentPrediction.confidence : currentPrediction.confidence * 100).toFixed(1)}%
                    </span>
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* B. Running Trade (Already Running) */}
          {runningTrade && (
            <Box sx={{
              bgcolor: isDark ? 'rgba(22, 24, 29, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(99, 71, 246, 0.18)',
              borderRadius: 2,
              p: 1.5,
              color: isDark ? '#fff' : '#0f0f1a',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#10b981', display: 'block', mb: 0.5, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Running Position (Active)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                  Direction: <span style={{ color: runningTrade.side === 'LONG' ? '#10b981' : '#ef4444', fontWeight: 800 }}>{runningTrade.side === 'LONG' ? 'BUY' : 'SELL'}</span>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'space-between' }}>
                  Entry Price: <span>${runningTrade.entry_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'space-between' }}>
                  Stop Loss (SL): <span style={{ color: '#ef4444', fontWeight: 'bold' }}>${runningTrade.stop_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'space-between' }}>
                  Take Profit (TP): <span style={{ color: '#10b981', fontWeight: 'bold' }}>${runningTrade.target_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Render Panel */}
      <Box 
        sx={{ 
          flex: 1, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {loading && (
          <CircularProgress sx={{ color: '#8b5cf6', position: 'absolute', zIndex: 10 }} />
        )}
        {errorMsg ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: 4, textAlign: 'center' }}>
            <ShieldAlert size={40} color="#ef4444" />
            <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600 }}>
              {errorMsg}
            </Typography>
          </Box>
        ) : (
          <Box 
            ref={chartContainerRef} 
            sx={{ width: '100%', height: '100%', minHeight: '480px' }} 
          />
        )}
      </Box>
    </Box>
  );
};