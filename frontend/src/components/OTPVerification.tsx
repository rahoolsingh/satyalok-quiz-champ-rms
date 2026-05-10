import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registrationApi } from '../api/client';
import { PaymentSession } from '../types';

export function OTPVerification({ mobileNumber, onSuccess, onBack }: { mobileNumber: string; onSuccess: (s: PaymentSession) => void; onBack: () => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setTimer(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[i] = v; setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) { setDigits(p.split('')); refs.current[5]?.focus(); }
  };

  const otp = digits.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await registrationApi.verifyOtp(mobileNumber, otp);
      onSuccess(res.data.paymentSession);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Verification failed');
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const masked = mobileNumber.replace(/(\d{2})\d{6}(\d{2})/, '$1 xxxxxx $2');

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }} style={{ width: '100%' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#0066cc', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', padding: 0, marginBottom: 24 }}>
        ← Back
      </button>

      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0071e3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Step 2 of 3</p>
      <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#1d1d1f', marginBottom: 8 }}>Verify your number</h2>
      <p style={{ color: '#86868b', fontSize: '0.95rem', marginBottom: 32, lineHeight: 1.5 }}>
        We sent a 6-digit code to <strong style={{ color: '#1d1d1f' }}>{masked}</strong>
      </p>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ color: '#ef4444', fontSize: '0.88rem', marginBottom: 16 }} role="alert">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              maxLength={1}
              inputMode="numeric"
              aria-label={`OTP digit ${i + 1}`}
              style={{
                width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
                background: '#ffffff', color: '#1d1d1f',
                border: `1px solid ${d ? '#0071e3' : '#d2d2d7'}`,
                borderRadius: 8,
                boxShadow: d ? '0 0 0 3px rgba(0,113,227,0.15)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />
          ))}
        </div>

        <motion.button
          type="submit"
          disabled={loading || otp.length < 6}
          whileHover={{ opacity: otp.length === 6 ? 0.88 : 1 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%', padding: '13px 24px', background: otp.length < 6 ? '#d2d2d7' : '#0071e3', color: otp.length < 6 ? '#86868b' : '#fff', border: 'none', borderRadius: 20, fontSize: '0.95rem', fontWeight: 600, cursor: otp.length < 6 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}
        >
          {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
          {loading ? 'Verifying…' : 'Verify & Continue →'}
        </motion.button>
      </form>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        {canResend
          ? <button onClick={() => { setCanResend(false); setTimer(30); }} style={{ background: 'none', border: 'none', color: '#0066cc', fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem' }}>Resend OTP</button>
          : <p style={{ color: '#86868b', fontSize: '0.88rem' }}>Resend in <span style={{ color: '#1d1d1f', fontWeight: 500 }}>{timer}s</span></p>
        }
      </div>
    </motion.div>
  );
}
