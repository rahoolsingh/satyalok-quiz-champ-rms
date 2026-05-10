import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePortalState } from '../hooks/usePortalState';
import { CountdownTimer } from '../components/CountdownTimer';
import { ImageSlider } from '../components/ImageSlider';
import { BatchSelector } from '../components/BatchSelector';
import { RegistrationForm } from '../components/RegistrationForm';
import { OTPVerification } from '../components/OTPVerification';
import { PaymentGateway } from '../components/PaymentGateway';
import { AdmitCard } from '../components/AdmitCard';
import { ResultChecker } from '../components/ResultChecker';
import { SliderImage, BatchType, PaymentSession, AdmitCardData } from '../types';
import { portalApi } from '../api/client';

type Step = 'register' | 'otp' | 'payment' | 'admit-card';

// ── Minimalist Global Header ──────────────────────────────────────────────────
function GlobalHeader() {
  return (
    <header style={headerStyle}>
      <div style={navLeft}>
        <div style={logoIcon} />
        <span style={logoText}>Quiz Champ</span>
      </div>
      <div style={navRight}>
        <span style={statusText}>Secure Enrollment</span>
      </div>
    </header>
  );
}

export function PublicPortal() {
  const { status, loading, error, refetch } = usePortalState();
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  
  // Unified Flow State
  const [step, setStep] = useState<Step>('register');
  const [selectedBatch, setSelectedBatch] = useState<BatchType | null>(null);
  const [urlGroupParam, setUrlGroupParam] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [admitCard, setAdmitCard] = useState<AdmitCardData | null>(null);
  const [participantId, setParticipantId] = useState<string | undefined>();

  // Initialize Data & Parse URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const group = params.get('group');
    if (group) setUrlGroupParam(group);

    portalApi.getSliderImages().then(r => setSliderImages(r.data)).catch(() => {});
  }, []);

  // ── Edge States (Loading, Error, Closed, Countdown) ───────────────────────
  if (loading || error || !status || status.state === 'CLOSED' || status.state === 'COUNTDOWN') {
    return (
      <div style={pageLayout}>
        <GlobalHeader />
        <div style={centerContainer}>
          {loading && <motion.div style={loadingSpinner} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />}
          {(error || !status) && !loading && (
            <div style={textCenter}>
              <h2 style={headlineStyle}>Connection lost.</h2>
              <button style={primaryButton} onClick={refetch}>Try again</button>
            </div>
          )}
          {status?.state === 'CLOSED' && (
            <motion.div style={textCenter} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 style={heroTitle}>Registration is closed.</h1>
              <p style={heroSubtitle}>We are no longer accepting new candidates at this time.</p>
            </motion.div>
          )}
          {status?.state === 'COUNTDOWN' && <CountdownTimer targetDate={status.openingDate} onComplete={refetch} />}
        </div>
      </div>
    );
  }

  // ── Apple-Style "Configure to Order" Unified Layout ───────────────────────
  return (
    <div style={pageLayout}>
      <GlobalHeader />
      
      <main style={splitLayout}>
        {/* Left Column: Sticky Context & Visuals */}
        <div style={stickyLeftColumn}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 style={heroTitle}>The ultimate test of knowledge.</h1>
            <p style={heroSubtitle}>
              Select your category and complete your enrollment below to secure your spot in Quiz Champ 2026.
            </p>
          </motion.div>

          <AnimatePresence>
            {sliderImages.length > 0 && step === 'register' && (
              <motion.div 
                style={mediaWrapper}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.2 }}
              >
                <ImageSlider images={sliderImages} />
              </motion.div>
            )}
          </AnimatePresence>

          {status.resultsPublished && step === 'register' && (
            <motion.div style={resultsWrapper} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <h3 style={sectionLabel}>Final Results</h3>
              <ResultChecker />
            </motion.div>
          )}
        </div>

        {/* Right Column: Continuous Scrolling Form Area */}
        <div style={scrollingRightColumn}>
          <AnimatePresence mode="wait">
            
            {/* Step 1 & 2: Category & Form (Rendered Together) */}
            {step === 'register' && (
              <motion.div 
                key="register-flow"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                style={flowGroup}
              >
                {/* 1. Category Selection */}
                <div style={formSection}>
                  <h2 style={sectionTitle}>1. Choose your category.</h2>
                  <BatchSelector 
                    initialGroup={urlGroupParam} // Passing URL param down to auto-select
                    onSelect={setSelectedBatch} 
                  />
                </div>

                {/* 2. Registration Details (Progressively revealed) */}
                {selectedBatch && (
                  <motion.div 
                    style={formSection}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.4 }}
                  >
                    <div style={dividerLine} />
                    <h2 style={sectionTitle}>2. Candidate details.</h2>
                    <RegistrationForm 
                      batchType={selectedBatch} 
                      onSuccess={mobile => { setMobileNumber(mobile); setStep('otp'); }} 
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 3: OTP */}
            {step === 'otp' && (
              <motion.div key="otp-flow" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={formSection}>
                <button style={backButton} onClick={() => setStep('register')}>← Edit details</button>
                <h2 style={sectionTitle}>Verify your number.</h2>
                <OTPVerification 
                  mobileNumber={mobileNumber} 
                  onSuccess={session => { setPaymentSession(session); setStep('payment'); }} 
                  onBack={() => setStep('register')} 
                />
              </motion.div>
            )}

            {/* Step 4: Payment */}
            {step === 'payment' && paymentSession && (
              <motion.div key="payment-flow" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={formSection}>
                <h2 style={sectionTitle}>Secure checkout.</h2>
                <PaymentGateway 
                  session={paymentSession} 
                  onSuccess={card => { setAdmitCard(card); setParticipantId(paymentSession.participantId); setStep('admit-card'); }} 
                  onFailure={msg => alert(msg)} 
                />
              </motion.div>
            )}

            {/* Step 5: Admit Card */}
            {step === 'admit-card' && admitCard && (
              <motion.div key="admit-flow" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={formSection}>
                <h2 style={sectionTitle}>Registration complete.</h2>
                <AdmitCard data={admitCard} participantId={participantId} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ── Styles (Apple / Google Minimalist Base) ───────────────────────────────────

const pageLayout: React.CSSProperties = { 
  minHeight: '100vh', backgroundColor: '#fbfbfd', color: '#1d1d1f', 
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  WebkitFontSmoothing: 'antialiased'
};

// Global Header
const headerStyle: React.CSSProperties = { 
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
  padding: '16px clamp(20px, 5vw, 40px)', position: 'sticky', top: 0, zIndex: 100,
  backgroundColor: 'rgba(251, 251, 253, 0.85)', backdropFilter: 'blur(24px)',
  borderBottom: '1px solid rgba(0,0,0,0.05)'
};
const navLeft: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' };
const logoIcon: React.CSSProperties = { width: '16px', height: '16px', backgroundColor: '#1d1d1f', borderRadius: '4px' };
const logoText: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em' };
const navRight: React.CSSProperties = { display: 'flex', alignItems: 'center' };
const statusText: React.CSSProperties = { fontSize: '0.85rem', color: '#86868b', fontWeight: 500 };

// Split Layout Architecture
const splitLayout: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', maxWidth: '1400px', margin: '0 auto',
  padding: 'clamp(40px, 6vw, 80px) clamp(20px, 5vw, 60px)', gap: 'clamp(40px, 8vw, 100px)'
};
const stickyLeftColumn: React.CSSProperties = {
  flex: '1 1 400px', position: 'sticky', top: '100px', alignSelf: 'flex-start',
  display: 'flex', flexDirection: 'column', gap: '40px'
};
const scrollingRightColumn: React.CSSProperties = {
  flex: '1.5 1 500px', paddingBottom: '100px'
};

// Typography
const heroTitle: React.CSSProperties = { fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '16px' };
const heroSubtitle: React.CSSProperties = { fontSize: 'clamp(1.1rem, 1.5vw, 1.25rem)', fontWeight: 400, color: '#86868b', lineHeight: 1.5 };
const sectionTitle: React.CSSProperties = { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '24px', color: '#1d1d1f' };
const sectionLabel: React.CSSProperties = { fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#86868b', marginBottom: '16px' };

// Flow Elements
const flowGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '48px' };
const formSection: React.CSSProperties = { width: '100%', display: 'flex', flexDirection: 'column' };
const dividerLine: React.CSSProperties = { width: '100%', height: '1px', backgroundColor: '#d2d2d7', marginBottom: '48px' };
const backButton: React.CSSProperties = { alignSelf: 'flex-start', background: 'none', border: 'none', color: '#0066cc', fontSize: '1rem', cursor: 'pointer', padding: 0, marginBottom: '24px' };

// Center Layout (For Edge States)
const centerContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: '20px' };
const textCenter: React.CSSProperties = { textAlign: 'center' };
const headlineStyle: React.CSSProperties = { fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '8px' };

// UI Components
const primaryButton: React.CSSProperties = { marginTop: '24px', padding: '12px 24px', backgroundColor: '#0071e3', color: '#ffffff', borderRadius: '20px', border: 'none', fontSize: '1rem', fontWeight: 400, cursor: 'pointer' };
const loadingSpinner: React.CSSProperties = { width: '32px', height: '32px', border: '2px solid #d2d2d7', borderTopColor: '#1d1d1f', borderRadius: '50%' };
const mediaWrapper: React.CSSProperties = { borderRadius: '16px', overflow: 'hidden' };
const resultsWrapper: React.CSSProperties = { borderTop: '1px solid #d2d2d7', paddingTop: '32px' };