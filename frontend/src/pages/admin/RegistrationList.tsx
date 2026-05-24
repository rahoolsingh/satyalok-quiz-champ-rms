import { useState, useEffect, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminApi } from '../../api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface Participant {
  id: string;
  rollNumber: string | null;
  name: string;
  class: string;
  batchType: string;
  gender?: 'MALE' | 'FEMALE';
  guardianName: string;
  address?: string;
  mobileNumber: string;
  email: string | null;
  questionPaperLanguage: string;
  referralSource?: string | null;
  photoUrl?: string;
  paymentStatus: string;
  merchantTransactionId: string | null;
  groupInviteSent: boolean;
  groupJoined: boolean;
  admitCardDownloaded: boolean;
  createdAt: string;
}

type TrendRange = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'EVENT_START';

interface RegistrationMetrics {
  completed: number;
  pending: number;
  failed: number;
  admitCardNotDownloaded: number;
  female: number;
  male: number;
  formsFilled: number;
}

interface RegistrationTrendPoint {
  key: string;
  label: string;
  formsFilled: number;
  registrationsCompleted: number;
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  COMPLETED: 'default',
  PENDING: 'secondary',
  FAILED: 'destructive',
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

function maskGuardianName(name?: string | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '***';
  return trimmed
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 1) return '*';
      if (part.length === 2) return `${part[0]}*`;
      return `${part[0]}${'*'.repeat(part.length - 2)}${part[part.length - 1]}`;
    })
    .join(' ');
}

