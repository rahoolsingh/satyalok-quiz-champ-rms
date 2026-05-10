import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { otpApi } from '../api/client';
import { RegistrationInput } from '../types';

interface OTPResult {
  sessionToken: string;
  draft: (Partial<RegistrationInput> & { participantId?: string; photoUrl?: string; paymentStatus?: string; merchantTransactionId?: string }) | null;
}

export function OTPVerification({
  mobileNumber,
  onSuccess,
  onBack,
}: {
  mobileNumber: string;
  onSuccess: (result: OTPResult) => void;
  onBack: () => void;
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
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
      const res = await otpApi.verify(mobileNumber, otp);
      onSuccess({ sessionToken: res.data.sessionToken, draft: res.data.draft });
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Verification failed');
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError('');
    try {
      await otpApi.send(mobileNumber);
      setCanResend(false); setTimer(60);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; retryAfterSeconds?: number } } };
      const wait = e.response?.data?.retryAfterSeconds;
      setError(e.response?.data?.error || 'Failed to resend OTP');
      if (wait) { setTimer(wait); setCanResend(false); }
    } finally { setResending(false); }
  };

  const masked = mobileNumber.replace(/^(\d{2})\d{6}(\d{2})$/, '$1 xxxxxx $2');

  return (
    <motion.div className="w-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }}>
      <button onClick={onBack} className="text-[#0066cc] text-sm font-medium mb-6 block hover:opacity-75 transition-opacity">← Back</button>

      <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-2">Step 2 of 3</p>
      <h2 className="text-[clamp(1.25rem,3vw,2rem)] font-bold tracking-tight text-[#1d1d1f] mb-2">Verify your number</h2>
      <p className="text-[#86868b] text-sm mb-6 sm:mb-8 leading-relaxed">
        We sent a 6-digit code to <strong className="text-[#1d1d1f] font-semibold">{masked}</strong>
      </p>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[#ef4444] text-sm mb-4" role="alert">{error}</motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 sm:gap-2.5 mb-6 sm:mb-7" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input key={i} ref={el => { refs.current[i] = el; }} value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              maxLength={1} inputMode="numeric" aria-label={`OTP digit ${i + 1}`}
              className={`flex-1 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-white text-[#1d1d1f] rounded-lg outline-none transition-all
                ${d ? 'border-2 border-[#0071e3] shadow-[0_0_0_3px_rgba(0,113,227,0.15)]' : 'border border-[#d2d2d7]'}`}
            />
          ))}
        </div>

        <motion.button type="submit" disabled={loading || otp.length < 6}
          whileHover={{ opacity: otp.length === 6 ? 0.88 : 1 }} whileTap={{ scale: 0.98 }}
          className={`w-full py-3 px-6 rounded-full text-[0.95rem] font-semibold flex items-center justify-center gap-2 transition-colors
            ${otp.length < 6 ? 'bg-[#d2d2d7] text-[#86868b] cursor-default' : 'bg-[#0071e3] text-white cursor-pointer'}`}>
          {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {loading ? 'Verifying…' : 'Verify & Continue →'}
        </motion.button>
      </form>

      <div className="mt-5 text-center">
        {canResend
          ? <button onClick={handleResend} disabled={resending}
              className="text-[#0066cc] text-sm font-medium hover:opacity-75 transition-opacity disabled:opacity-50">
              {resending ? 'Sending…' : 'Resend OTP'}
            </button>
          : <p className="text-[#86868b] text-sm">Resend in <span className="text-[#1d1d1f] font-medium">{timer}s</span></p>
        }
      </div>
    </motion.div>
  );
}
