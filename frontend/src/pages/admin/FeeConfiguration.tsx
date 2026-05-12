import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';

export function FeeConfiguration() {
  const [feeJunior, setFeeJunior] = useState('');
  const [feeSenior, setFeeSenior] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getFees().then(r => {
      setFeeJunior(String(r.data.feeJunior));
      setFeeSenior(String(r.data.feeSenior));
    }).catch(() => {
      setFeeJunior('100');
      setFeeSenior('150');
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const junior = Number(feeJunior);
    const senior = Number(feeSenior);
    if (!junior || !senior || junior <= 0 || senior <= 0) {
      setError('Both fees must be positive numbers');
      return;
    }
    setSaving(true); setMessage(''); setError('');
    try {
      await adminApi.updateFees(junior, senior);
      setMessage('Fees updated successfully');
    } catch {
      setError('Failed to update fees');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-white border border-[#d2d2d7] rounded-lg text-sm focus:border-[#0071e3] outline-none transition-all";

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Registration Fee Configuration</h2>

      {message && <p className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm mb-4">{message}</p>}
      {error && <p className="bg-red-50 border border-red-200 text-[#ef4444] px-4 py-2.5 rounded-lg text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl p-6 border border-[#d2d2d7]">
        <h3 className="font-semibold text-[#1d1d1f] mb-1.5">Batch Fees (₹ INR)</h3>
        <p className="text-[#86868b] text-sm mb-5">
          Set the registration fee for each batch. Changes take effect immediately for new registrations.
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                Junior Batch Fee (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={feeJunior}
                  onChange={e => setFeeJunior(e.target.value)}
                  className={`${inputCls} pl-7`}
                  placeholder="100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                Senior Batch Fee (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={feeSenior}
                  onChange={e => setFeeSenior(e.target.value)}
                  className={`${inputCls} pl-7`}
                  placeholder="150"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#0071e3] text-white rounded-full text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Fees'}
            </button>
            <p className="text-[#86868b] text-xs">
              Current: Junior ₹{feeJunior || '—'} · Senior ₹{feeSenior || '—'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
