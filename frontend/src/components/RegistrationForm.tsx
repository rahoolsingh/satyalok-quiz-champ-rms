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

function inputClass(err: boolean, focused: boolean) {
  return `w-full px-3.5 py-2.5 bg-white text-[#1d1d1f] rounded-lg text-[0.95rem] leading-relaxed transition-all outline-none
    ${err ? 'border border-[#ef4444]' : focused ? 'border border-[#0071e3] shadow-[0_0_0_3px_rgba(0,113,227,0.2)]' : 'border border-[#d2d2d7]'}`;
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
        {label}{required && <span className="text-[#0071e3] ml-0.5">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[#ef4444] text-xs mt-1.5" role="alert">{error}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function TInput({ field, value, onChange, placeholder, type, error, maxLength }: {
  field: keyof RegistrationInput; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; error?: string; maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} maxLength={maxLength}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      className={inputClass(!!error, focused)} aria-invalid={!!error} />
  );
}

function TTextarea({ value, onChange, placeholder, error }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      className={`${inputClass(!!error, focused)} h-20 resize-y`} aria-invalid={!!error} />
  );
}

function TSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      className={inputClass(false, focused)}>
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
    setErrors({}); setSubmitting(true); setServerError('');
    try {
      await registrationApi.submit(form);
      onSuccess(form.mobileNumber.trim());
    } catch (err: unknown) {
      setServerError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div className="w-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }}>
      <div className="mb-8">
        <button onClick={onBack} className="text-[#0066cc] text-sm font-medium mb-4 block hover:opacity-75 transition-opacity">← Back</button>
        <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-2">Step 2 of 3</p>
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[#1d1d1f] mb-1">Registration details</h2>
        <p className="text-[#86868b] text-sm">{batchType === 'JUNIOR' ? '🎓 Junior Batch · Classes 1–7' : '🏆 Senior Batch · Classes 8–12'}</p>
      </div>

      <AnimatePresence>
        {serverError && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 text-[#ef4444] px-4 py-3 rounded-lg mb-5 text-sm overflow-hidden" role="alert">
            {serverError}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Field label="Full Name" error={errors.name} required>
            <TInput field="name" value={form.name} onChange={set('name')} placeholder="Your full name" error={errors.name} />
          </Field>
          <Field label="Class" error={errors.class} required>
            <TInput field="class" value={form.class} onChange={set('class')} placeholder="e.g. Class 8" error={errors.class} />
          </Field>
          <Field label="Guardian Name" error={errors.guardianName} required>
            <TInput field="guardianName" value={form.guardianName} onChange={set('guardianName')} placeholder="Parent / Guardian name" error={errors.guardianName} />
          </Field>
          <Field label="Mobile Number" error={errors.mobileNumber} required>
            <TInput field="mobileNumber" value={form.mobileNumber} onChange={set('mobileNumber')} placeholder="10-digit mobile number" type="tel" maxLength={10} error={errors.mobileNumber} />
          </Field>
        </div>

        <Field label="Address" error={errors.address} required>
          <TTextarea value={form.address} onChange={set('address')} placeholder="Your full address" error={errors.address} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Field label="Email Address" error={errors.email}>
            <TInput field="email" value={form.email || ''} onChange={set('email')} placeholder="Optional" type="email" error={errors.email} />
          </Field>
          <Field label="Where did you hear about us?">
            <TSelect value={form.referralSource || ''} onChange={set('referralSource')} />
          </Field>
        </div>

        <motion.button type="submit" disabled={submitting}
          whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.98 }}
          className="mt-2 w-full py-3 px-6 bg-[#0071e3] text-white rounded-full text-[0.95rem] font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {submitting ? 'Sending OTP…' : 'Continue →'}
        </motion.button>
      </form>
    </motion.div>
  );
}
