import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { ShieldCheck, Lock, AlertTriangle, Globe, Key } from 'lucide-react';
import { apiFetch } from '../utils/api';

export const SecurityCenterDashboard: React.FC = () => {
  const [secData, setSecData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        const secRes = await apiFetch('/api/security/dashboard');
        if (secRes.ok) setSecData(secRes);

        const auditRes = await apiFetch('/api/security/audit-logs');
        if (auditRes.ok && auditRes.audit_logs) setAuditLogs(auditRes.audit_logs);
      } catch (err) {
        console.error('Error fetching security center data:', err);
      }
    };
    fetchSecurityData();
  }, []);

  if (!secData) return <Box sx={{ p: 4, color: '#fff' }}>Loading Security Center...</Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" sx={{ color: '#a78bfa', fontWeight: 'bold', letterSpacing: 2 }}>
            ENTERPRISE SECURITY & THREAT PROTECTION
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff', mt: 0.5 }}>
            Security Center & Audit Log Explorer
          </Typography>
        </Box>
        <Chip 
          icon={<ShieldCheck size={16} />} 
          label={`Security Risk Score: ${secData.security_risk_score} / 100`} 
          color="success" 
          sx={{ fontWeight: 'bold', px: 1 }} 
        />
      </Box>

      {/* Security Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
        <Card sx={{ bgcolor: '#0f131d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }}>
          <CardContent>
            <Typography variant="caption" sx={{ color: '#a0a5b1' }}>MFA / Passkeys Policy</Typography>
            <Typography variant="h6" sx={{ color: '#34d399', fontWeight: 'bold', mt: 0.5 }}>Enforced Globally</Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: '#0f131d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }}>
          <CardContent>
            <Typography variant="caption" sx={{ color: '#a0a5b1' }}>Blocked Threat IPs (24h)</Typography>
            <Typography variant="h6" sx={{ color: '#60a5fa', fontWeight: 'bold', mt: 0.5 }}>{secData.login_security.blocked_ips_count} IPs</Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: '#0f131d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }}>
          <CardContent>
            <Typography variant="caption" sx={{ color: '#a0a5b1' }}>Geographic Anomalies</Typography>
            <Typography variant="h6" sx={{ color: '#f87171', fontWeight: 'bold', mt: 0.5 }}>0 Flags</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Audit Log Explorer Table */}
      <Card sx={{ bgcolor: '#0f131d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
            Interactive Audit Log Explorer
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { color: '#a0a5b1', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 'bold' } }}>
                <TableCell>Event Type</TableCell>
                <TableCell>User</TableCell>
                <TableCell>IP & Geo Location</TableCell>
                <TableCell>Action Details</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.map(log => (
                <TableRow key={log.id} sx={{ '& td': { color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.04)' } }}>
                  <TableCell><Chip label={log.event_type} size="small" color="secondary" sx={{ fontWeight: 'bold', fontSize: '10px' }} /></TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.ip_address} ({log.location})</TableCell>
                  <TableCell>{log.action_details}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};
