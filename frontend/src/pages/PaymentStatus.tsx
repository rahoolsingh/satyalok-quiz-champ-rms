import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdmitCard } from '../components/AdmitCard';
import { SatyalokBadge } from '../components/SatyalokBadge';
import { profileApi } from '../api/client';
import { AdmitCardData } from '../types';

type PaymentStatusType = 'checking' | 'success' | 'failed' | 'error';

const MAX_RETRIES = 5; // Maximum 5 retries (15 seconds total)
const RETRY_DELAY = 3000; // 3 seconds between retries

export function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const participantId = searchParams.get('participantId');
  const txnId = searchParams.get('txnId');

  const [status, setStatus] = useState<PaymentStatusType>('checking');
  const [admitCard, setAdmitCard] = useState<AdmitCardData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Fetch the user's profile which includes payment status
        const response = await profileApi.getMe();
        const profile = response.data.profile;

        if (profile.paymentStatus === 'COMPLETED') {
          setStatus('success');
          if (profile.admitCard) {
            setAdmitCard(profile.admitCard);
          }
        } else if (profile.paymentStatus === 'FAILED') {
          setStatus('failed');
        } else {
          // Still pending
          if (retryCount < MAX_RETRIES) {
            setStatus('checking');
            setErrorMessage(`Payment is being processed. Checking again... (${retryCount + 1}/${MAX_RETRIES})`);
            
            // Retry after delay
            retryTimeoutRef.current = setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, RETRY_DELAY);
          } else {
            // Max retries reached - show error with manual retry option
            setStatus('error');
            setErrorMessage('Payment verification is taking longer than expected. Your payment may still be processing. Please check back in a few minutes or contact support if the issue persists.');
          }
        }
      } catch (error: any) {
        console.error('Error checking payment status:', error);
        setStatus('error');
        setErrorMessage(
          error.response?.data?.error || 
          'Unable to verify payment status. Please try again or contact support.'
        );
      }
    };

    checkPaymentStatus();

    // Cleanup timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [participantId, txnId, retryCount]);

  // Checking/Loading State
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#fbfbfd]">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
          >
            <div className="w-16 h-16 border-4 border-[#d2d2d7] border-t-[#0071e3] rounded-full animate-spin" />
            <h2 className="text-xl font-bold text-[#1d1d1f]">Verifying Payment</h2>
            <p className="text-[#86868b] text-sm text-center max-w-sm">
              {errorMessage || 'Please wait while we confirm your payment status with PhonePe...'}
            </p>
            {txnId && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-[#1d1d1f] w-full max-w-sm">
                <p className="font-medium mb-1">Transaction ID:</p>
                <p className="font-mono text-[#0071e3] break-all">{txnId}</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Success State
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#fbfbfd]">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {admitCard ? (
            <>
              <AdmitCard data={admitCard} participantId={participantId ?? undefined} />
              <div className="mt-8">
                <SatyalokBadge variant="footer" />
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 px-4"
            >
              <div className="text-5xl mb-2">✅</div>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">Payment Successful!</h2>
              <p className="text-[#86868b]">
                Your registration is complete. Your admit card will be available shortly.
              </p>
              {txnId && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-[#1d1d1f] w-full">
                  <p className="font-medium mb-1">Transaction ID:</p>
                  <p className="font-mono text-[#0071e3] break-all">{txnId}</p>
                </div>
              )}
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-5 py-2.5 bg-[#0071e3] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Go to Home
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Failed State
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-[#fbfbfd]">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center gap-6 min-h-[60vh] justify-center"
          >
            <span className="text-6xl" role="img" aria-label="Payment failed">
              ❌
            </span>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mb-2">
                Payment Unsuccessful
              </h1>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Your payment could not be completed. No amount has been deducted. You can try again
                from the registration page.
              </p>
            </div>

            {txnId && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-[#1d1d1f] w-full">
                <p className="font-medium mb-1">Transaction ID:</p>
                <p className="font-mono text-[#ef4444] break-all">{txnId}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 w-full mt-4">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-6 bg-[#0071e3] text-white rounded-full text-sm font-semibold text-center hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
              <a
                href="mailto:contact@satyalok.in"
                className="w-full py-3 px-6 bg-transparent text-[#0066cc] border-2 border-[#d2d2d7] rounded-full text-sm font-medium text-center hover:border-[#0071e3] transition-colors"
              >
                Contact Support
              </a>
            </div>
          </motion.div>

          <div className="mt-8">
            <SatyalokBadge variant="footer" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 px-4"
        >
          <div className="text-5xl mb-2">⚠️</div>
          <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">Unable to Verify Payment</h2>
          <p className="text-[#ef4444]">{errorMessage}</p>
          <div className="flex flex-col gap-3 w-full mt-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-[#0071e3] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Retry Verification
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-6 bg-transparent text-[#0066cc] border-2 border-[#d2d2d7] rounded-full text-sm font-medium hover:border-[#0071e3] transition-colors"
            >
              Back to Home
            </button>
          </div>
        </motion.div>

        <div className="mt-8">
          <SatyalokBadge variant="footer" />
        </div>
      </div>
    </div>
  );
}
