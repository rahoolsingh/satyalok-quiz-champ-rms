import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { otpApi } from '../api/client';
import { ProfileData } from '../types';

interface OTPResult {
  sessionToken: string;
  profile: ProfileData | null;
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
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const next = [...digits];
      for (let j = 0; j < cleaned.length && (i + j) < 6; j++) {
        next[i + j] = cleaned[j];
      }
      setDigits(next);
      const focusIdx = Math.min(i + cleaned.length, 5);
      refs.current[focusIdx]?.focus();
      return;
    }
    const v = cleaned.slice(-1);
    const next = [...digits]; next[i] = v; setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length > 0) {
      const next = [...digits];
      for (let i = 0; i < p.length && i < 6; i++) next[i] = p[i];
      setDigits(next);
      refs.current[Math.min(p.length, 5)]?.focus();
    }
  };

  const otp = digits.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await otpApi.verify(mobileNumber, otp);
      onSuccess({ sessionToken: res.data.sessionToken, profile: res.data.profile });
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

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-[#0071e3] text-[15px] font-medium mb-7 flex items-center gap-1.5 hover:opacity-70 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 bg-[#0071e3]/8 rounded-full text-[12px] font-semibold text-[#0071e3] tracking-wide">
            Step 2 of 3
          </span>
        </div>
        <h2 className="text-[26px] font-bold tracking-tight text-[#1d1d1f] leading-tight mb-2">
          Verify your number
        </h2>
        <p className="text-[15px] text-[#86868b] leading-relaxed">
          Enter the 6-digit code sent to{' '}
          <span className="text-[#1d1d1f] font-semibold">{mobileNumber}</span>
          <button onClick={onBack} className="ml-2 text-[#0071e3] text-[13px] font-medium hover:opacity-70 transition-opacity">
            Edit
          </button>
        </p>
      </header>

      {/* WhatsApp hint */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f5f5f7] rounded-[12px] mb-7 border border-[#e8e8ed]">
        <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
        <span className="text-[14px] text-[#424245]">Check your WhatsApp messages</span>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-red-50 border border-red-200/80 px-4 py-3 rounded-[12px] mb-6"
            role="alert"
          >
            <p className="text-[14px] text-red-700 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OTP Input */}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 sm:gap-3 mb-7 justify-center">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label={`OTP digit ${i + 1}`}
              className={`w-11 h-[52px] sm:w-[52px] sm:h-[58px] text-center text-[22px] font-bold bg-white text-[#1d1d1f] rounded-[12px] outline-none transition-all duration-200
                ${d
                  ? 'border-[2px] border-[#0071e3] shadow-[0_0_0_3px_rgba(0,113,227,0.08)]'
                  : 'border-[1.5px] border-[#d2d2d7] focus:border-[#0071e3] focus:shadow-[0_0_0_3px_rgba(0,113,227,0.08)]'
                }`}
            />
          ))}
        </div>

        <motion.button
          type="submit"
          disabled={loading || otp.length < 6}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-[14px] px-6 rounded-[14px] text-[16px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-200
            ${otp.length < 6
              ? 'bg-[#f5f5f7] text-[#c7c7cc] cursor-not-allowed'
              : 'bg-[#0071e3] hover:bg-[#005bb5] text-white shadow-[0_2px_8px_rgba(0,113,227,0.25)]'
            }
          `}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify & Continue'
          )}
        </motion.button>
      </form>

      {/* Resend */}
      <div className="mt-6 text-center">
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-[#0071e3] text-[14px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40"
          >
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>
        ) : (
          <p className="text-[14px] text-[#86868b]">
            Resend in <span className="text-[#1d1d1f] font-semibold tabular-nums">{timer}s</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}
