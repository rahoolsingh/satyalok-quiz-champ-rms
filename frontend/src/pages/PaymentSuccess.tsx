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

  const [admitCard, setAdmitCard] = useState<AdmitCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!participantId) {
      setError('No participant ID found. Please contact support.');
      setLoading(false);
      return;
    }

    registrationApi
      .getAdmitCard(participantId)
      .then((res) => {
        setAdmitCard(res.data.admitCard);
      })
      .catch(() => {
        setError('Could not load your admit card. Please try refreshing the page.');
      })
      .finally(() => setLoading(false));
  }, [participantId]);

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <div className="max-w-2xl mx-auto px-6 py-[clamp(32px,5vw,64px)]">
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
            className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4"
          >
            <p className="text-[#ef4444]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#0071e3] text-white rounded-full font-semibold text-sm"
            >
              Retry
            </button>
          </motion.div>
        )}

        {!loading && admitCard && (
          <>
            <AdmitCard data={admitCard} participantId={participantId ?? undefined} />
            <SatyalokBadge variant="footer" />
          </>
        )}
      </div>
    </div>
  );
}
