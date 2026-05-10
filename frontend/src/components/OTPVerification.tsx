import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registrationApi } from '../api/client';
import { PaymentSession } from '../types';

interface OTPVerificationProps {
  mobileNumber: string;
  onSuccess: (session: PaymentSession) => void;
  onBack: () => void;
}

export function OTPVerification({ mobileNumber, onSuccess, onBack }: OTPVerificationProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setResendTimer(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleDigit = (i: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const otp = digits.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await registrationApi.verifyOtp(mobileNumber, otp);
      onSuccess(res.data.paymentSession);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'OTP verification failed');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const maskedNumber = mobileNumber.replace(/(\d{2})\d{6}(\d{2})/, '$1 xxxxxx $2');

  return (
    <motion.div style={wrap} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div style={card}>
        <motion.button onClick={onBack} style={backBtn} whileHover={{ x: -3 }}>← Back</motion.button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.div
            style={iconCircle}
            animate={{ boxShadow: ['0 0 20px rgba(108,59,255,0.3)', '0 0 50px rgba(108,59,255,0.6)', '0 0 20px rgba(108,59,255,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            📱
          </motion.div>
          <p style={stepLabel}>Step 2 of 3</p>
          <h2 style={title}>Verify Your Number</h2>
          <p style={sub}>
            We sent a 6-digit OTP to <strong style={{ color: '#a78bfa' }}>{maskedNumber}</strong>
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div style={errBox} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert">
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div style={otpRow} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <motion.input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                style={{ ...digitInput, borderColor: d ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                maxLength={1}
                inputMode="numeric"
                aria-label={`OTP digit ${i + 1}`}
                whileFocus={{ scale: 1.08, borderColor: '#8b5cf6' }}
              />
            ))}
          </div>

          <motion.button
            type="submit"
            style={{ ...submitBtn, opacity: otp.length < 6 ? 0.6 : 1 }}
            disabled={loading || otp.length < 6}
            whileHover={otp.length === 6 ? { scale: 1.02, boxShadow: '0 8px 30px rgba(108,59,255,0.5)' } : {}}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span style={spinner} /> Verifying...
              </span>
            ) : 'Verify & Continue →'}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          {canResend ? (
            <motion.button
              style={resendBtn}
              onClick={() => { setCanResend(false); setResendTimer(30); }}
              whileHover={{ color: '#a78bfa' }}
            >
              Resend OTP
            </motion.button>
          ) : (
            <p style={{ color: '#475569', fontSize: '0.85rem' }}>
              Resend OTP in <span style={{ color: '#8b5cf6' }}>{resendTimer}s</span>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const wrap: React.CSSProperties = { padding: '20px', maxWidth: '460px', margin: '0 auto' };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px' };
const backBtn: React.CSSProperties = { background: 'none', color: '#8b5cf6', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: '20px', display: 'block' };
const iconCircle: React.CSSProperties = { width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(108,59,255,0.15)', border: '1px solid rgba(108,59,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' };
const stepLabel: React.CSSProperties = { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#8b5cf6', marginBottom: '6px' };
const title: React.CSSProperties = { fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' };
const sub: React.CSSProperties = { color: '#64748b', fontSize: '0.9rem' };
const errBox: React.CSSProperties = { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.88rem' };
const otpRow: React.CSSProperties = { display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '28px' };
const digitInput: React.CSSProperties = { width: '52px', height: '60px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9', transition: 'border-color 0.2s' };
const submitBtn: React.CSSProperties = { width: '100%', padding: '15px', background: 'linear-gradient(135deg, #6c3bff, #8b5cf6)', color: 'white', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', border: 'none' };
const spinner: React.CSSProperties = { width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' };
const resendBtn: React.CSSProperties = { background: 'none', color: '#8b5cf6', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' };
