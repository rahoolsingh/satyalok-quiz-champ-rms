import React, { useState, useEffect } from 'react';
import { adminApi, portalApi } from '../../api/client';

export function DateConfiguration() {
  const [openingDate, setOpeningDate] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [manualStatus, setManualStatus] = useState('AUTO');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    portalApi.getStatus().then(r => {
      setOpeningDate(r.data.openingDate?.slice(0, 16) || '');
      setClosingDate(r.data.closingDate?.slice(0, 16) || '');
    }).catch(() => {});
  }, []);

  const saveDates = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage(''); setError('');
    try { await adminApi.updateDates(openingDate, closingDate); setMessage('Dates updated successfully'); }
    catch { setError('Failed to update dates'); } finally { setSaving(false); }
  };

  const saveStatus = async () => {
    setSaving(true); setMessage(''); setError('');
    try { await adminApi.updateStatus(manualStatus); setMessage('Portal status updated'); }
    catch { setError('Failed to update status'); } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-white border border-[#d2d2d7] rounded-lg text-sm focus:border-[#0071e3] outline-none transition-all";

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Portal Date Configuration</h2>
      {message && <p className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm mb-4">{message}</p>}
      {error && <p className="bg-red-50 border border-red-200 text-[#ef4444] px-4 py-2.5 rounded-lg text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl p-6 mb-4 border border-[#d2d2d7]">
        <h3 className="font-semibold text-[#1d1d1f] mb-4">Registration Dates</h3>
        <form onSubmit={saveDates} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Opening Date & Time</label>
            <input type="datetime-local" value={openingDate} onChange={e => setOpeningDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Closing Date & Time</label>
            <input type="datetime-local" value={closingDate} onChange={e => setClosingDate(e.target.value)} className={inputCls} />
          </div>
          <button type="submit" disabled={saving} className="px-5 py-2 bg-[#0071e3] text-white rounded-full text-sm font-semibold disabled:opacity-60">Save Dates</button>
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[#d2d2d7]">
        <h3 className="font-semibold text-[#1d1d1f] mb-1.5">Manual Status Override</h3>
        <p className="text-[#86868b] text-sm mb-4">Use AUTO to let dates control the portal automatically.</p>
        <div className="flex gap-2 flex-wrap mb-4">
          {['AUTO', 'COUNTDOWN', 'OPEN', 'CLOSED'].map(s => (
            <button key={s} onClick={() => setManualStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                ${manualStatus === s ? 'bg-[#0071e3] text-white border-[#0071e3]' : 'bg-white text-[#1d1d1f] border-[#d2d2d7] hover:border-[#0071e3]'}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={saveStatus} disabled={saving} className="px-5 py-2 bg-[#0071e3] text-white rounded-full text-sm font-semibold disabled:opacity-60">Apply Status</button>
      </div>
    </div>
  );
}
