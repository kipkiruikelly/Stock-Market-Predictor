import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, Box, InputBase, Typography, List, ListItem, ListItemButton } from '@mui/material';
import { Search, Compass, Cpu, FileText, Settings } from 'lucide-react';
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
  { title: 'Order Management System (OMS) & Execution', category: 'Trading', route: '/trading/orders', icon: <Compass size={16} className="text-nexus-blu" /> },
  { title: 'Position Management Workspace (PMS) & Greeks', category: 'Trading', route: '/trading/positions', icon: <Compass size={16} className="text-nexus-blu" /> },
  { title: 'Trading Supervisor Command Center & Risk Circuit Breakers', category: 'Trading', route: '/trading/supervisor', icon: <Compass size={16} className="text-nexus-blu" /> },
  { title: 'Trading Strategies Workspace & Backtesting', category: 'Trading', route: '/trading/strategies', icon: <Compass size={16} className="text-nexus-blu" /> },
  { title: 'Portfolio Open Holdings & Rebalancing Actions', category: 'Portfolio', route: '/portfolio/holdings', icon: <Compass size={16} className="text-nexus-pur" /> },
  { title: 'Portfolio Quantitative Analytics & Sharpe / CAGR', category: 'Portfolio', route: '/portfolio/analytics', icon: <Compass size={16} className="text-nexus-pur" /> },
  { title: 'Portfolio Target vs Current Allocation Matrix', category: 'Portfolio', route: '/portfolio/allocation', icon: <Compass size={16} className="text-nexus-pur" /> },
  { title: 'Portfolio Multi-Timeframe Performance & Benchmark', category: 'Portfolio', route: '/portfolio/performance', icon: <Compass size={16} className="text-nexus-pur" /> },
  { title: 'Portfolio Risk Sentinel, VaR & Stress Test Scenarios', category: 'Portfolio', route: '/portfolio/risk', icon: <Compass size={16} className="text-nexus-pur" /> },
  { title: 'Quantitative Research Projects Command Center', category: 'Research Lab', route: '/researchlab/projects', icon: <FileText size={16} className="text-purple-400" /> },
  { title: 'Enterprise Data Catalog & Lineage Sync', category: 'Research Lab', route: '/researchlab/datasets', icon: <FileText size={16} className="text-purple-400" /> },
  { title: 'Institutional ETL & ML Data Pipeline Engine', category: 'Research Lab', route: '/researchlab/datapipeline', icon: <FileText size={16} className="text-purple-400" /> },
  { title: 'MLflow Experiment Tracker & Hyperparameter Logs', category: 'Machine Learning', route: '/researchlab/experiments', icon: <Cpu size={16} className="text-purple-400" /> },
  { title: 'AI Model Inventory & SHAP Explanations', category: 'Machine Learning', route: '/researchlab/models', icon: <Cpu size={16} className="text-purple-400" /> },
  { title: 'Enterprise Model Governance & Registry Console', category: 'Machine Learning', route: '/researchlab/modelregistry', icon: <Cpu size={16} className="text-purple-400" /> },
  { title: 'Executive Command Center & C-Suite Intelligence', category: 'Executive', route: '/executive/dashboard', icon: <Settings size={16} className="text-amber-500" /> },
  { title: 'Business Intelligence & SaaS Analytics', category: 'Executive', route: '/executive/business-analytics', icon: <Settings size={16} className="text-amber-500" /> },
  { title: 'Enterprise Growth Planning & Cohort Analytics', category: 'Executive', route: '/executive/growth', icon: <Settings size={16} className="text-amber-500" /> },
  { title: 'Cloud Financial Operations (FinOps) Workspace', category: 'Executive', route: '/executive/cloud-costs', icon: <Settings size={16} className="text-amber-500" /> },
  { title: 'Enterprise User Management & Security Controls', category: 'Administration', route: '/admin/users', icon: <Settings size={16} className="text-emerald-400" /> },
  { title: 'RBAC Permissions Matrix & Role Hierarchy', category: 'Administration', route: '/admin/roles', icon: <Settings size={16} className="text-emerald-400" /> },
  { title: 'Enterprise Multi-Tenant Organizations Console', category: 'Administration', route: '/admin/organizations', icon: <Settings size={16} className="text-emerald-400" /> },
  { title: 'Enterprise Feature Flags & Kill Switches', category: 'Administration', route: '/admin/feature-flags', icon: <Settings size={16} className="text-emerald-400" /> },
  { title: 'Enterprise API Credential Manager & Key Rotation', category: 'Administration', route: '/admin/api-keys', icon: <Settings size={16} className="text-emerald-400" /> },
  { title: 'Enterprise Billing & Stripe Subscription Management', category: 'Administration', route: '/admin/billing', icon: <Settings size={16} className="text-emerald-400" /> },
  { title: 'Unified System Settings & Environment Controls', category: 'Administration', route: '/admin/settings', icon: <Settings size={16} className="text-emerald-400" /> },
  { title: 'Interactive Documentation Portal', category: 'Knowledge Center', route: '/knowledge/documentation', icon: <FileText size={16} className="text-gray-400" /> },
  { title: 'Swagger-Style REST API Explorer', category: 'Knowledge Center', route: '/knowledge/api-explorer', icon: <FileText size={16} className="text-gray-400" /> },
  { title: 'SRE Operational Runbooks & Disaster Recovery', category: 'Knowledge Center', route: '/knowledge/runbooks', icon: <FileText size={16} className="text-gray-400" /> },
  { title: 'Interactive Product User Guide & FAQs', category: 'Knowledge Center', route: '/knowledge/user-guide', icon: <FileText size={16} className="text-gray-400" /> },
  { title: 'Administrator Operations Manual & Deployment Guide', category: 'Knowledge Center', route: '/knowledge/admin-guide', icon: <FileText size={16} className="text-gray-400" /> },
];

