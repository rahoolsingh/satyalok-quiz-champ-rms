import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BatchType, RegistrationInput } from '../types';
import { registrationApi } from '../api/client';

interface RegistrationFormProps {
  batchType: BatchType;
  onSuccess: (mobileNumber: string) => void;
  onBack: () => void;
}

type FormErrors = Partial<Record<keyof RegistrationInput, string>>;

function validate(data: RegistrationInput): FormErrors {
  const e: FormErrors = {};
  if (!data.name.trim()) e.name = 'Name is required';
  if (!data.class.trim()) e.class = 'Class is required';
  if (!data.guardianName.trim()) e.guardianName = 'Guardian name is required';
  if (!data.address.trim()) e.address = 'Address is required';
  if (!data.mobileNumber.trim()) e.mobileNumber = 'Mobile number is required';
  else if (!/^[6-9]\d{9}$/.test(data.mobileNumber.trim())) e.mobileNumber = 'Enter a valid 10-digit mobile number';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email';
  return e;
}

const fields: { key: keyof RegistrationInput; label: string; placeholder: string; required: boolean; type?: string; multiline?: boolean }[] = [
  { key: 'name', label: 'Full Name', placeholder: 'Enter your full name', required: true },
  { key: 'class', label: 'Class', placeholder: 'e.g. Class 8', required: true },
  { key: 'guardianName', label: 'Guardian Name', placeholder: 'Parent / Guardian name', required: true },
  { key: 'address', label: 'Address', placeholder: 'Your full address', required: true, multiline: true },
  { key: 'mobileNumber', label: 'Mobile Number', placeholder: '10-digit mobile number', required: true, type: 'tel' },
  { key: 'email', label: 'Email Address', placeholder: 'email@example.com (optional)', required: false, type: 'email' },
];

export function RegistrationForm({ batchType, onSuccess, onBack }: RegistrationFormProps) {
  const [form, setForm] = useState<RegistrationInput>({
    name: '', class: '', batchType, guardianName: '',
    address: '', mobileNumber: '', email: '', referralSource: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (k: keyof RegistrationInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    setServerError('');
    try {
      await registrationApi.submit(form);
      onSuccess(form.mobileNumber.trim());
    } catch (err: unknown) {
      setServerError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div style={wrap} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}>
      <div style={card}>
        {/* Header */}
        <div style={header}>
          <motion.button onClick={onBack} style={backBtn} whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}>
            ← Back
          </motion.button>
          <div>
            <p style={stepLabel}>Step 2 of 3</p>
            <h2 style={cardTitle}>Registration Details</h2>
            <span style={batchBadge(batchType)}>{batchType === 'JUNIOR' ? '🎓 Junior Batch' : '🏆 Senior Batch'}</span>
          </div>
        </div>

        <AnimatePresence>
          {serverError && (
            <motion.div style={errBox} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} role="alert">
              ⚠️ {serverError}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldGrid}>
            {fields.map((f, i) => (
              <motion.div
                key={f.key}
                style={f.multiline ? { gridColumn: '1 / -1' } : {}}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <label style={labelStyle}>
                  {f.label} {f.required && <span style={{ color: '#8b5cf6' }}>*</span>}
                </label>
                {f.multiline ? (
                  <textarea
                    style={{ ...inputStyle(!!errors[f.key]), height: '80px', resize: 'vertical' }}
                    value={form[f.key] as string}
                    onChange={set(f.key)}
                    placeholder={f.placeholder}
                    aria-required={f.required}
                  />
                ) : (
                  <input
                    style={inputStyle(!!errors[f.key])}
                    type={f.type || 'text'}
                    value={form[f.key] as string}
                    onChange={set(f.key)}
                    placeholder={f.placeholder}
                    maxLength={f.key === 'mobileNumber' ? 10 : undefined}
                    aria-required={f.required}
                  />
                )}
                <AnimatePresence>
                  {errors[f.key] && (
                    <motion.p style={errMsg} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert">
                      {errors[f.key]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Referral */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <label style={labelStyle}>Where did you hear about us?</label>
              <select style={inputStyle(false)} value={form.referralSource} onChange={set('referralSource')}>
                <option value="">Select an option</option>
                {['Social Media', 'Friend / Family', 'School', 'Newspaper', 'Other'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </motion.div>
          </div>

          <motion.button
            type="submit"
            style={submitBtn}
            disabled={submitting}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(108,59,255,0.5)' }}
            whileTap={{ scale: 0.98 }}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span style={spinner} /> Sending OTP...
              </span>
            ) : 'Continue to Verify →'}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: `1.5px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '10px', fontSize: '0.95rem', color: '#f1f5f9',
    transition: 'border-color 0.2s',
  };
}

function batchBadge(b: BatchType): React.CSSProperties {
  return {
    display: 'inline-block', marginTop: '6px',
    padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
    background: b === 'JUNIOR' ? 'rgba(6,182,212,0.15)' : 'rgba(168,85,247,0.15)',
    color: b === 'JUNIOR' ? '#06b6d4' : '#a78bfa',
    border: `1px solid ${b === 'JUNIOR' ? 'rgba(6,182,212,0.3)' : 'rgba(168,85,247,0.3)'}`,
  };
}

const wrap: React.CSSProperties = { padding: '20px', maxWidth: '640px', margin: '0 auto' };
const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px',
};
const header: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' };
const backBtn: React.CSSProperties = { background: 'none', color: '#8b5cf6', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', padding: '4px', marginTop: '4px', flexShrink: 0 };
const stepLabel: React.CSSProperties = { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#8b5cf6', marginBottom: '4px' };
const cardTitle: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' };
const errBox: React.CSSProperties = { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem', overflow: 'hidden' };
const fieldGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const errMsg: React.CSSProperties = { color: '#f87171', fontSize: '0.78rem', marginTop: '4px' };
const submitBtn: React.CSSProperties = { width: '100%', padding: '15px', background: 'linear-gradient(135deg, #6c3bff, #8b5cf6)', color: 'white', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', border: 'none' };
const spinner: React.CSSProperties = { width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' };
