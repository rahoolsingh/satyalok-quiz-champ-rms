import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BatchType, RegistrationInput } from '../types';
import { registrationApi } from '../api/client';

type Errors = Partial<Record<keyof RegistrationInput, string>>;

function validate(d: RegistrationInput): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = 'Name is required';
  if (!d.class.trim()) e.class = 'Class is required';
  if (!d.guardianName.trim()) e.guardianName = 'Guardian name is required';
  if (!d.address.trim()) e.address = 'Address is required';
  if (!d.mobileNumber.trim()) e.mobileNumber = 'Mobile number is required';
  else if (!/^[6-9]\d{9}$/.test(d.mobileNumber.trim())) e.mobileNumber = 'Enter a valid 10-digit mobile number';
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Enter a valid email address';
  return e;
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#1d1d1f', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#0071e3', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 5 }} role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCss = (err: boolean, focused: boolean): React.CSSProperties => ({
  width: '100%', padding: '11px 14px',
  background: '#ffffff', color: '#1d1d1f',
  border: `1px solid ${err ? '#ef4444' : focused ? '#0071e3' : '#d2d2d7'}`,
  borderRadius: 8, fontSize: '0.95rem', lineHeight: 1.5,
  boxShadow: focused ? '0 0 0 3px rgba(0,113,227,0.2)' : 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
});

function Input({ field, value, onChange, placeholder, type, error, maxLength }: {
  field: keyof RegistrationInput; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; error?: string; maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type || 'text'}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={inputCss(!!error, focused)}
      aria-invalid={!!error}
    />
  );
}

function Textarea({ value, onChange, placeholder, error }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...inputCss(!!error, focused), height: 80, resize: 'vertical' }}
      aria-invalid={!!error}
    />
  );
}

function Select({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={inputCss(false, focused)}
    >
      <option value="">Select an option</option>
      {['Social Media', 'Friend / Family', 'School', 'Newspaper', 'Other'].map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

export function RegistrationForm({ batchType, onSuccess, onBack }: { batchType: BatchType; onSuccess: (m: string) => void; onBack: () => void }) {
  const [form, setForm] = useState<RegistrationInput>({ name: '', class: '', batchType, guardianName: '', address: '', mobileNumber: '', email: '', referralSource: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (k: keyof RegistrationInput) => (v: string) => setForm(f => ({ ...f, [k]: v }));

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
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }} style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#0066cc', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
          ← Back
        </button>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0071e3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Step 2 of 3</p>
        <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#1d1d1f', marginBottom: 4 }}>Registration details</h2>
        <p style={{ color: '#86868b', fontSize: '0.95rem' }}>
          {batchType === 'JUNIOR' ? '🎓 Junior Batch · Classes 1–7' : '🏆 Senior Batch · Classes 8–12'}
        </p>
      </div>

      <AnimatePresence>
        {serverError && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: '0.88rem', overflow: 'hidden' }} role="alert">
            {serverError}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 24px' }}>
          <Field label="Full Name" error={errors.name} required>
            <Input field="name" value={form.name} onChange={set('name')} placeholder="Your full name" error={errors.name} />
          </Field>
          <Field label="Class" error={errors.class} required>
            <Input field="class" value={form.class} onChange={set('class')} placeholder="e.g. Class 8" error={errors.class} />
          </Field>
          <Field label="Guardian Name" error={errors.guardianName} required>
            <Input field="guardianName" value={form.guardianName} onChange={set('guardianName')} placeholder="Parent / Guardian name" error={errors.guardianName} />
          </Field>
          <Field label="Mobile Number" error={errors.mobileNumber} required>
            <Input field="mobileNumber" value={form.mobileNumber} onChange={set('mobileNumber')} placeholder="10-digit mobile number" type="tel" maxLength={10} error={errors.mobileNumber} />
          </Field>
        </div>

        <Field label="Address" error={errors.address} required>
          <Textarea value={form.address} onChange={set('address')} placeholder="Your full address" error={errors.address} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 24px' }}>
          <Field label="Email Address" error={errors.email}>
            <Input field="email" value={form.email || ''} onChange={set('email')} placeholder="Optional" type="email" error={errors.email} />
          </Field>
          <Field label="Where did you hear about us?">
            <Select value={form.referralSource || ''} onChange={set('referralSource')} />
          </Field>
        </div>

        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ opacity: 0.88 }}
          whileTap={{ scale: 0.98 }}
          style={{ marginTop: 8, width: '100%', padding: '13px 24px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 20, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {submitting && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
          {submitting ? 'Sending OTP…' : 'Continue →'}
        </motion.button>
      </form>
    </motion.div>
  );
}
