import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, TextField, Button, Grid2 as Grid, MenuItem, Select, Modal, IconButton, Chip } from '@mui/material';
import { Zap, Settings, X } from 'lucide-react';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';

import { OrderTicket } from '../components/OrderTicket';
import { ChartWidget } from '../components/ChartWidget';
import { WatchlistWidget } from '../components/WatchlistWidget';
import { PortfolioTable } from '../components/PortfolioTable';
import { PendingOrdersTable } from '../components/PendingOrdersTable';

export const LiveDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [trading, setTrading] = useState(false);
  const [mode, setMode] = useState<'paper' | 'metaapi' | 'bridge'>('paper');
  const [account, setAccount] = useState<any>(null);

  // Settings Modal State
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Connection Fields
  const [mapiToken, setMapiToken] = useState('');
  const [mapiAccountId, setMapiAccountId] = useState('');
  const [accNum, setAccNum] = useState('');
  const [accPass, setAccPass] = useState('');
  const [accServer, setAccServer] = useState('');
  const [bridgeHost, setBridgeHost] = useState('localhost');
  const [bridgePort, setBridgePort] = useState('18812');

  // Algo Settings Fields
  const [algoSymbol, setAlgoSymbol] = useState('AAPL');
  const [algoTimeframe, setAlgoTimeframe] = useState('M5');
  const [algoRisk, setAlgoRisk] = useState('1.0');
  const [algoInterval, setAlgoInterval] = useState('300');
  const [algoModel, setAlgoModel] = useState<'ensemble' | 'rf' | 'xgb' | 'lr' | 'ict' | 'technical'>('ensemble');
  const [startingAlgo, setStartingAlgo] = useState(false);
  const [stoppingAlgo, setStoppingAlgo] = useState(false);

  // Terminal State
  const [activeSymbol, setActiveSymbol] = useState('AAPL');

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiFetch('/mt5/status');
      if (data) {
        setConnected(!!data.connected);
        setTrading(!!data.trading);
        if (data.account && Object.keys(data.account).length) setAccount(data.account);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleModeChange = (newMode: 'paper' | 'metaapi' | 'bridge') => {
    setMode(newMode);
    if (newMode === 'paper') setAlgoSymbol('AAPL');
    else setAlgoSymbol('EURUSD');
  };

  const handleConnect = async () => {
    let payload: any = {};
    if (mode === 'metaapi') {
      if (!mapiToken || !mapiAccountId) { toast.error('Token and Account ID required'); return; }
      payload = { metaapi_token: mapiToken, metaapi_account_id: mapiAccountId, account: 0, password: '', server: '', host: 'localhost', port: 18812 };
    } else if (mode === 'paper') {
      payload = { account: 0, password: '', server: '', host: 'localhost', port: 18812 };
    } else {
      if (!accNum || !accPass || !accServer) { toast.error('Account credentials required'); return; }
      payload = { account: parseInt(accNum), password: accPass, server: accServer, host: bridgeHost || 'localhost', port: parseInt(bridgePort || '18812') };
    }

    setLoading(true);
    try {
      const res = await apiFetch('/mt5/connect', { method: 'POST', body: payload });
      if (res.ok) {
        toast.success(`Connected in ${mode} mode!`);
        fetchStatus();
      } else { toast.error(res.error || 'Connection failed'); }
    } catch (err) { toast.error('Failed to connect to MT5 bridge'); }
    finally { setLoading(false); }
  };

  const handleDisconnect = async () => {
    try {
      const res = await apiFetch('/mt5/disconnect', { method: 'POST' });
      if (res.ok) {
        toast.success('Disconnected');
        setConnected(false);
        setAccount(null);
        fetchStatus();
      }
    } catch (err) { toast.error('Disconnect failed'); }
  };

  const handleStartAlgo = async () => {
    setStartingAlgo(true);
    try {
      const res = await apiFetch('/mt5/start', {
        method: 'POST',
        body: { symbol: algoSymbol.toUpperCase(), timeframe: algoTimeframe, risk_pct: parseFloat(algoRisk), interval: parseInt(algoInterval), use_ml: true, algorithm: algoModel }
      });
      if (res.ok) {
        toast.success('Algorithmic engine started successfully');
        setTrading(true);
      } else { toast.error(res.error || 'Could not start engine'); }
    } catch (err) { toast.error('Failed to start algo'); }
    finally { setStartingAlgo(false); }
  };

  const handleStopAlgo = async () => {
    setStoppingAlgo(true);
    try {
      const res = await apiFetch('/mt5/stop', { method: 'POST' });
      if (res.ok) {
        toast.success('Algorithmic engine stopped');
        setTrading(false);
      }
    } catch (err) { toast.error('Failed to stop algo'); }
    finally { setStoppingAlgo(false); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: 2, p: 2 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Zap color="#3b82f6" /> Trading Terminal
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip label={connected ? `Connected (${mode})` : 'Disconnected'} color={connected ? 'success' : 'default'} variant={connected ? 'filled' : 'outlined'} />
          <Button variant="outlined" startIcon={<Settings size={18} />} onClick={() => setSettingsOpen(true)}>Settings & Algo</Button>
        </Box>
      </Box>

      {/* Main Terminal Layout */}
      <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Side: Chart and Positions */}
        <Grid size={{ xs: 12, lg: 9 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
          {/* Chart Widget */}
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <ChartWidget symbol={activeSymbol} />
          </Box>
          {/* Positions Table (Fixed Height at bottom) */}
          <Box sx={{ height: '300px', overflowY: 'auto' }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <PortfolioTable />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <PendingOrdersTable />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Right Side: Execution and Watchlist */}
        <Grid size={{ xs: 12, lg: 3 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
          <OrderTicket />
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <WatchlistWidget />
          </Box>
        </Grid>
      </Grid>

      {/* Settings & Algo Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ width: 600, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Connection & Algo Settings</Typography>
            <IconButton onClick={() => setSettingsOpen(false)}><X /></IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Broker Connection */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>1. Broker Connection</Typography>
              <Select value={mode} onChange={(e) => handleModeChange(e.target.value as any)} fullWidth size="small" sx={{ mb: 2 }}>
                <MenuItem value="paper">Paper Trading (Local Simulation)</MenuItem>
                <MenuItem value="metaapi">MetaApi (Cloud MT5/MT4)</MenuItem>
                <MenuItem value="bridge">Python MT5 Bridge (Windows Local)</MenuItem>
              </Select>
              
              {mode === 'metaapi' && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}><TextField label="MetaApi Token" value={mapiToken} onChange={(e) => setMapiToken(e.target.value)} fullWidth size="small" type="password" /></Grid>
                  <Grid size={{ xs: 12 }}><TextField label="MetaApi Account ID" value={mapiAccountId} onChange={(e) => setMapiAccountId(e.target.value)} fullWidth size="small" /></Grid>
                </Grid>
              )}
              {mode === 'bridge' && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}><TextField label="Account Number" value={accNum} onChange={(e) => setAccNum(e.target.value)} fullWidth size="small" /></Grid>
                  <Grid size={{ xs: 6 }}><TextField label="Password" value={accPass} onChange={(e) => setAccPass(e.target.value)} fullWidth size="small" type="password" /></Grid>
                  <Grid size={{ xs: 12 }}><TextField label="Server" value={accServer} onChange={(e) => setAccServer(e.target.value)} fullWidth size="small" /></Grid>
                </Grid>
              )}

              <Box sx={{ mt: 2 }}>
                {connected ? (
                  <Button variant="outlined" color="error" fullWidth onClick={handleDisconnect}>Disconnect</Button>
                ) : (
                  <Button variant="contained" color="primary" fullWidth onClick={handleConnect} disabled={loading}>Connect</Button>
                )}
              </Box>
            </Box>

            {/* AI Auto-Trading Engine */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>2. Autonomous AI Engine</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField label="Symbol" value={algoSymbol} onChange={(e) => setAlgoSymbol(e.target.value)} fullWidth size="small" />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Select value={algoTimeframe} onChange={(e) => setAlgoTimeframe(e.target.value)} fullWidth size="small">
                    <MenuItem value="M1">1 Minute</MenuItem>
                    <MenuItem value="M5">5 Minutes</MenuItem>
                    <MenuItem value="H1">1 Hour</MenuItem>
                  </Select>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Select value={algoModel} onChange={(e) => setAlgoModel(e.target.value as any)} fullWidth size="small">
                    <MenuItem value="ensemble">Deep Ensemble (ML + Rules)</MenuItem>
                    <MenuItem value="xgb">XGBoost Pure Directional</MenuItem>
                    <MenuItem value="ict">ICT Market Structure Only</MenuItem>
                  </Select>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                {!trading ? (
                  <Button variant="contained" color="success" fullWidth onClick={handleStartAlgo} disabled={!connected || startingAlgo} startIcon={<Play size={18} />}>Start Algo</Button>
                ) : (
                  <Button variant="contained" color="error" fullWidth onClick={handleStopAlgo} disabled={stoppingAlgo} startIcon={<Square size={18} />}>Stop Algo</Button>
                )}
              </Box>
            </Box>
          </Box>
        </Card>
      </Modal>
    </Box>
  );
};