// Semantic Intent Parser Map
const INTENT_MAP: Array<{ keywords: string[]; route: string; category: string; title: string }> = [
  { keywords: ['orders', 'oms', 'filled', 'pending', 'cancel', 'route'], route: '/trading/orders', category: 'Trading', title: 'Open Order Management System (OMS)' },
  { keywords: ['positions', 'pms', 'pnl', 'greeks', 'unrealized', 'margin'], route: '/trading/positions', category: 'Trading', title: 'Open Position Management Workspace (PMS)' },
  { keywords: ['supervisor', 'risk limit', 'approval', 'circuit breaker'], route: '/trading/supervisor', category: 'Trading', title: 'Open Trading Supervisor Command Center' },
  { keywords: ['strategies', 'backtest', 'alpha', 'opt', 'quant'], route: '/trading/strategies', category: 'Trading', title: 'Open Trading Strategies Workspace' },
  { keywords: ['datasets', 'catalog', 'lineage', 'schema', 'drift'], route: '/researchlab/datasets', category: 'Research Lab', title: 'Open Enterprise Data Catalog' },
  { keywords: ['datapipeline', 'etl', 'dag', 'ingestion', 'throughput'], route: '/researchlab/datapipeline', category: 'Research Lab', title: 'Open Data Pipeline Engine' },
  { keywords: ['experiments', 'hyperparameter', 'loss', 'f1', 'mlflow'], route: '/researchlab/experiments', category: 'Machine Learning', title: 'Open MLflow Experiment Tracker' },
  { keywords: ['models', 'shap', 'inference', 'latency', 'accuracy'], route: '/researchlab/models', category: 'Machine Learning', title: 'Open AI Model Inventory' },
  { keywords: ['registry', 'governance', 'canary', 'promotion', 'approval'], route: '/researchlab/modelregistry', category: 'Machine Learning', title: 'Open Model Governance Registry' },
  { keywords: ['executive', 'c-suite', 'arr', 'mrr', 'aum'], route: '/executive/dashboard', category: 'Executive', title: 'Open Executive Command Center' },
  { keywords: ['users', 'rbac', 'mfa', 'security', 'role'], route: '/admin/users', category: 'Administration', title: 'Open Enterprise User Management' },
  { keywords: ['runbook', 'sre', 'redis', 'postgres', 'disaster'], route: '/knowledge/runbooks', category: 'Knowledge Center', title: 'Open SRE Operational Runbooks' },
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
