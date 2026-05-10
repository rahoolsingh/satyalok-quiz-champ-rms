import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PaymentSession, AdmitCardData } from '../types';
import { registrationApi } from '../api/client';

interface PaymentGatewayProps {
  session: PaymentSession;
  onSuccess: (admitCard: AdmitCardData) => void;
  onFailure: (error: string) => void;
}

export function PaymentGateway({ session, onSuccess, onFailure }: PaymentGatewayProps) {
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    try {
      const res = await registrationApi.confirmPayment({
        participantId: session.participantId,
        sessionId: session.sessionId,
        providerPaymentId: `mock_pay_${Date.now()}`,
        providerSignature: 'mock_signature',
      });
      onSuccess(res.data.admitCard);
    } catch (err: unknown) {
      onFailure((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div style={wrap} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.div
            style={iconCircle}
            animate={{ boxShadow: ['0 0 20px rgba(16,185,129,0.3)', '0 0 50px rgba(16,185,129,0.6)', '0 0 20px rgba(16,185,129,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💳
          </motion.div>
          <p style={stepLabel}>Step 3 of 3</p>
          <h2 style={title}>Complete Payment</h2>
          <p style={sub}>Secure your spot at Quiz Champ 2026</p>
        </div>

        {/* Summary */}
        <div style={summary}>
          <div style={summaryRow}>
            <span style={{ color: '#94a3b8' }}>Registration Fee</span>
            <span style={{ color: '#f1f5f9', fontWeight: 600 }}>₹{session.amount}</span>
          </div>
          <div style={divider} />
          <div style={summaryRow}>
            <span style={{ color: '#f1f5f9', fontWeight: 700 }}>Total</span>
            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem' }}>₹{session.amount}</span>
          </div>
        </div>

        {/* Security note */}
        <div style={secNote}>
          <span>🔒</span>
          <span>Secured by {session.provider === 'mock' ? 'Demo Gateway' : 'Razorpay'} · 256-bit SSL</span>
        </div>

        <motion.button
          style={payBtn}
          onClick={handlePay}
          disabled={processing}
          whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(16,185,129,0.4)' }}
          whileTap={{ scale: 0.98 }}
          aria-label="Pay and complete registration"
        >
          {processing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
              <span style={spinner} /> Processing...
            </span>
          ) : `Pay ₹${session.amount} & Register`}
        </motion.button>

        <p style={disclaimer}>
          By completing payment you agree to the event terms and conditions.
        </p>
      </div>
    </motion.div>
  );
}

const wrap: React.CSSProperties = { padding: '20px', maxWidth: '440px', margin: '0 auto' };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px' };
const iconCircle: React.CSSProperties = { width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' };
const stepLabel: React.CSSProperties = { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#10b981', marginBottom: '6px' };
const title: React.CSSProperties = { fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' };
const sub: React.CSSProperties = { color: '#64748b', fontSize: '0.9rem' };
const summary: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', marginBottom: '16px' };
const summaryRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' };
const divider: React.CSSProperties = { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '10px 0' };
const secNote: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.82rem', justifyContent: 'center', marginBottom: '20px' };
const payBtn: React.CSSProperties = { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', border: 'none' };
const spinner: React.CSSProperties = { width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' };
const disclaimer: React.CSSProperties = { textAlign: 'center', color: '#334155', fontSize: '0.75rem', marginTop: '16px' };
