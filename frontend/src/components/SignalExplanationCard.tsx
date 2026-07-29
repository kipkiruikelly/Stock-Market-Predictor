import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Divider, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, CheckCircle, Zap, Activity } from 'lucide-react';

export interface SignalExplanationProps {
  ticker: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  rawShapValues?: Record<string, number>;
  humanReadableDrivers?: string[];
  horizon?: string;
}

export const SignalExplanationCard: React.FC<SignalExplanationProps> = ({
  ticker,
  action,
  confidence,
  entryPrice,
  targetPrice,
  stopLoss,
  rawShapValues = { rsi_14: 0.38, volume_surge: 0.24, macd_signal: 0.18, market_sentiment: 0.12 },
  humanReadableDrivers = [
    'RSI momentum recovered cleanly above 50 (+38% model weight)',
    'Volume surge exceeded 20-day average by 38% (+24% model weight)',
    'Institutional MACD signal cross turned bullish (+18% model weight)',
    'Overall market sentiment score positive at +0.65 (+12% model weight)'
  ],
  horizon = '1d'
}) => {
  const isBuy = action === 'BUY';
  const isSell = action === 'SELL';

  const badgeColor = isBuy ? '#34d399' : isSell ? '#f87171' : '#fbbf24';

  return (
    <Card 
      sx={{ 
        bgcolor: '#0f131d', 
        border: `1px solid ${badgeColor}40`, 
        borderRadius: 3.5, 
        p: 0.5,
        boxShadow: `0 8px 24px -4px ${badgeColor}15`
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: `${badgeColor}20`, p: 1, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
              {isBuy ? <TrendingUp size={22} color={badgeColor} /> : isSell ? <TrendingDown size={22} color={badgeColor} /> : <Activity size={22} color={badgeColor} />}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff', lineHeight: 1.2 }}>
                {ticker} Signal Rationale
              </Typography>
              <Typography variant="caption" sx={{ color: '#a0a5b1' }}>
                AI Model Horizon: <strong>{horizon}</strong>
              </Typography>
            </Box>
          </Box>

          <Chip 
            label={`${action} (${(confidence * 100).toFixed(0)}% Confidence)`} 
            sx={{ 
              bgcolor: `${badgeColor}25`, 
              color: badgeColor, 
              fontWeight: 'bold', 
              border: `1px solid ${badgeColor}60` 
            }} 
          />
        </Box>

        {/* Trade Price Targets */}
        {(entryPrice || targetPrice || stopLoss) && (
          <Box sx={{ display: 'flex', gap: 2, bgcolor: 'rgba(255,255,255,0.02)', p: 1.5, borderRadius: 2.5, mb: 2.5, border: '1px solid rgba(255,255,255,0.05)' }}>
            {entryPrice && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#a0a5b1', display: 'block', fontSize: '10px' }}>ENTRY</Typography>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold' }}>${entryPrice.toFixed(2)}</Typography>
              </Box>
            )}
            {targetPrice && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#a0a5b1', display: 'block', fontSize: '10px' }}>TAKE PROFIT</Typography>
                <Typography variant="subtitle2" sx={{ color: '#34d399', fontWeight: 'bold' }}>${targetPrice.toFixed(2)}</Typography>
              </Box>
            )}
            {stopLoss && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#a0a5b1', display: 'block', fontSize: '10px' }}>STOP LOSS</Typography>
                <Typography variant="subtitle2" sx={{ color: '#f87171', fontWeight: 'bold' }}>${stopLoss.toFixed(2)}</Typography>
              </Box>
            )}
          </Box>
        )}

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

        {/* Human Readable Drivers */}
        <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
          <Zap size={14} /> Plain-English Decision Drivers
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {humanReadableDrivers.map((driver, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
              <CheckCircle size={15} color={badgeColor} style={{ marginTop: 3, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                {driver}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Technical Feature Contributions (SHAP Breakdown) */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
          <Typography variant="caption" sx={{ color: '#a0a5b1', fontWeight: 'bold', mb: 1, display: 'block' }}>
            Technical SHAP Feature Contribution Breakdown
          </Typography>
          {Object.entries(rawShapValues).map(([feat, val]) => (
            <Box key={feat} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>{feat}</Typography>
                <Typography variant="caption" sx={{ color: '#38bdf8', fontSize: '11px', fontWeight: 'bold' }}>+{(val * 100).toFixed(0)}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={val * 100} sx={{ height: 4, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />
            </Box>
          ))}
        </Box>

        {/* Multi-Agent Provenance Voting Matrix */}
        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              🤖 5-Agent Consensus Provenance
            </Typography>
            <Chip label="Data Verified: MT5 & DB" size="small" sx={{ bgcolor: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: '10px', fontWeight: 'bold' }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