export function RegistrationList() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ junior: 0, senior: 0 });
  const [metrics, setMetrics] = useState<RegistrationMetrics>({
    completed: 0, pending: 0, failed: 0, admitCardNotDownloaded: 0, female: 0, male: 0, formsFilled: 0,
  });
  const [trends, setTrends] = useState<RegistrationTrendPoint[]>([]);
  const [trendRange, setTrendRange] = useState<TrendRange>('EVENT_START');
  const [search, setSearch] = useState('');
  const [batch, setBatch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED' | 'NOT_DOWNLOADED'>('ALL');
  const [hideSensitiveData, setHideSensitiveData] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [datesModal, setDatesModal] = useState<{ id: string; name: string; isGodMode: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const LIMIT = 20;

  const getStatusFilter = useCallback(() => {
    if (statusFilter === 'ALL') return 'COMPLETED,PENDING,FAILED';
    if (statusFilter === 'NOT_DOWNLOADED') return 'COMPLETED';
    return statusFilter;
  }, [statusFilter]);

  const load = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    try {
      const r = await adminApi.getRegistrations({
        search: search || undefined,
        batch: batch || undefined,
        status: getStatusFilter(),
        admitCardDownloaded: statusFilter === 'NOT_DOWNLOADED' ? 'false' : undefined,
        trendRange, page: pageNum, limit: LIMIT,
      });
      const data = r.data;
      if (append) {
        setParticipants(prev => [...prev, ...data.participants]);
      } else {
        setParticipants(data.participants);
      }
      setTotal(data.total);
      setCounts(data.counts);
      setMetrics(data.metrics);
      setTrends(data.trends || []);
      setHasMore(data.participants.length === LIMIT);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [search, batch, getStatusFilter, trendRange]);

  useEffect(() => { setPage(1); load(1, false); }, [load]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loading) { const nextPage = page + 1; setPage(nextPage); load(nextPage, true); } },
      { threshold: 0.1 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, load]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { setPage(1); load(1, false); }, 400);
  };

  const copyNumber = (mobile: string, id: string) => {
    navigator.clipboard.writeText(mobile);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };
  const openWhatsApp = (mobile: string) => window.open(`https://wa.me/91${mobile}`, '_blank');
  const openCall = (mobile: string) => window.open(`tel:+91${mobile}`);

  const handleSendInvite = async (id: string, name: string) => {
    try { await adminApi.sendGroupInvite(id); setParticipants(prev => prev.map(p => p.id === id ? { ...p, groupInviteSent: true } : p)); }
    catch (err: any) { alert(`${name}: ${err.response?.data?.error || 'Failed to send invite'}`); }
  };

  const handleRemindDownload = async (id: string, name: string) => {
    try { await adminApi.sendAdmitCardReminder(id); alert(`Reminder sent to ${name}`); }
    catch (err: any) { alert(`${name}: ${err.response?.data?.error || 'Failed to send reminder'}`); }
  };

  const handlePaymentReminder = async (id: string, name: string) => {
    try { await adminApi.sendPaymentReminder(id); alert(`Payment reminder sent to ${name}`); }
    catch (err: any) { alert(`${name}: ${err.response?.data?.error || 'Failed to send payment reminder'}`); }
  };

  const handleResendConfirmation = async (id: string, name: string) => {
    try { await adminApi.resendPaymentConfirmation(id); alert(`Payment confirmation resent to ${name}`); }
    catch (err: any) { alert(`${name}: ${err.response?.data?.error || 'Failed to resend confirmation'}`); }
  };

  const handleResendGroupInvite = async (id: string, name: string) => {
    try { await adminApi.resendGroupInvite(id); alert(`Group invite resent to ${name}`); }
    catch (err: any) { alert(`${name}: ${err.response?.data?.error || 'Failed to resend group invite'}`); }
  };

  const handleResendAdmitCardReminder = async (id: string, name: string) => {
    try { await adminApi.resendAdmitCardReminder(id); alert(`Admit card reminder resent to ${name}`); }
    catch (err: any) { alert(`${name}: ${err.response?.data?.error || 'Failed to resend admit card reminder'}`); }
  };

  const handleResendPaymentReminder = async (id: string, name: string) => {
    try { await adminApi.resendPaymentReminder(id); alert(`Payment reminder resent to ${name}`); }
    catch (err: any) { alert(`${name}: ${err.response?.data?.error || 'Failed to resend payment reminder'}`); }
  };

  const handleSendImportantDates = async (id: string, name: string, isGodMode: boolean) => {
    setDatesModal({ id, name, isGodMode });
  };

  const executeSendImportantDates = async (datesChanged: boolean) => {
    if (!datesModal) return;
    const { id, name, isGodMode } = datesModal;
    setDatesModal(null);
    try {
      if (isGodMode) { await adminApi.resendImportantDates(id, datesChanged); }
      else { await adminApi.sendImportantDates(id, datesChanged); }
      alert(`Important dates sent to ${name}${datesChanged ? ' (admit card status cleared)' : ''}`);
      if (datesChanged) { setParticipants(prev => prev.map(p => p.id === id ? { ...p, admitCardDownloaded: false } : p)); }
    } catch (err: any) { alert(`${name}: ${err.response?.data?.error || 'Failed to send important dates'}`); }
  };

  const handleVerifyPayment = async (id: string, name: string) => {
    try { const res = await adminApi.verifyPayment(id); alert(`${name}: ${res.data.message}`); if (res.data.status === 'SUCCESS') setParticipants(prev => prev.map(p => p.id === id ? { ...p, paymentStatus: 'COMPLETED' } : p)); }
    catch (err: any) { alert(`${name}: ${err.response?.data?.error || 'Failed to verify payment'}`); }
  };

  const chartData = trends.map(point => ({
    label: point.label.length > 10 ? point.label.slice(0, 8) + '..' : point.label,
    fullLabel: point.label,
    formsFilled: point.formsFilled,
    registrationsCompleted: point.registrationsCompleted,
  }));

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-4">Registrations</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 mb-3">
        {[
          { label: 'Completed', val: metrics.completed },
          { label: 'Pending', val: metrics.pending },
          { label: 'Transaction Failed', val: metrics.failed },
          { label: 'Admit Card Not Downloaded', val: metrics.admitCardNotDownloaded },
          { label: 'Female', val: metrics.female },
          { label: 'Male', val: metrics.male },
          { label: 'Forms Filled', val: metrics.formsFilled },
          { label: 'Junior', val: counts.junior },
          { label: 'Senior', val: counts.senior },
        ].map(c => (
          <Card key={c.label} className="px-3 py-2.5">
            <p className="text-lg sm:text-xl font-bold">{c.val}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{c.label}</p>
          </Card>
        ))}
      </div>

      <Card className="px-3 py-3 mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide">Registration Trend</p>
          <select
            value={trendRange}
            onChange={(e) => setTrendRange(e.target.value as TrendRange)}
            className="px-2 py-1 bg-background border border-input rounded-lg text-xs focus:border-ring outline-none"
            aria-label="Select trend range"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="EVENT_START">From Event Start</option>
          </select>
        </div>
        {chartData.length > 0 ? (
          <div className="w-full h-56 rounded-lg bg-muted/30 border border-border p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="formsFilledGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="registeredGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: 'hsl(var(--card))',
                  }}
                  labelFormatter={(label: any) => { const found = chartData.find(d => d.label === label); return found?.fullLabel || String(label); }}
                />
                <Area type="monotone" dataKey="formsFilled" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#formsFilledGrad)" dot={false} activeDot={{ r: 4, fill: 'hsl(var(--primary))' }} name="Forms Filled" />
                <Area type="monotone" dataKey="registrationsCompleted" stroke="#16a34a" strokeWidth={2} fill="url(#registeredGrad)" dot={false} activeDot={{ r: 4, fill: '#16a34a' }} name="Registered" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No trend data available.</p>
        )}
        {chartData.length > 0 && (
          <div className="mt-2 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--primary))' }} />Forms Filled</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600" />Registered</span>
          </div>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
        <Input
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder={hideSensitiveData ? 'Search name...' : 'Search name, mobile, roll...'}
          className="flex-1"
        />
        <select
          value={batch}
          onChange={e => setBatch(e.target.value)}
          className="px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:border-ring outline-none"
          aria-label="Filter by batch"
        >
          <option value="">All Batches</option>
          <option value="JUNIOR">Junior</option>
          <option value="SENIOR">Senior</option>
        </select>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
          <span className="text-muted-foreground text-xs shrink-0">Status:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'COMPLETED', label: 'Completed' },
              { key: 'PENDING', label: 'Pending' },
              { key: 'FAILED', label: 'Failed' },
              { key: 'NOT_DOWNLOADED', label: 'Admit Card Not Downloaded' },
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatusFilter(item.key as 'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED' | 'NOT_DOWNLOADED')}
                className={`px-2.5 py-1 rounded-full text-xs border border-input transition-colors ${statusFilter === item.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="sm:ml-auto text-xs text-muted-foreground">{total} results</span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={hideSensitiveData}
            onChange={e => setHideSensitiveData(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-xs">Hide sensitive data (keeps photo + masked Father/guardian name)</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={godMode}
            onChange={e => setGodMode(e.target.checked)}
            className="w-4 h-4 rounded border-border text-red-500 focus:ring-red-500 accent-red-500"
          />
          <span className="text-xs text-red-600 font-medium">⚡ God Mode (resend messages without limits)</span>
        </label>
      </div>

      <div className="space-y-2">
        {participants.map(p => (
          <Card key={p.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${p.batchType === 'JUNIOR' ? 'bg-blue-500' : 'bg-purple-500'}`} />
            <CardContent className="pl-2 pt-3 pb-3">
              {hideSensitiveData ? (
                <div className="flex items-start gap-2.5 py-1">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="Candidate photo" className="w-11 h-11 rounded-lg object-cover border border-border shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">👤</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-[13px] leading-tight">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      Guardian: {maskGuardianName(p.guardianName)} · Class {p.class} · {p.batchType}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2.5">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} className="w-11 h-11 rounded-lg object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">👤</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-[13px] leading-tight">{p.name}</span>
                        {p.rollNumber && <span className="font-mono text-[10px] text-primary font-semibold shrink-0">{p.rollNumber}</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        S/o {p.guardianName} · Class {p.class} · {p.batchType}
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <Badge variant={statusBadgeVariant[p.paymentStatus] || 'default'} className="text-[9px] px-1.5 py-0.5 leading-none min-h-0 h-auto">
                        {p.paymentStatus}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground mt-0.5">{timeAgo(p.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-0.5">
                    {p.address && <p className="text-[11px] text-muted-foreground leading-snug">📍 {p.address}</p>}
                    {p.email && <p className="text-[11px] text-muted-foreground leading-snug">✉️ {p.email}</p>}
                    {p.referralSource && <p className="text-[11px] text-muted-foreground leading-snug">🔗 Referred by: {p.referralSource}</p>}
                    {p.gender && <p className="text-[11px] text-muted-foreground leading-snug">⚤ Gender: {p.gender === 'MALE' ? 'Male' : 'Female'}</p>}
                    <p className="text-[11px] text-muted-foreground leading-snug">🌐 Question Paper Language: {p.questionPaperLanguage === 'HINDI' ? 'Hindi' : p.questionPaperLanguage === 'ENGLISH' ? 'English' : 'Not Selected'}</p>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5 mt-2 pt-2 border-t border-border">
                    <Button variant="ghost" size="xs" onClick={() => copyNumber(p.mobileNumber, p.id)} className="font-mono text-[11px] px-2 py-1 h-auto">
                      {p.mobileNumber} <span className="text-[10px] ml-0.5">{copiedId === p.id ? '✓' : '📋'}</span>
                    </Button>
                    <button onClick={() => openWhatsApp(p.mobileNumber)} className="p-1.5 bg-[#25D366]/10 rounded-md hover:bg-[#25D366]/20 transition-colors" title="WhatsApp" aria-label={`WhatsApp ${p.name}`}>
                      <svg className="w-3.5 h-3.5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    </button>
                    <button onClick={() => openCall(p.mobileNumber)} className="p-1.5 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors" title="Call" aria-label={`Call ${p.name}`}>
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </button>
                    {p.paymentStatus === 'COMPLETED' && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleSendInvite(p.id, p.name)}
                        disabled={p.groupInviteSent}
                        className={p.groupJoined ? 'text-green-700 bg-green-100 hover:bg-green-200' : p.groupInviteSent ? 'text-muted-foreground' : 'text-purple-700 bg-purple-50 hover:bg-purple-100'}
                      >
                        {p.groupJoined ? '✓ Joined' : p.groupInviteSent ? '✓ Invited' : '📨 Invite'}
                      </Button>
                    )}
                    {godMode && (
                      <div className="w-full mt-2 pt-2 border-t border-red-200">
                        <p className="text-[9px] text-red-400 font-medium uppercase tracking-wide mb-1.5">⚡ God Mode</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.paymentStatus === 'COMPLETED' && (
                            <>
                              <Button variant="destructive" size="xs" onClick={() => handleResendConfirmation(p.id, p.name)}>🔄 Confirmation</Button>
                              <Button variant="destructive" size="xs" onClick={() => handleResendGroupInvite(p.id, p.name)}>🔄 Group Invite</Button>
                              <Button variant="destructive" size="xs" onClick={() => handleResendAdmitCardReminder(p.id, p.name)}>🔄 Admit Card</Button>
                              <Button variant="destructive" size="xs" onClick={() => handleSendImportantDates(p.id, p.name, true)}>🔄 Dates</Button>
                            </>
                          )}
                          {p.paymentStatus === 'PENDING' && (
                            <Button variant="destructive" size="xs" onClick={() => handleResendPaymentReminder(p.id, p.name)}>🔄 Payment Reminder</Button>
                          )}
                        </div>
                      </div>
                    )}
                    {p.paymentStatus === 'PENDING' && (
                      <Button variant="secondary" size="xs" onClick={() => handlePaymentReminder(p.id, p.name)}>💰 Remind</Button>
                    )}
                    {(p.paymentStatus === 'PENDING' || p.paymentStatus === 'FAILED') && (
                      <Button variant="outline" size="xs" onClick={() => handleVerifyPayment(p.id, p.name)} className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">🔍 Verify</Button>
                    )}
                    {p.paymentStatus === 'COMPLETED' && !godMode && (
                      <Button variant="secondary" size="xs" onClick={() => handleSendImportantDates(p.id, p.name, false)}>📅 Dates</Button>
                    )}
                    {p.paymentStatus === 'COMPLETED' && (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className={`inline-flex items-center gap-1 text-[10px] ${p.admitCardDownloaded ? 'text-green-600' : 'text-red-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.admitCardDownloaded ? 'bg-green-500' : 'bg-red-400'}`} />
                          {p.admitCardDownloaded ? 'Downloaded' : 'Not downloaded'}
                        </span>
                        {!p.admitCardDownloaded && (
                          <Button variant="ghost" size="xs" onClick={() => handleRemindDownload(p.id, p.name)} className="text-orange-600">🔔</Button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {!loading && participants.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No registrations found</div>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        )}

        <div ref={observerRef} className="h-4" />
      </div>

      {datesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <h3 className="text-base font-bold">Send Important Dates</h3>
                <p className="text-xs text-muted-foreground">to {datesModal.name}</p>
              </div>
            </div>
            <p className="text-sm text-foreground/80 mb-5 leading-relaxed">
              Have the dates changed? If yes, the admit card download status will be cleared so they can download the updated version.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="destructive" onClick={() => executeSendImportantDates(true)}>Yes, dates changed — clear & send</Button>
              <Button onClick={() => executeSendImportantDates(false)}>No change — just send dates</Button>
              <Button variant="secondary" onClick={() => setDatesModal(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
