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
import { SatyalokBadge } from '../components/SatyalokBadge';
import { SliderImage, BatchType, PaymentSession, AdmitCardData } from '../types';
import { portalApi } from '../api/client';

type Step = 'home' | 'register' | 'otp' | 'payment' | 'admit-card';

export function PublicPortal() {
  const { status, loading, error, refetch } = usePortalState();
  const [images, setImages] = useState<SliderImage[]>([]);
  const [step, setStep] = useState<Step>('home');
  const [batch, setBatch] = useState<BatchType | null>(null);
  const [mobile, setMobile] = useState('');
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [admitCard, setAdmitCard] = useState<AdmitCardData | null>(null);
  const [participantId, setParticipantId] = useState<string | undefined>();

  useEffect(() => { portalApi.getSliderImages().then(r => setImages(r.data)).catch(() => {}); }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={center}>
        <div style={{ width: 20, height: 20, border: '2px solid #d2d2d7', borderTop: '2px solid #0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div style={center}>
        <p style={{ color: '#86868b', marginBottom: 12 }}>Unable to load portal.</p>
        <button onClick={refetch} style={{ padding: '10px 22px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  // ── Closed ───────────────────────────────────────────────────────────────
  if (status.state === 'CLOSED') {
    return (
      <div style={center}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 480 }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0071e3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Quiz Champ 2026</p>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#1d1d1f', marginBottom: 12 }}>Coming Soon</h1>
          <p style={{ color: '#86868b', lineHeight: 1.6, marginBottom: 32 }}>Registration is currently closed. Stay tuned for updates.</p>
          <SatyalokBadge variant="footer" />
        </motion.div>
      </div>
    );
  }

  // ── Countdown ────────────────────────────────────────────────────────────
  if (status.state === 'COUNTDOWN') {
    return <CountdownTimer targetDate={status.openingDate} onComplete={refetch} />;
  }

  // ── Registration flow ────────────────────────────────────────────────────
  const flowContent = () => {
    if (step === 'admit-card' && admitCard) {
      return (
        <>
          <AdmitCard data={admitCard} participantId={participantId} />
          {status.resultsPublished && (
            <motion.div style={{ marginTop: 48, paddingTop: 40, borderTop: '1px solid #d2d2d7' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <ResultChecker />
            </motion.div>
          )}
        </>
      );
    }
    if (step === 'payment' && session) {
      return <PaymentGateway session={session} onSuccess={card => { setAdmitCard(card); setParticipantId(session.participantId); setStep('admit-card'); }} onFailure={msg => alert(msg)} />;
    }
    if (step === 'otp') {
      return <OTPVerification mobileNumber={mobile} onSuccess={s => { setSession(s); setStep('payment'); }} onBack={() => setStep('register')} />;
    }
    if (step === 'register' && batch) {
      return <RegistrationForm batchType={batch} onSuccess={m => { setMobile(m); setStep('otp'); }} onBack={() => setStep('home')} />;
    }
    return null;
  };

  const isFlow = step !== 'home';

  return (
    <div style={{ minHeight: '100vh', background: '#fbfbfd' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(32px,5vw,64px) 24px' }}>
        <AnimatePresence mode="wait">
          {isFlow ? (
            <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {flowContent()}
              <SatyalokBadge variant="footer" />
            </motion.div>
          ) : (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {/* Hero */}
              <motion.div style={{ marginBottom: 40 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0071e3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Registration Open</p>
                <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#1d1d1f', marginBottom: 10 }}>
                  Quiz Champ 2026
                </h1>
                <p style={{ color: '#86868b', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 480, marginBottom: 16 }}>
                  The ultimate knowledge championship for students across all classes.
                </p>
                <SatyalokBadge variant="inline" />
              </motion.div>

              {/* Slider */}
              {images.length > 0 && (
                <motion.div style={{ marginBottom: 48 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <ImageSlider images={images} />
                </motion.div>
              )}

              {/* Batch selector */}
              <BatchSelector onSelect={b => { setBatch(b); setStep('register'); }} />

              {/* Results */}
              {status.resultsPublished && (
                <motion.div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid #d2d2d7' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  <ResultChecker />
                </motion.div>
              )}

              <SatyalokBadge variant="footer" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const center: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fbfbfd', padding: 24 };
