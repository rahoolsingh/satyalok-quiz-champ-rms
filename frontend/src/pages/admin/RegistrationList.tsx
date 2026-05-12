import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/client';

interface Participant {
  id: string; rollNumber: string | null; name: string; class: string;
  batchType: string; guardianName: string; mobileNumber: string;
  email: string | null; paymentStatus: string; createdAt: string;
}

interface Response {
  participants: Participant[]; total: number; page: number; limit: number;
  counts: { junior: number; senior: number };
}

const statusColor: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
};

export function RegistrationList() {
  const [data, setData] = useState<Response | null>(null);
  const [search, setSearch] = useState('');
  const [batch, setBatch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await adminApi.getRegistrations({ search: search || undefined, batch: batch || undefined, page, limit: 20 }); setData(r.data); }
    catch { /* ignore */ } finally { setLoading(false); }
  }, [search, batch, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Registrations</h2>

      {data && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          {[{ label: 'Junior', val: data.counts.junior }, { label: 'Senior', val: data.counts.senior }, { label: 'Total', val: data.counts.junior + data.counts.senior }].map(c => (
            <div key={c.label} className="bg-white border border-[#d2d2d7] rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#1d1d1f]">{c.val}</p>
              <p className="text-[10px] sm:text-xs text-[#86868b] uppercase tracking-wider mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, roll number, or mobile…"
          className="flex-1 min-w-[200px] px-3.5 py-2.5 bg-white border border-[#d2d2d7] rounded-lg text-sm focus:border-[#0071e3] outline-none transition-all" />
        <select value={batch} onChange={e => { setBatch(e.target.value); setPage(1); }}
          className="px-3.5 py-2.5 bg-white border border-[#d2d2d7] rounded-lg text-sm focus:border-[#0071e3] outline-none transition-all" aria-label="Filter by batch">
          <option value="">All Batches</option>
          <option value="JUNIOR">Junior</option>
          <option value="SENIOR">Senior</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#d2d2d7] overflow-hidden overflow-x-auto">
        {loading
          ? <p className="p-5 text-[#86868b] text-sm">Loading…</p>
          : (
            <>
              {/* Desktop table */}
              <table className="w-full border-collapse text-sm hidden md:table">
                <thead>
                  <tr className="bg-[#f5f5f7] border-b border-[#d2d2d7]">
                    {['Roll #', 'Name', 'Class', 'Batch', 'Mobile', 'Payment', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#86868b] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.participants.map(p => (
                    <tr key={p.id} className="border-b border-[#f5f5f7] hover:bg-[#fafafa]">
                      <td className="px-4 py-3 text-[#86868b]">{p.rollNumber || '—'}</td>
                      <td className="px-4 py-3 font-medium text-[#1d1d1f]">{p.name}</td>
                      <td className="px-4 py-3 text-[#86868b]">{p.class}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.batchType === 'JUNIOR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{p.batchType}</span>
                      </td>
                      <td className="px-4 py-3 text-[#86868b]">{p.mobileNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[p.paymentStatus] || ''}`}>{p.paymentStatus}</span>
                      </td>
                      <td className="px-4 py-3 text-[#86868b]">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {data?.participants.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-[#86868b] text-sm">No registrations found</td></tr>
                  )}
                </tbody>
              </table>

              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-[#f5f5f7]">
                {data?.participants.map(p => (
                  <div key={p.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#1d1d1f] text-sm">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[p.paymentStatus] || ''}`}>{p.paymentStatus}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#86868b]">
                      <span>Roll: {p.rollNumber || '—'}</span>
                      <span>Class: {p.class}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${p.batchType === 'JUNIOR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{p.batchType}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#86868b]">
                      <span>📱 {p.mobileNumber}</span>
                      <span>📅 {new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {data?.participants.length === 0 && (
                  <p className="px-4 py-6 text-center text-[#86868b] text-sm">No registrations found</p>
                )}
              </div>
            </>
          )
        }
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-4 justify-center mt-5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-1.5 bg-white border border-[#d2d2d7] rounded-full text-sm font-semibold disabled:opacity-40">← Prev</button>
          <span className="text-sm text-[#86868b]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-1.5 bg-white border border-[#d2d2d7] rounded-full text-sm font-semibold disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
