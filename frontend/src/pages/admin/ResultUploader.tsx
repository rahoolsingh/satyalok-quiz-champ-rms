import React, { useState } from 'react';
import { adminApi } from '../../api/client';

export function ResultUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [pubDate, setPubDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [invalidRolls, setInvalidRolls] = useState<string[]>([]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a CSV file'); return; }
    setUploading(true); setMessage(''); setError(''); setInvalidRolls([]);
    const fd = new FormData(); fd.append('file', file);
    try { const r = await adminApi.uploadResults(fd); setMessage(r.data.message); }
    catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string; invalidRollNumbers?: string[] } } })?.response?.data;
      setError(d?.error || 'Upload failed');
      if (d?.invalidRollNumbers) setInvalidRolls(d.invalidRollNumbers);
    } finally { setUploading(false); }
  };

  const handlePublish = async () => {
    setPublishing(true); setMessage(''); setError('');
    try { await adminApi.publishResults(pubDate || undefined); setMessage('Results published successfully'); }
    catch { setError('Failed to publish results'); } finally { setPublishing(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-white border border-[#d2d2d7] rounded-lg text-sm focus:border-[#0071e3] outline-none transition-all";

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Result Management</h2>
      {message && <p className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm mb-4">{message}</p>}
      {error && <p className="bg-red-50 border border-red-200 text-[#ef4444] px-4 py-2.5 rounded-lg text-sm mb-4">{error}</p>}
      {invalidRolls.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg text-sm mb-4">
          <strong>Invalid Roll Numbers:</strong>
          <ul className="mt-1 list-disc pl-4">{invalidRolls.map(r => <li key={r}>{r}</li>)}</ul>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 mb-4 border border-[#d2d2d7]">
        <h3 className="font-semibold text-[#1d1d1f] mb-1.5">Upload Results (CSV)</h3>
        <p className="text-[#86868b] text-xs mb-4">Format: <code className="bg-[#f5f5f7] px-1.5 py-0.5 rounded">rollNumber,score,rank,remarks</code></p>
        <form onSubmit={handleUpload} className="space-y-3">
          <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm text-[#86868b]" />
          <button type="submit" disabled={uploading || !file} className="px-5 py-2 bg-[#0071e3] text-white rounded-full text-sm font-semibold disabled:opacity-60">
            {uploading ? 'Uploading…' : 'Upload Results'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[#d2d2d7]">
        <h3 className="font-semibold text-[#1d1d1f] mb-1.5">Publish Results</h3>
        <p className="text-[#86868b] text-xs mb-4">Set a date or publish immediately.</p>
        <div className="mb-3">
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Publication Date (optional)</label>
          <input type="datetime-local" value={pubDate} onChange={e => setPubDate(e.target.value)} className={inputCls} />
        </div>
        <button onClick={handlePublish} disabled={publishing} className="px-5 py-2 bg-[#10b981] text-white rounded-full text-sm font-semibold disabled:opacity-60">
          {publishing ? 'Publishing…' : '🚀 Publish Results Now'}
        </button>
      </div>
    </div>
  );
}
