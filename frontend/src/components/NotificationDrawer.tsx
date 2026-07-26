import React, { useState } from 'react';
import { Drawer, Box, Typography, IconButton, List, ListItem, Card, CardContent, Chip } from '@mui/material';
import { X, CheckCircle, Bell, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Notification {
  id: string;
  category: 'trading' | 'ml' | 'infra' | 'security';
  severity: 'high' | 'med' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', category: 'trading', severity: 'high', title: 'Limit Order Executed', message: 'Executed BUY 100 shares AAPL @ $174.50 via MT5 Gateway.', timestamp: '2 mins ago', read: false },
  { id: '2', category: 'ml', severity: 'high', title: 'Model Drift Warning', message: 'MACD features drift threshold exceeded 0.05 on 1d model.', timestamp: '10 mins ago', read: false },
  { id: '3', category: 'infra', severity: 'high', title: 'MT5 Terminal Status', message: 'MetaTrader 5 broker terminal reconnected successfully.', timestamp: '1 hr ago', read: true },
  { id: '4', category: 'security', severity: 'med', title: 'CORS Security Check', message: 'API Gateway parsed cross-origin token validation successfully.', timestamp: '4 hrs ago', read: true },
  { id: '5', category: 'trading', severity: 'info', title: 'Take Profit Triggered', message: 'Leveraged position reached +12.4% target limit.', timestamp: '1 day ago', read: true },
];

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ open, onClose }) => {
  const [list, setList] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'high' | 'unread'>('all');

  const unreadCount = list.filter(n => !n.read).length;

  const filtered = list.filter(n => {
    if (filter === 'high') return n.severity === 'high';
    if (filter === 'unread') return !n.read;
    return true;
  });

  const markAllAsRead = () => {
    setList(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setList(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
      slotProps={{
        backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.3)' } }
      }}
    >
      <Box sx={{ width: { xs: '100vw', sm: 380 }, height: '100%', bgcolor: 'background.paper', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bell size={18} className="text-nexus-pur" />
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Notifications Center</Typography>
            {unreadCount > 0 && <Chip label={`${unreadCount} New`} size="small" color="primary" sx={{ fontSize: '0.65rem', height: 18 }} />}
          </Box>
          <IconButton onClick={onClose} size="small" color="inherit">
            <X size={16} />
          </IconButton>
        </Box>

        {/* Filters bar */}
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <Chip label="All" size="small" onClick={() => setFilter('all')} color={filter === 'all' ? 'primary' : 'default'} variant={filter === 'all' ? 'filled' : 'outlined'} />
          <Chip label="High Severity" size="small" onClick={() => setFilter('high')} color={filter === 'high' ? 'error' : 'default'} variant={filter === 'high' ? 'filled' : 'outlined'} />
          <Chip label="Unread Only" size="small" onClick={() => setFilter('unread')} color={filter === 'unread' ? 'warning' : 'default'} variant={filter === 'unread' ? 'filled' : 'outlined'} />
          {unreadCount > 0 && (
            <Typography onClick={markAllAsRead} variant="caption" sx={{ color: 'primary.main', ml: 'auto', cursor: 'pointer', display: 'flex', alignItems: 'center', hover: { textDecoration: 'underline' } }}>
              Mark all read
            </Typography>
          )}
        </Box>

        {/* List */}
        <List sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 8, gap: 1 }}>
              <CheckCircle size={32} className="text-gray-500" />
              <Typography variant="caption" color="text.secondary">All quiet! No notifications match the criteria.</Typography>
            </Box>
          ) : (
            filtered.map((n) => {
              const Icon = n.category === 'security' ? ShieldAlert : n.severity === 'high' ? AlertTriangle : Bell;
              const borderCol = n.severity === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)';
              return (
                <ListItem key={n.id} disablePadding>
                  <Card 
                    onClick={() => toggleRead(n.id)}
                    sx={{ 
                      width: '100%', 
                      bgcolor: n.read ? 'rgba(255,255,255,0.01)' : 'rgba(139, 92, 246, 0.03)', 
                      border: `1px solid ${borderCol}`,
                      borderRadius: 2.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: n.read ? 'medium' : 'bold', color: '#fff' }}>{n.title}</Typography>
                        <Icon size={14} className={n.severity === 'high' ? 'text-red-400' : 'text-gray-400'} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.4 }}>{n.message}</Typography>
                      <Box sx={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#8b5cf6', textTransform: 'uppercase' }}>{n.category}</span>
                        <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary' }}>{n.timestamp}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </ListItem>
              );
            })
          )}
        </List>
      </Box>
    </Drawer>
  );
};
