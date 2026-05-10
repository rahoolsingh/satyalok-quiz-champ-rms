import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePortalState } from '../hooks/usePortalState';
import { CountdownTimer } from '../components/CountdownTimer';
import { ImageSlider } from '../components/ImageSlider';
import { BatchSelector } from '../components/BatchSelector';
import { RegistrationForm } from '../components/RegistrationForm';
import { OTPVerification } from '../components/OTPVerification';
import { PaymentGateway } from '../components/PaymentGateway';
import { ResultChecker } from '../components/ResultChecker';
import { SatyalokBadge } from '../components/SatyalokBadge';
import { SliderImage, BatchType, PaymentSession } from '../types';
import { portalApi } from '../api/client';

type Step = 'home' | 'register' | 'otp' | 'payment';

export function PublicPortal() {
  const { status, loading, error, refetch } = usePortalState();
  const [images, setImages] = useState<SliderImage[]>([]);
  const [step, setStep] = useState<Step>('home');
  const [batch, setBatch] = useState<BatchType | null>(null);
  const [mobile, setMobile] = useState('');
  const [session, setSession] = useState<PaymentSession | null>(null);

  useEffect(() => { portalApi.getSliderImages().then(r => setImages(r.data)).catch(() => {}); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fbfbfd]">
        <div className="w-5 h-5 border-2 border-[#d2d2d7] border-t-[#0071e3] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfbfd] p-6">
        <p className="text-[#86868b] mb-3">Unable to load portal.</p>
        <button onClick={refetch} className="px-5 py-2.5 bg-[#0071e3] text-white rounded-full font-semibold text-sm">Retry</button>
      </div>
    );
  }

  if (status.state === 'CLOSED') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fbfbfd] p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-3">Quiz Champ 2026</p>
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-[#1d1d1f] mb-3">Coming Soon</h1>
          <p className="text-[#86868b] leading-relaxed mb-8">Registration is currently closed. Stay tuned for updates.</p>
          <SatyalokBadge variant="footer" />
        </motion.div>
      </div>
    );
  }

  if (status.state === 'COUNTDOWN') {
    return <CountdownTimer targetDate={status.openingDate} onComplete={refetch} />;
  }

  const flowContent = () => {
    if (step === 'payment' && session) {
      return <PaymentGateway session={session} onFailure={msg => alert(msg)} />;
    }
    if (step === 'otp') {
      return <OTPVerification mobileNumber={mobile} onSuccess={s => { setSession(s); setStep('payment'); }} onBack={() => setStep('register')} />;
    }
    if (step === 'register' && batch) {
      return <RegistrationForm batchType={batch} onSuccess={m => { setMobile(m); setStep('otp'); }} onBack={() => setStep('home')} />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <div className="max-w-2xl mx-auto px-6 py-[clamp(32px,5vw,64px)]">
        <AnimatePresence mode="wait">
          {step !== 'home' ? (
            <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {flowContent()}
              <SatyalokBadge variant="footer" />
            </motion.div>
          ) : (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {/* Hero */}
              <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-2.5">Registration Open</p>
                <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-bold tracking-tight text-[#1d1d1f] mb-2.5">Quiz Champ 2026</h1>
                <p className="text-[#86868b] text-base leading-relaxed max-w-lg mb-4">
                  The ultimate knowledge championship for students across all classes.
                </p>
                <SatyalokBadge variant="inline" />
              </motion.div>

              {images.length > 0 && (
                <motion.div className="mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <ImageSlider images={images} />
                </motion.div>
              )}

              <BatchSelector onSelect={b => { setBatch(b); setStep('register'); }} />

              {status.resultsPublished && (
                <motion.div className="mt-14 pt-10 border-t border-[#d2d2d7]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
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
