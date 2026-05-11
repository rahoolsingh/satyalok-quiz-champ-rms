import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePortalState } from '../hooks/usePortalState';
import { CountdownTimer } from '../components/CountdownTimer';
import { ImageSlider } from '../components/ImageSlider';
import { BatchSelector } from '../components/BatchSelector';
import { RegistrationForm } from '../components/RegistrationForm';
import { MobileEntry } from '../components/MobileEntry';
import { OTPVerification } from '../components/OTPVerification';
import { PaymentGateway } from '../components/PaymentGateway';
import { ResultChecker } from '../components/ResultChecker';
import { SatyalokBadge } from '../components/SatyalokBadge';
import { UserProfile } from '../components/UserProfile';
import { SliderImage, BatchType, PaymentSession, ProfileData } from '../types';
import { portalApi, otpApi, profileApi } from '../api/client';

type Step = 'home' | 'mobile-entry' | 'otp' | 'form' | 'payment' | 'profile';

export function PublicPortal() {
  const { status, loading, error, refetch } = usePortalState();
  const [images, setImages] = useState<SliderImage[]>([]);
  const [step, setStep] = useState<Step>('home');
  const [batch, setBatch] = useState<BatchType | null>(null);
  const [mobile, setMobile] = useState('');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch profile on mount if session cookie exists
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileApi.getMe();
        const profileData = response.data.profile;
        setProfile(profileData);
        setMobile(profileData.mobileNumber);
        setBatch(profileData.batchType as BatchType);
        
        // Route based on payment status
        if (profileData.paymentStatus === 'COMPLETED') {
          setStep('profile');
        } else {
          setStep('form');
        }
      } catch (error) {
        // No session or session expired - stay on home
        console.log('No active session');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => { portalApi.getSliderImages().then(r => setImages(r.data)).catch(() => {}); }, []);

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint to clear HTTP-only cookie
      await otpApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear component state
    setMobile('');
    setBatch(null);
    setProfile(null);
    setSession(null);
    setStep('home');
  };

  const handleBackToHome = () => {
    // Clear batch selection when going back to home
    setBatch(null);
    setStep('home');
  };

  if (loading || loadingProfile) {
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
    if (step === 'profile' && profile) {
      return (
        <UserProfile
          profile={profile}
          onLogout={handleLogout}
          onCompletePayment={() => {
            // Resume payment flow
            setStep('form');
          }}
        />
      );
    }
    if (step === 'form' && batch && mobile) {
      return (
        <RegistrationForm
          batchType={batch}
          mobileNumber={mobile}
          sessionToken="" // Not needed - backend uses HTTP-only cookie
          draft={profile}
          onSuccess={(paymentSession) => {
            setSession(paymentSession);
            setStep('payment');
          }}
          onBack={() => setStep('otp')}
        />
      );
    }
    if (step === 'otp' && mobile) {
      return (
        <OTPVerification
          mobileNumber={mobile}
          onSuccess={result => {
            const profileData = result.profile;
            setProfile(profileData);
            
            // Route based on payment status
            if (profileData) {
              if (profileData.paymentStatus === 'COMPLETED') {
                // Show profile with admit card
                setStep('profile');
              } else {
                // Show registration form (PENDING or FAILED)
                setStep('form');
              }
            } else {
              // New user - show registration form
              setStep('form');
            }
          }}
          onBack={() => setStep('mobile-entry')}
        />
      );
    }
    if (step === 'mobile-entry') {
      return (
        <MobileEntry
          onSuccess={(mobileNumber, selectedBatch) => {
            setMobile(mobileNumber);
            setBatch(selectedBatch);
            setStep('otp');
          }}
          onBack={handleBackToHome}
        />
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Mobile-first container - centered on desktop except for admin routes */}
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header with logout button */}
        {profile && step !== 'home' && (
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#d2d2d7]">
            <div className="text-sm text-[#86868b]">
              <span className="font-medium text-[#1d1d1f]">{mobile}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-[#ef4444] hover:opacity-75 transition-opacity font-medium"
            >
              Logout
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step !== 'home' ? (
            <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {flowContent()}
              <SatyalokBadge variant="footer" />
            </motion.div>
          ) : (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {/* Hero */}
              <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-2">Registration Open</p>
                <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold tracking-tight text-[#1d1d1f] mb-2">Quiz Champ 2026</h1>
                <p className="text-[#86868b] text-sm leading-relaxed mb-4">
                  The ultimate knowledge championship for students across all classes.
                </p>
                <SatyalokBadge variant="inline" />
              </motion.div>

              {images.length > 0 && (
                <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <ImageSlider images={images} />
                </motion.div>
              )}

              <BatchSelector onSelect={b => { setBatch(b); setStep('mobile-entry'); }} />

              {status.resultsPublished && (
                <motion.div className="mt-10 pt-8 border-t border-[#d2d2d7]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
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
