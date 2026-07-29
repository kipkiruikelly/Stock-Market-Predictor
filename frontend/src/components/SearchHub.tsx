import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, Box, InputBase, Typography, List, ListItem, ListItemButton } from '@mui/material';
import { Search, Compass, Cpu, FileText, Settings, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchItem {
  title: string;
  category: string;
  route: string;
  icon: React.ReactNode;
}

const INDEX_ITEMS: SearchItem[] = [
  { title: 'Apple Inc. (AAPL) predictions & SHAP driver analysis', category: 'Assets', route: '/research?ticker=AAPL', icon: <Cpu size={16} className="text-nexus-blu" /> },
  { title: 'Microsoft Corp. (MSFT) predictions & SHAP driver analysis', category: 'Assets', route: '/research?ticker=MSFT', icon: <Cpu size={16} className="text-nexus-blu" /> },
  { title: 'Tesla Inc. (TSLA) predictions & SHAP driver analysis', category: 'Assets', route: '/research?ticker=TSLA', icon: <Cpu size={16} className="text-nexus-blu" /> },
  { title: 'Trade Journal & Losing / Winning trades history', category: 'Journal', route: '/journal', icon: <Compass size={16} className="text-amber-400" /> },
  { title: 'ML Training Pipeline, Experiments & Deployments', category: 'MLOps', route: '/pipeline', icon: <Cpu size={16} className="text-purple-400" /> },
  { title: 'Strategy Marketplace & Leaderboard', category: 'Strategies', route: '/leaderboard', icon: <Award size={16} className="text-green-400" /> },
  { title: 'Portfolio analytics, PnL & Sharpe ratio', category: 'Portfolio', route: '/portfolio', icon: <Compass size={16} className="text-nexus-pur" /> },
  { title: 'Risk Management, VaR & Stress testing', category: 'Risk Management', route: '/risk', icon: <Settings size={16} className="text-red-400" /> },
  { title: 'System Health, SRE Metrics, Celery Queues & Redis', category: 'SRE & Ops', route: '/admin?tab=health', icon: <Settings size={16} className="text-emerald-400" /> },
  { title: 'Developer API Explorer Blueprints', category: 'Resources', route: '/resources', icon: <FileText size={16} className="text-gray-400" /> },
  { title: 'Executive Command Dashboard & Revenue Stats', category: 'Administration', route: '/admin?tab=overview', icon: <Settings size={16} className="text-amber-500" /> },
];

// Semantic Intent Parser Map
const INTENT_MAP: Array<{ keywords: string[]; route: string; category: string; title: string }> = [
  { keywords: ['losing', 'loss', 'winning', 'trades', 'history', 'journal', 'closed'], route: '/journal', category: 'Journal', title: 'Filter Trade Journal & Closed Trades' },
  { keywords: ['tesla', 'tsla', 'elon'], route: '/research?ticker=TSLA', category: 'Assets', title: 'Open Tesla (TSLA) AI Model & Predictions' },
  { keywords: ['apple', 'aapl'], route: '/research?ticker=AAPL', category: 'Assets', title: 'Open Apple (AAPL) AI Model & Predictions' },
  { keywords: ['redis', 'celery', 'queue', 'incident', 'sre', 'cpu', 'memory', 'health'], route: '/admin?tab=health', category: 'SRE & Ops', title: 'Inspect System Health, Redis & Celery Status' },
  { keywords: ['train', 'model', 'retrain', 'experiment', 'pipeline', 'drift'], route: '/pipeline', category: 'MLOps', title: 'Open ML Training & Model Registry Pipeline' },
  { keywords: ['var', 'shortfall', 'greeks', 'monte', 'risk', 'drawdown'], route: '/risk', category: 'Risk Management', title: 'Open Portfolio Risk Analytics & VaR Calculator' },
];

interface SearchHubProps {
  open: boolean;
  onClose: () => void;
}

export const SearchHub: React.FC<SearchHubProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const qLower = query.toLowerCase().trim();
  const matchedIntents: SearchItem[] = qLower ? INTENT_MAP
    .filter(intent => intent.keywords.some(kw => qLower.includes(kw)))
    .map(intent => ({
      title: intent.title,
      category: intent.category,
      route: intent.route,
      icon: <Compass size={16} className="text-purple-400" />
    })) : [];

  const standardFiltered = INDEX_ITEMS.filter(item => 
    item.title.toLowerCase().includes(qLower) ||
    item.category.toLowerCase().includes(qLower)
  );

  // Combine intent matches first, then deduplicate by route
  const combined = [...matchedIntents, ...standardFiltered];
  const filtered = Array.from(new Map(combined.map(item => [item.route, item])).values());

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          navigate(filtered[selectedIndex].route);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filtered, navigate, onClose]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5)'
          }
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Search size={18} className="text-gray-400 mr-2.5" />
          <InputBase 
            placeholder="Search assets, strategies, docs, ports... (Cmd+K)" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
            autoFocus
            sx={{ fontSize: '0.875rem', color: '#fff' }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', border: '1px solid rgba(255,255,255,0.15)', px: 1, py: 0.25, borderRadius: 1, fontSize: '10px' }}>ESC</Typography>
        </Box>

        <List sx={{ p: 1, maxHeight: 320, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', p: 3, textAlign: 'center' }}>
              No matches found for "{query}"
            </Typography>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === selectedIndex;
              return (
                <ListItem key={idx} disablePadding>
                  <ListItemButton 
                    onClick={() => {
                      navigate(item.route);
                      onClose();
                    }}
                    selected={active}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      bgcolor: active ? 'rgba(139, 92, 246, 0.08) !important' : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.02)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      {item.icon}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: active ? 'bold' : 'medium', color: '#fff' }}>{item.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold' }}>{item.category}</Typography>
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
};
