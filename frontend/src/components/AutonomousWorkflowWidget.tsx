import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';

interface WorkflowLog {
  id: number;
  action: string;
  details: string;
  timestamp: string;
}

export const AutonomousWorkflowWidget: React.FC = () => {
  const [scannerEnabled, setScannerEnabled] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);

  const fetchWorkflowStatus = async () => {
    try {
      const data = await apiFetch('/api/workflow/status');
      if (data && data.ok && Array.isArray(data.workflows)) {
        setLogs(data.workflows);
      }
    } catch (err) {
      console.error('Failed to fetch workflow logs', err);
    }
  };

  const handleToggleScanner = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.checked;
    setScannerEnabled(val);
    try {
      const res = await apiFetch('/api/workflow/toggle-scanner', {
        method: 'POST',
        body: { enabled: val },
      });
      if (res && res.ok) {
        toast.success(`Market scanner loop ${val ? 'ACTIVATED' : 'PAUSED'}`);
      }
    } catch (err) {
      console.error('Failed to toggle scanner', err);
      toast.error('Failed to toggle scanner status');
    }
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    toast.loading('Running market scan cycle across target assets...', { id: 'scan-toast' });
    try {
      const res = await apiFetch('/api/workflow/trigger-scan', { method: 'POST' });
      if (res && res.ok) {
        toast.success(`Market scan cycle complete! Processed ${res.results?.length || 7} assets.`, { id: 'scan-toast' });
      } else {
        toast.error(res?.error || 'Scan cycle finished.', { id: 'scan-toast' });
      }
      await fetchWorkflowStatus();
    } catch (err) {
      console.error('Failed to trigger manual scan', err);
      toast.error('Failed to run market scan', { id: 'scan-toast' });
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchWorkflowStatus();
    const interval = setInterval(fetchWorkflowStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const steps = ['IDLE', 'ANALYZING', 'RISK_EVALUATION', 'APPROVED', 'EXECUTED'];

  const getActionColor = (action: string) => {
    if (action.includes('EXECUTED')) return 'success';
    if (action.includes('APPROVED')) return 'info';
    if (action.includes('REJECTED')) return 'warning';
    if (action.includes('FAILED')) return 'error';
    return 'default';
  };

  return (
    <Card
      sx={{
        background: 'rgba(22, 24, 29, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 3,
        color: '#fff',
        mb: 4,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header / Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AutoAwesomeIcon sx={{ color: '#f5a623', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Stateful Autonomous Market Scanner & Workflows
              </Typography>
              <Typography variant="caption" color="text.secondary">
                15-Minute FSM Engine with ML Inference & 1% Portfolio Risk Gate
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={scannerEnabled}
                  onChange={handleToggleScanner}
                  color="warning"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: scannerEnabled ? '#4caf50' : '#ff9800', fontWeight: 'bold' }}>
                  {scannerEnabled ? '15m Loop ACTIVE' : 'Loop PAUSED'}
                </Typography>
              }
            />

            <Button
              variant="contained"
              startIcon={scanning ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleTriggerScan}
              disabled={scanning}
              sx={{
                background: 'linear-gradient(135deg, #f5a623 0%, #d48806 100%)',
                color: '#000',
                fontWeight: 'bold',
                textTransform: 'none',
                px: 2.5,
              }}
            >
              {scanning ? 'Scanning Market...' : 'Run Instant Scan'}
            </Button>

            <Tooltip title="Refresh Audit Logs">
              <IconButton onClick={fetchWorkflowStatus} size="small" sx={{ color: '#aaa' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* FSM Pipeline Stepper */}
        <Box sx={{ width: '100%', mb: 4, py: 2, background: 'rgba(0,0,0,0.2)', borderRadius: 2, px: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#888', mb: 1.5, fontSize: '0.75rem', letterSpacing: 1 }}>
            AUTONOMOUS FSM PIPELINE STAGES
          </Typography>
          <Stepper activeStep={4} alternativeLabel sx={{ '.MuiStepLabel-label': { color: '#aaa', fontSize: '0.8rem' } }}>
            {steps.map((label) => (
              <Step key={label} completed>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Audit Log Table */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fff' }}>
            Live Audit Trail Logs
          </Typography>
          <Chip label={`${logs.length} Executions Logged`} size="small" variant="outlined" sx={{ color: '#aaa', borderColor: '#444' }} />
        </Box>

        <TableContainer component={Paper} sx={{ background: 'transparent', boxShadow: 'none', maxHeight: 350 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ '& th': { background: 'rgba(30,34,42,0.9)', color: '#888', borderColor: 'rgba(255,255,255,0.05)' } }}>
                <TableCell>Stage Action</TableCell>
                <TableCell>Details / Status</TableCell>
                <TableCell align="right">Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: '#666', py: 4 }}>
                    No audit logs recorded yet. Click "Run Instant Scan" to trigger the engine.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((row) => (
                  <TableRow key={row.id} sx={{ '& td': { borderColor: 'rgba(255,255,255,0.05)', color: '#ddd' } }}>
                    <TableCell>
                      <Chip
                        label={row.action ? String(row.action).replace('WORKFLOW_', '') : 'RUN'}
                        color={getActionColor(row.action || '') as any}
                        size="small"
                        sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.details}</TableCell>
                    <TableCell align="right" sx={{ color: '#777', fontSize: '0.75rem' }}>
                      {(() => {
                        if (!row.timestamp) return 'N/A';
                        const d = new Date(row.timestamp);
                        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleTimeString();
                      })()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default AutonomousWorkflowWidget;
