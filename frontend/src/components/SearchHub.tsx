import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, Box, InputBase, Typography, List, ListItem, ListItemButton, Divider } from '@mui/material';
import { Search, Compass, Cpu, FileText, Settings, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchItem {
  title: string;
  category: string;
  route: string;
  icon: React.ReactNode;
}

const INDEX_ITEMS: SearchItem[] = [
  { title: 'Apple Inc. (AAPL) predictions', category: 'Assets', route: '/research?ticker=AAPL', icon: <Cpu size={16} className="text-nexus-blu" /> },
  { title: 'Microsoft Corp. (MSFT) predictions', category: 'Assets', route: '/research?ticker=MSFT', icon: <Cpu size={16} className="text-nexus-blu" /> },
  { title: 'Tesla Inc. (TSLA) predictions', category: 'Assets', route: '/research?ticker=TSLA', icon: <Cpu size={16} className="text-nexus-blu" /> },
  { title: 'Strategy Marketplace subscription deck', category: 'Strategies', route: '/leaderboard', icon: <Award size={16} className="text-green-400" /> },
  { title: 'Portfolio analytics & Sharpe ratio', category: 'Portfolio', route: '/portfolio', icon: <Compass size={16} className="text-nexus-pur" /> },
  { title: 'Risk Management & Position size math', category: 'Risk Management', route: '/risk', icon: <Settings size={16} className="text-red-400" /> },
  { title: 'Developer API Explorer Blueprints', category: 'Resources', route: '/resources', icon: <FileText size={16} className="text-gray-400" /> },
  { title: 'Executive command business stats', category: 'Administration', route: '/admin?tab=overview', icon: <Settings size={16} className="text-amber-500" /> },
];

interface SearchHubProps {
  open: boolean;
  onClose: () => void;
}

export const SearchHub: React.FC<SearchHubProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const filtered = INDEX_ITEMS.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

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
