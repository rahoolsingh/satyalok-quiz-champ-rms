import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../../api/client';

interface Participant {
  id: string;
  rollNumber: string | null;
  name: string;
  class: string;
  batchType: string;
  guardianName: string;
  address?: string;
  mobileNumber: string;
  email: string | null;
  photoUrl?: string;
  paymentStatus: string;
  groupInviteSent: boolean;
  admitCardDownloaded: boolean;
  createdAt: string;
}

const statusColor: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function RegistrationList() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ junior: 0, senior: 0 });
  const [search, setSearch] = useState('');
  const [batch, setBatch] = useState('');
  const [showPending, setShowPending] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const LIMIT = 20;

  const getStatusFilter = useCallback(() => {
    const statuses = ['COMPLETED'];
    if (showPending) statuses.push('PENDING');
    if (showFailed) statuses.push('FAILED');
    return statuses.join(',');
  }, [showPending, showFailed]);

  const load = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    try {
      const r = await adminApi.getRegistrations({
        search: search || undefined,
        batch: batch || undefined,
        status: getStatusFilter(),
        page: pageNum,
        limit: LIMIT,
      });
      const data = r.data;
      if (append) {
        setParticipants(prev => [...prev, ...data.participants]);
      } else {
        setParticipants(data.participants);
      }
      setTotal(data.total);
      setCounts(data.counts);
      setHasMore(data.participants.length === LIMIT);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search, batch, getStatusFilter]);

  // Reset and reload when filters change
  useEffect(() => {
    setPage(1);
    load(1, false);
  }, [load]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          load(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, load]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      load(1, false);
    }, 400);
  };

  const copyNumber = (mobile: string, id: string) => {
    navigator.clipboard.writeText(mobile);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const openWhatsApp = (mobile: string) => {
    window.open(`https://wa.me/91${mobile}`, '_blank');
  };

  const openCall = (mobile: string) => {
    window.open(`tel:+91${mobile}`);
  };

  const handleSendInvite = async (id: string, name: string) => {
    try {
      await adminApi.sendGroupInvite(id);
      setParticipants(prev =>
        prev.map(p => p.id === id ? { ...p, groupInviteSent: true } : p)
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to send invite';
      alert(`${name}: ${msg}`);
    }
  };

  const handleRemindDownload = async (id: string, name: string) => {
    try {
      await adminApi.sendAdmitCardReminder(id);
      alert(`Reminder sent to ${name}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to send reminder';
      alert(`${name}: ${msg}`);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-4">Registrations</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
        {[
          { label: 'Junior', val: counts.junior },
          { label: 'Senior', val: counts.senior },
          { label: 'Total', val: counts.junior + counts.senior },
        ].map(c => (
          <div key={c.label} className="bg-white border border-[#d2d2d7] rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-[#1d1d1f]">{c.val}</p>
            <p className="text-[10px] sm:text-xs text-[#86868b] uppercase tracking-wider mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
        <input
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search name, mobile, roll..."
          className="flex-1 px-3.5 py-2.5 bg-white border border-[#d2d2d7] rounded-lg text-sm focus:border-[#0071e3] outline-none transition-all"
        />
        <select
          value={batch}
          onChange={e => setBatch(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-[#d2d2d7] rounded-lg text-sm focus:border-[#0071e3] outline-none"
          aria-label="Filter by batch"
        >
          <option value="">All Batches</option>
          <option value="JUNIOR">Junior</option>
          <option value="SENIOR">Senior</option>
        </select>
      </div>

      {/* Status toggles */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-[#86868b] text-xs">Show:</span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showPending}
            onChange={e => setShowPending(e.target.checked)}
            className="w-4 h-4 rounded border-[#d2d2d7] text-[#0071e3] focus:ring-[#0071e3]"
          />
          <span className="text-xs text-yellow-700">Pending</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showFailed}
            onChange={e => setShowFailed(e.target.checked)}
            className="w-4 h-4 rounded border-[#d2d2d7] text-[#0071e3] focus:ring-[#0071e3]"
          />
          <span className="text-xs text-red-700">Failed</span>
        </label>
        <span className="ml-auto text-xs text-[#86868b]">{total} results</span>
      </div>

      {/* Participant Cards */}
      <div className="space-y-3">
        {participants.map(p => (
          <div key={p.id} className="bg-white border border-[#d2d2d7] rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex gap-3">
              {/* Photo */}
              <div className="shrink-0">
                {p.photoUrl ? (
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-[#d2d2d7]"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#f5f5f7] flex items-center justify-center text-lg">
                    👤
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1d1d1f] text-sm truncate">{p.name}</h3>
                    <p className="text-xs text-[#86868b] truncate">
                      {p.guardianName && `S/o ${p.guardianName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor[p.paymentStatus] || ''}`}>
                      {p.paymentStatus}
                    </span>
                    <span className="text-[10px] text-[#86868b]">{timeAgo(p.createdAt)}</span>
                  </div>
                </div>

                {/* Details row */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-[#86868b]">
                  {p.rollNumber && <span className="font-mono font-medium text-[#1d1d1f]">{p.rollNumber}</span>}
                  <span>Class {p.class}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.batchType === 'JUNIOR' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {p.batchType}
                  </span>
                  {p.email && <span className="truncate max-w-[150px]">{p.email}</span>}
                </div>

                {/* Address */}
                {p.address && (
                  <p className="text-[11px] text-[#86868b] mt-1 truncate">📍 {p.address}</p>
                )}

                {/* Actions row */}
                <div className="flex items-center gap-2 mt-2">
                  {/* Mobile number + copy */}
                  <button
                    onClick={() => copyNumber(p.mobileNumber, p.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-[#f5f5f7] rounded-md text-xs text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors"
                    title="Copy number"
                  >
                    <span className="font-mono">{p.mobileNumber}</span>
                    <span>{copiedId === p.id ? '✓' : '📋'}</span>
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={() => openWhatsApp(p.mobileNumber)}
                    className="p-1.5 bg-[#25D366]/10 rounded-md hover:bg-[#25D366]/20 transition-colors"
                    title="WhatsApp"
                    aria-label={`WhatsApp ${p.name}`}
                  >
                    <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>

                  {/* Call */}
                  <button
                    onClick={() => openCall(p.mobileNumber)}
                    className="p-1.5 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    title="Call"
                    aria-label={`Call ${p.name}`}
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>

                  {/* Send Group Invite */}
                  {p.paymentStatus === 'COMPLETED' && (
                    <button
                      onClick={() => handleSendInvite(p.id, p.name)}
                      disabled={p.groupInviteSent}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                        p.groupInviteSent
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                      title={p.groupInviteSent ? 'Invite already sent' : 'Send group invite'}
                    >
                      {p.groupInviteSent ? '✓ Invited' : '📨 Invite'}
                    </button>
                  )}
                </div>

                {/* Admit card download status */}
                {p.paymentStatus === 'COMPLETED' && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] ${p.admitCardDownloaded ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.admitCardDownloaded ? 'bg-green-500' : 'bg-red-400'}`} />
                      {p.admitCardDownloaded ? 'Admit card downloaded' : 'Not downloaded'}
                    </span>
                    {!p.admitCardDownloaded && (
                      <button
                        onClick={() => handleRemindDownload(p.id, p.name)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
                      >
                        🔔 Remind
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!loading && participants.length === 0 && (
          <div className="text-center py-12 text-[#86868b] text-sm">
            No registrations found
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-[#d2d2d7] border-t-[#0071e3] rounded-full animate-spin" />
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={observerRef} className="h-4" />
      </div>
    </div>
  );
}
