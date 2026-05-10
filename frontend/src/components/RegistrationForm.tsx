import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BatchType, RegistrationInput } from '../types';
import { registrationApi } from '../api/client';

type Errors = Partial<Record<keyof RegistrationInput, string>>;

interface Draft extends Partial<RegistrationInput> {
  participantId?: string;
  photoUrl?: string;
  paymentStatus?: string;
  merchantTransactionId?: string;
}

interface Props {
  batchType: BatchType;
  mobileNumber: string;
  sessionToken: string;
  draft?: Draft | null;
  onSuccess: (paymentSession: {
    redirectUrl: string;
    amount: number;
    participantId: string;
    merchantTransactionId: string;
    currency: string;
    provider: string;
  }) => void;
  onBack: () => void;
}

function validate(d: RegistrationInput): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = 'Name is required';
  else if (d.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
  if (!d.class.trim()) e.class = 'Class is required';
  if (!d.guardianName.trim()) e.guardianName = 'Guardian name is required';
  if (!d.address.trim()) e.address = 'Address is required';
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

function TInput({ value, onChange, placeholder, type, error, maxLength }: {
  value: string; onChange: (v: string) => void;
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

export function RegistrationForm({ batchType, mobileNumber, sessionToken, draft, onSuccess, onBack }: Props) {
  const [form, setForm] = useState<RegistrationInput>({
    name: draft?.name || '',
    class: draft?.class || '',
    batchType,
    guardianName: draft?.guardianName || '',
    address: draft?.address || '',
    mobileNumber,
    email: draft?.email || '',
    referralSource: draft?.referralSource || '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(draft?.photoUrl || null);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof RegistrationInput) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Accepted formats: JPEG, PNG, WebP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo must be under 2 MB');
      return;
    }
    setPhotoError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setSubmitting(true); setServerError('');

    try {
      // Build multipart form data
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('class', form.class.trim());
      fd.append('batchType', form.batchType);
      fd.append('guardianName', form.guardianName.trim());
      fd.append('address', form.address.trim());
      fd.append('mobileNumber', mobileNumber);
      if (form.email) fd.append('email', form.email.trim());
      if (form.referralSource) fd.append('referralSource', form.referralSource.trim());
      if (photoFile) fd.append('photo', photoFile);

      await registrationApi.saveDraft(fd, sessionToken);

      // Initiate payment
      const payRes = await registrationApi.initiatePayment(sessionToken);
      const { redirectUrl, amount, participantId, merchantTransactionId, currency, provider } = payRes.data;
      onSuccess({ redirectUrl, amount, participantId, merchantTransactionId, currency, provider });
    } catch (err: unknown) {
      setServerError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div className="w-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }}>
      <div className="mb-6 sm:mb-8">
        <button onClick={onBack} className="text-[#0066cc] text-sm font-medium mb-4 block hover:opacity-75 transition-opacity">← Back</button>
        <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-2">Step 3 of 3</p>
        <h2 className="text-[clamp(1.25rem,3vw,2rem)] font-bold tracking-tight text-[#1d1d1f] mb-1">Registration details</h2>
        <p className="text-[#86868b] text-sm">{batchType === 'JUNIOR' ? '🎓 Junior Batch · Classes 1–7' : '🏆 Senior Batch · Classes 8–12'}</p>
        {draft && <p className="text-xs text-[#0071e3] mt-1.5">✓ Draft loaded — your previous data has been pre-filled</p>}
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
        {/* Photo upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Photo for Admit Card</label>
          <div className="flex items-center gap-3 sm:gap-4">
            {photoPreview
              ? <img src={photoPreview} alt="Preview" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#d2d2d7]" />
              : <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-xl sm:text-2xl">📷</div>
            }
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="px-3 sm:px-4 py-1.5 border border-[#d2d2d7] rounded-full text-sm font-medium text-[#1d1d1f] hover:border-[#0071e3] transition-colors">
                {photoPreview ? 'Change photo' : 'Upload photo'}
              </button>
              <p className="text-xs text-[#86868b] mt-1">JPEG, PNG or WebP · max 2 MB · optional</p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
          {photoError && <p className="text-[#ef4444] text-xs mt-1.5">{photoError}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6">
          <Field label="Full Name" error={errors.name} required>
            <TInput value={form.name} onChange={set('name')} placeholder="Your full name" error={errors.name} />
          </Field>
          <Field label="Class" error={errors.class} required>
            <TInput value={form.class} onChange={set('class')} placeholder="e.g. Class 8" error={errors.class} />
          </Field>
          <Field label="Guardian Name" error={errors.guardianName} required>
            <TInput value={form.guardianName} onChange={set('guardianName')} placeholder="Parent / Guardian name" error={errors.guardianName} />
          </Field>
          <Field label="Mobile Number">
            <input value={mobileNumber} disabled className="w-full px-3.5 py-2.5 bg-[#f5f5f7] text-[#86868b] rounded-lg text-[0.95rem] border border-[#d2d2d7] cursor-not-allowed" />
          </Field>
        </div>

        <Field label="Address" error={errors.address} required>
          <TTextarea value={form.address} onChange={set('address')} placeholder="Your full address" error={errors.address} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6">
          <Field label="Email Address" error={errors.email}>
            <TInput value={form.email || ''} onChange={set('email')} placeholder="Optional" type="email" error={errors.email} />
          </Field>
          <Field label="Where did you hear about us?">
            <TSelect value={form.referralSource || ''} onChange={set('referralSource')} />
          </Field>
        </div>

        <motion.button type="submit" disabled={submitting}
          whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.98 }}
          className="mt-2 w-full py-3 px-6 bg-[#0071e3] text-white rounded-full text-[0.95rem] font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {submitting ? 'Saving & initiating payment…' : 'Save & Proceed to Payment →'}
        </motion.button>
      </form>
    </motion.div>
  );
}
