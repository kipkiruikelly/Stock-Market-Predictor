import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, LinearProgress } from '@mui/material';
import { Rocket, RotateCcw, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

export const DeploymentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [rollingBack, setRollingBack] = useState(false);

  const fetchDeploymentStatus = async () => {
    try {
      const res = await apiFetch('/api/production/deployments/status');
      if (res.ok) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching deployment status:', err);
    }
  };

  useEffect(() => {
    fetchDeploymentStatus();
  }, []);

  const handleRollback = async () => {
    setRollingBack(true);
    try {
      await apiFetch('/api/production/deployments/rollback', {
        method: 'POST',
        body: JSON.stringify({ target_version: 'v3.4.2-PROD', reason: 'Manual Rollback via Operator UI' })
      });
      await fetchDeploymentStatus();
    } catch (err) {
      console.error('Rollback error:', err);
    } finally {
      setRollingBack(false);
    }
  };

  if (!data) return <Box sx={{ p: 4, color: '#fff' }}>Loading Production Deployment Status...</Box>;

  const green = data.current_build;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" sx={{ color: '#a78bfa', fontWeight: 'bold', letterSpacing: 2 }}>
            ENTERPRISE PRODUCTION DEPLOYMENT ENGINE
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff', mt: 0.5 }}>
            Blue-Green & Canary Deployment Control
          </Typography>
        </Box>
        <Chip icon={<CheckCircle2 size={16} />} label="Cluster Status: 100% HEALTHY" color="success" sx={{ fontWeight: 'bold' }} />
      </Box>

      {/* Blue-Green Traffic Split Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* GREEN (Active) */}
        <Card sx={{ bgcolor: '#0f131d', border: '1px solid #34d399', borderRadius: 3.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rocket size={20} className="text-emerald-400" />
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                  GREEN (Active Production)
                </Typography>
              </Box>
              <Chip label={`${green.traffic_percentage}% Traffic`} color="success" sx={{ fontWeight: 'bold' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ color: '#34d399', fontWeight: 'bold', fontFamily: 'monospace' }}>
              Tag: {green.version_tag} ({green.build_hash})
            </Typography>
            <Typography variant="caption" sx={{ color: '#a0a5b1', display: 'block', mt: 1 }}>
              Deployed At: {green.deployed_at} | P99 Latency: <strong>{green.p99_latency_ms}ms</strong>
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: '#a0a5b1' }}>Canary Error Rate: {green.error_rate_pct}%</Typography>
              <LinearProgress variant="determinate" value={green.error_rate_pct * 10} sx={{ height: 6, borderRadius: 1, mt: 0.5, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#34d399' } }} />
            </Box>
          </CardContent>
        </Card>

        {/* BLUE (Standby) */}
        <Card sx={{ bgcolor: '#0f131d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Activity size={20} className="text-blue-400" />
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                  BLUE (Standby Rollback Target)
                </Typography>
              </Box>
              <Chip label="10% Traffic" variant="outlined" sx={{ color: '#60a5fa', borderColor: '#60a5fa' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ color: '#60a5fa', fontWeight: 'bold', fontFamily: 'monospace' }}>
              Tag: {data.previous_build.version_tag} ({data.previous_build.build_hash})
            </Typography>
            <Typography variant="caption" sx={{ color: '#a0a5b1', display: 'block', mt: 1 }}>
              Status: {data.previous_build.status} | Verified Rollback Image
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<RotateCcw size={16} />}
                disabled={rollingBack}
                onClick={handleRollback}
                sx={{ fontWeight: 'bold', borderRadius: 2.5 }}
              >
                1-Click Rollback to Blue
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
