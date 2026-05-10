import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdmitCard } from '../components/AdmitCard';
import { SatyalokBadge } from '../components/SatyalokBadge';
import { registrationApi } from '../api/client';
import { AdmitCardData } from '../types';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const participantId = searchParams.get('participantId');
  const txnId = searchParams.get('txnId');

  const [admitCard, setAdmitCard] = useState<AdmitCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // If we have participantId, use it directly
    if (participantId) {
      registrationApi
        .getAdmitCard(participantId)
        .then((res) => {
          setAdmitCard(res.data.admitCard);
        })
        .catch(() => {
          setError('Could not load your admit card. Please try refreshing the page.');
        })
        .finally(() => setLoading(false));
      return;
    }

    // If we have txnId, look up the participant by merchantTransactionId
    if (txnId) {
      // We need to add an endpoint to look up by txnId, or show a different message
      setError('Payment successful! Your registration is being processed. Please check your email for the admit card.');
      setLoading(false);
      return;
    }

    // No identifier provided
    setError('No participant ID or transaction ID found. Please contact support.');
    setLoading(false);
  }, [participantId, txnId]);

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-6 h-6 border-2 border-[#d2d2d7] border-t-[#0071e3] rounded-full animate-spin" />
            <p className="text-[#86868b] text-sm">Loading your admit card…</p>
          </div>
        )}

        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 px-4"
          >
            <div className="text-5xl mb-2">{txnId ? '✅' : '⚠️'}</div>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">
              {txnId ? 'Payment Successful!' : 'Unable to Load Admit Card'}
            </h2>
            <p className={txnId ? 'text-[#86868b]' : 'text-[#ef4444]'}>{error}</p>
            {txnId && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-[#1d1d1f] w-full">
                <p className="font-medium mb-1">Transaction ID:</p>
                <p className="font-mono text-[#0071e3] break-all">{txnId}</p>
              </div>
            )}
            {!txnId && (
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[#0071e3] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            )}
            <a
              href="/"
              className="text-[#0066cc] text-sm font-medium hover:opacity-75 transition-opacity mt-2"
            >
              ← Back to Home
            </a>
          </motion.div>
        )}

        {!loading && admitCard && (
          <>
            <AdmitCard data={admitCard} participantId={participantId ?? undefined} />
            <div className="mt-8">
              <SatyalokBadge variant="footer" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
