import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Switch, FormControlLabel } from '@mui/material';
import { ShieldCheck, TrendingUp, Cpu, Award } from 'lucide-react';

interface RoleLandingConfigProps {
  role: string;
  visibleWidgets: Record<string, boolean>;
  onToggleWidget: (widgetKey: string) => void;
}

export const RoleLandingConfig: React.FC<RoleLandingConfigProps> = ({ role, visibleWidgets, onToggleWidget }) => {
  const personaIcons: Record<string, React.ReactNode> = {
    trader: <TrendingUp size={20} className="text-purple-400" />,
    executive: <ShieldCheck size={20} className="text-amber-400" />,
    quant: <Cpu size={20} className="text-blue-400" />,
    sre: <Award size={20} className="text-emerald-400" />
  };

  return (
    <Card sx={{ bgcolor: '#0f131d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {personaIcons[role.toLowerCase()] || <TrendingUp size={20} className="text-purple-400" />}
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
              {role.toUpperCase()} Persona Dashboard Config
            </Typography>
          </Box>
          <Chip label={`Active Role: ${role}`} color="secondary" size="small" sx={{ fontWeight: 'bold' }} />
        </Box>

        <Typography variant="body2" sx={{ color: '#a0a5b1', mb: 2 }}>
          Customize widget visibility tailored to your operational domain requirements.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Object.entries(visibleWidgets).map(([key, isVisible]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: '#fff', textTransform: 'capitalize' }}>
                {key.replace('_', ' ')}
              </Typography>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={isVisible} 
                    onChange={() => onToggleWidget(key)}
                    size="small"
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b5cf6' } }}
                  />
                }
                label=""
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};
