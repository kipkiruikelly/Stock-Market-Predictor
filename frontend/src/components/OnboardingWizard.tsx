import React, { useState } from 'react';
import { 
  Dialog, DialogContent, Box, Typography, Button, Stepper, Step, StepLabel, 
  Card, CardContent, Chip, CircularProgress 
} from '@mui/material';
import { TrendingUp, ShieldCheck, Cpu, Award, ArrowRight, CheckCircle2, DollarSign } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  username: string;
  onComplete?: () => void;
}

const STEPS = ['Select Persona', 'Paper Capital', 'Watchlist', 'First Strategy'];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ open, onClose, username, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [persona, setPersona] = useState<'trader' | 'executive' | 'sre' | 'quant'>('trader');
  const [paperAmount, setPaperCapital] = useState(10000);
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['AAPL', 'TSLA', 'BTCUSD']);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const toggleTicker = (ticker: string) => {
    if (selectedTickers.includes(ticker)) {
      setSelectedTickers(selectedTickers.filter(t => t !== ticker));
    } else {
      setSelectedTickers([...selectedTickers, ticker]);
    }
  };

  const handleNext = async () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      // Finalize onboarding
      setLoading(true);
      try {
        // Seed paper account
        await apiFetch('/api/paper/opt-in', {
          method: 'POST',
          body: JSON.stringify({ initial_balance: paperAmount })
        });

        // Add selected watchlist items
        for (const ticker of selectedTickers) {
          await apiFetch('/api/watchlist/add', {
            method: 'POST',
            body: JSON.stringify({ ticker })
          });
        }

        setCompleted(true);
        if (onComplete) onComplete();
      } catch (err) {
        console.error('Onboarding completion error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#0f131d',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: 4,
            color: '#fff',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.7)'
          }
        }
      }}
    >
      <DialogContent sx={{ p: { xs: 3, md: 5 } }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="overline" sx={{ color: '#a78bfa', fontWeight: 'bold', letterSpacing: 2 }}>
            TRIPLE FUSION OPERATING SYSTEM
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5, mb: 1 }}>
            Welcome, {username}! 👋
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0a5b1', maxWidth: 520, mx: 'auto' }}>
            Let's configure your institutional workspace in 4 quick steps.
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel 
                slotProps={{
                  label: {
                    sx: {
                      color: 'rgba(255, 255, 255, 0.6) !important',
                      '&.Mui-active': { color: '#a78bfa !important', fontWeight: 'bold' },
                      '&.Mui-completed': { color: '#34d399 !important' }
                    }
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {!completed ? (
          <Box sx={{ minHeight: 280 }}>
            {/* Step 0: Persona Selection */}
            {activeStep === 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {[
                  { id: 'trader', title: 'Prop Trader', desc: 'Real-time order entry, live charts, execution, and paper trading.', icon: <TrendingUp size={24} className="text-purple-400" /> },
                  { id: 'executive', title: 'Executive / C-Suite', desc: 'High-level business performance, revenue, Sharpe ratio, and compliance.', icon: <ShieldCheck size={24} className="text-amber-400" /> },
                  { id: 'quant', title: 'Quant / AI Researcher', desc: 'ML model training pipelines, SHAP explainability, and feature store.', icon: <Cpu size={24} className="text-blue-400" /> },
                  { id: 'sre', title: 'SRE / System Engineer', desc: 'Prometheus metrics, Celery queues, Redis cache status, and error logs.', icon: <Award size={24} className="text-emerald-400" /> }
                ].map(item => (
                  <Box key={item.id}>
                    <Card 
                      onClick={() => setPersona(item.id as any)}
                      sx={{ 
                        bgcolor: persona === item.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: persona === item.id ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { border: '1px solid #8b5cf6' }
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          {item.icon}
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff' }}>{item.title}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#a0a5b1', fontSize: '0.8rem' }}>{item.desc}</Typography>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}

            {/* Step 1: Paper Capital */}
            {activeStep === 1 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                  Configure Virtual Capital Account
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0a5b1', mb: 3 }}>
                  Select your starting paper trading balance to practice risk-free strategy executions.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                  {[5000, 10000, 50000, 100000].map(amt => (
                    <Button
                      key={amt}
                      variant={paperAmount === amt ? 'contained' : 'outlined'}
                      onClick={() => setPaperCapital(amt)}
                      sx={{
                        borderRadius: 3,
                        px: 3,
                        py: 1.5,
                        fontWeight: 'bold',
                        bgcolor: paperAmount === amt ? '#8b5cf6' : 'transparent',
                        borderColor: 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        '&:hover': { bgcolor: paperAmount === amt ? '#7c3aed' : 'rgba(255,255,255,0.05)' }
                      }}
                    >
                      ${amt.toLocaleString()}
                    </Button>
                  ))}
                </Box>
                <Chip icon={<DollarSign size={14} />} label={`Selected Balance: $${paperAmount.toLocaleString()} USD`} color="secondary" sx={{ fontWeight: 'bold' }} />
              </Box>
            )}

            {/* Step 2: Watchlist Setup */}
            {activeStep === 2 && (
              <Box sx={{ py: 1 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
                  Select Primary Watchlist Assets
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0a5b1', mb: 3, textAlign: 'center' }}>
                  Choose assets to seed into your live predictive streaming pipeline.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
                  {['AAPL', 'MSFT', 'TSLA', 'NVDA', 'BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD', 'XAUUSD', 'SPY'].map(ticker => {
                    const isSelected = selectedTickers.includes(ticker);
                    return (
                      <Chip
                        key={ticker}
                        label={ticker}
                        onClick={() => toggleTicker(ticker)}
                        color={isSelected ? "primary" : "default"}
                        variant={isSelected ? "filled" : "outlined"}
                        sx={{ 
                          fontWeight: 'bold', 
                          px: 2, 
                          py: 2.5, 
                          borderRadius: 2,
                          cursor: 'pointer',
                          bgcolor: isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.03)',
                          borderColor: isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.15)'
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* Step 3: First Strategy Exec */}
            {activeStep === 3 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                  Ready to Deploy Strategy Pipeline
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0a5b1', mb: 3 }}>
                  Your workspace will initialize with real-time ML inference and ${paperAmount.toLocaleString()} in paper capital.
                </Typography>
                <Card sx={{ bgcolor: 'rgba(52, 211, 153, 0.08)', border: '1px solid #34d399', borderRadius: 3, p: 2, maxWidth: 450, mx: 'auto' }}>
                  <Typography variant="subtitle2" sx={{ color: '#34d399', fontWeight: 'bold' }}>
                    ⚡ Automatic Setup Summary
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#a0a5b1', display: 'block', mt: 0.5 }}>
                    Role Persona: <strong>{persona.toUpperCase()}</strong> | Watchlist: <strong>{selectedTickers.join(', ')}</strong>
                  </Typography>
                </Card>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle2 size={56} className="text-emerald-400 mx-auto mb-3" />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff', mb: 1 }}>
              Workspace Configured! 🎉
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0a5b1', mb: 3 }}>
              Your personalized Triple Fusion Operating System dashboard is ready.
            </Typography>
            <Button
              variant="contained"
              onClick={onClose}
              sx={{ bgcolor: '#8b5cf6', color: '#fff', fontWeight: 'bold', px: 4, py: 1.5, borderRadius: 3 }}
            >
              Enter Operating System
            </Button>
          </Box>
        )}

        {!completed && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Button 
              disabled={activeStep === 0 || loading} 
              onClick={() => setActiveStep(prev => prev - 1)}
              sx={{ color: '#a0a5b1' }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />}
              sx={{ bgcolor: '#8b5cf6', fontWeight: 'bold', borderRadius: 2.5, px: 3 }}
            >
              {activeStep === STEPS.length - 1 ? 'Finish Setup' : 'Next Step'}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
