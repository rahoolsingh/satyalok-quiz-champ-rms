import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PaymentSession, AdmitCardData } from '../types';
import { registrationApi } from '../api/client';

export function PaymentGateway({ session, onSuccess, onFailure }: { session: PaymentSession; onSuccess: (c: AdmitCardData) => void; onFailure: (e: string) => void }) {
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    try {
      const res = await registrationApi.confirmPayment({ participantId: session.participantId, sessionId: session.sessionId, providerPaymentId: `mock_pay_${Date.now()}`, providerSignature: 'mock_signature' });
      onSuccess(res.data.admitCard);
    } catch (err: unknown) {
      onFailure((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Payment failed');
    } finally { setProcessing(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }} style={{ width: '100%' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0071e3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Step 3 of 3</p>
      <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#1d1d1f', marginBottom: 8 }}>Complete payment</h2>
      <p style={{ color: '#86868b', fontSize: '0.95rem', marginBottom: 32 }}>Secure your spot at Quiz Champ 2026</p>

      {/* Summary */}
      <div style={{ borderTop: '1px solid #d2d2d7', borderBottom: '1px solid #d2d2d7', padding: '16px 0', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: '#86868b', fontSize: '0.95rem' }}>Registration Fee</span>
          <span style={{ color: '#1d1d1f', fontWeight: 500 }}>₹{session.amount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, color: '#1d1d1f' }}>Total</span>
          <span style={{ fontWeight: 700, color: '#1d1d1f', fontSize: '1.05rem' }}>₹{session.amount}</span>
        </div>
      </div>

      <p style={{ color: '#86868b', fontSize: '0.82rem', marginBottom: 20, textAlign: 'center' }}>
        🔒 Secured by {session.provider === 'mock' ? 'Demo Gateway' : 'Razorpay'}
      </p>

      <motion.button
        onClick={handlePay}
        disabled={processing}
        whileHover={{ opacity: 0.88 }}
        whileTap={{ scale: 0.98 }}
        style={{ width: '100%', padding: '13px 24px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 20, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        aria-label="Pay and complete registration"
      >
        {processing && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
        {processing ? 'Processing…' : `Pay ₹${session.amount} & Register`}
      </motion.button>

      <p style={{ textAlign: 'center', color: '#86868b', fontSize: '0.78rem', marginTop: 14 }}>
        By completing payment you agree to the event terms and conditions.
      </p>
    </motion.div>
  );
}
