import { useState, useEffect, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminApi } from '../../api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileDown,
  PhoneCall,
  MessageCircle,
  Copy,
  Search,
  ChevronUp,
  ChevronDown,
  UserCheck,
  UserX,
  FileText,
  GraduationCap,
  TrendingUp,
  Sun,
  Moon,
  Sparkles,
  CalendarDays,
  Send,
  RotateCcw,
  Eye,
  EyeOff,
  Download,
  Bell,
  ShieldAlert,
  ArrowUpDown,
  Languages,
} from 'lucide-react';

const LIMIT = 20;

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
  completed: number; pending: number; failed: number;
  admitCardNotDownloaded: number; female: number; male: number; formsFilled: number;
  hindi: number; english: number;
}

interface RegistrationTrendPoint {
  key: string; label: string; formsFilled: number; registrationsCompleted: number;
}

const STATUS_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'NOT_DOWNLOADED', label: 'No Download' },
] as const;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function maskGuardianName(name?: string | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '***';
  return trimmed.split(/\s+/).map(part => {
    if (part.length <= 1) return '*';
    if (part.length === 2) return `${part[0]}*`;
    return `${part[0]}${'*'.repeat(part.length - 2)}${part[part.length - 1]}`;
  }).join(' ');
}

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const statCards = [
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { key: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { key: 'failed', label: 'Failed', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  { key: 'admitCardNotDownloaded', label: 'No Download', icon: FileDown, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  { key: 'formsFilled', label: 'Forms Filled', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { key: 'male', label: 'Male', icon: UserCheck, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30' },
  { key: 'female', label: 'Female', icon: UserX, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  { key: 'junior', label: 'Junior', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { key: 'senior', label: 'Senior', icon: GraduationCap, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  { key: 'hindi', label: 'Hindi', icon: Languages, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  { key: 'english', label: 'English', icon: Languages, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
];

export function RegistrationList() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ junior: 0, senior: 0 });
  const [metrics, setMetrics] = useState<RegistrationMetrics>({
    completed: 0, pending: 0, failed: 0, admitCardNotDownloaded: 0, female: 0, male: 0, formsFilled: 0, hindi: 0, english: 0,
  });
  const [trends, setTrends] = useState<RegistrationTrendPoint[]>([]);
  const [trendRange, setTrendRange] = useState<TrendRange>('EVENT_START');
  const [search, setSearch] = useState('');
  const [batch, setBatch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hideSensitiveData, setHideSensitiveData] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [datesDialog, setDatesDialog] = useState<{ id: string; name: string; isGodMode: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getStatusFilter = useCallback(() => {
    if (statusFilter === 'ALL') return 'COMPLETED,PENDING,FAILED';
    if (statusFilter === 'NOT_DOWNLOADED') return 'COMPLETED';
    return statusFilter;
  }, [statusFilter]);

  const load = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const r = await adminApi.getRegistrations({
        search: search || undefined,
        batch: batch || undefined,
        status: getStatusFilter(),
        admitCardDownloaded: statusFilter === 'NOT_DOWNLOADED' ? 'false' : undefined,
        trendRange, page: pageNum, limit: LIMIT,
      });
      const d = r.data;
      if (append) setParticipants(prev => [...prev, ...d.participants]);
      else setParticipants(d.participants);
      setTotal(d.total);
      setCounts(d.counts);
      setMetrics(d.metrics);
      setTrends(d.trends || []);
      setHasMore(d.participants.length === LIMIT);
    } catch { /* */ } finally { setLoading(false); }
  }, [search, batch, getStatusFilter, trendRange]);

  useEffect(() => { setPage(1); load(1); }, [load]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) { const np = page + 1; setPage(np); load(np, true); } },
      { threshold: 0.1 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, load]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { setPage(1); load(1); }, 400);
  };

  const copyNumber = (mobile: string, id: string) => {
    navigator.clipboard.writeText(mobile);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const execAction = async (fn: () => Promise<any>, name: string) => {
    try { await fn(); } catch (err: any) { alert(`${name}: ${err.response?.data?.error || 'Action failed'}`); }
  };

  const chartData = trends.map(p => ({
    label: p.label.length > 10 ? p.label.slice(0, 8) + '..' : p.label,
    fullLabel: p.label,
    formsFilled: p.formsFilled,
    registrationsCompleted: p.registrationsCompleted,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Registrations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} total participant{total !== 1 ? 's' : ''}
            {counts.junior > 0 && ` · ${counts.junior} junior`}
            {counts.senior > 0 && ` · ${counts.senior} senior`}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs px-3 py-1.5">
          <TrendingUp className="size-3.5" />
          {metrics.formsFilled} filled
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="flex flex-wrap gap-2">
        {statCards.map(c => {
          const Icon = c.icon;
          const val = c.key === 'junior' || c.key === 'senior'
            ? counts[c.key as keyof typeof counts]
            : metrics[c.key as keyof RegistrationMetrics] ?? 0;
          return (
            <Card key={c.key} className={`${c.bg} border-0 shadow-none px-3 py-2 min-w-[calc(50%-0.25rem)] sm:min-w-[calc(33.333%-0.375rem)] md:min-w-[calc(25%-0.375rem)] lg:min-w-[calc(20%-0.4rem)] xl:min-w-[calc(16.666%-0.416rem)] flex-1`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-md ${c.bg}`}>
                  <Icon className={`size-4 ${c.color}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-lg font-bold leading-tight ${c.color}`}>{val}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight truncate">{c.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Trend Chart */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp className="size-4 text-muted-foreground" />
            Registration Trend
          </h3>
          <Tabs value={trendRange} onValueChange={v => setTrendRange(v as TrendRange)}>
            <TabsList className="h-7 text-xs">
              <TabsTrigger value="DAILY" className="text-xs px-2 py-1">Daily</TabsTrigger>
              <TabsTrigger value="WEEKLY" className="text-xs px-2 py-1">Weekly</TabsTrigger>
              <TabsTrigger value="MONTHLY" className="text-xs px-2 py-1">Monthly</TabsTrigger>
              <TabsTrigger value="EVENT_START" className="text-xs px-2 py-1">Event Start</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {chartData.length > 0 ? (
          <>
            <div className="h-56 rounded-lg bg-muted/30 border border-border p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="ffGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    labelFormatter={(l: any) => chartData.find(d => d.label === l)?.fullLabel || String(l)}
                  />
                  <Area type="monotone" dataKey="formsFilled" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#ffGrad)" dot={false} activeDot={{ r: 4, fill: 'hsl(var(--primary))' }} name="Forms Filled" />
                  <Area type="monotone" dataKey="registrationsCompleted" stroke="#16a34a" strokeWidth={2} fill="url(#regGrad)" dot={false} activeDot={{ r: 4, fill: '#16a34a' }} name="Registered" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-end gap-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: 'hsl(var(--primary))' }} />Forms</span>
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-green-600" />Registered</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground py-8 text-center">No trend data available yet.</p>
        )}
      </Card>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder={hideSensitiveData ? 'Search name...' : 'Search name, mobile, roll...'}
            className="pl-9"
          />
        </div>
        <Select value={batch || ''} onValueChange={v => setBatch(v ?? '')}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Batches</SelectItem>
            <SelectItem value="JUNIOR">Junior</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Tabs + Toggles */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="flex-1">
            <TabsList className="h-8 w-full sm:w-auto">
              {STATUS_TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs px-3 py-1">{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{total} result{total !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={hideSensitiveData}
              onCheckedChange={c => setHideSensitiveData(!!c)}
            />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {hideSensitiveData ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              {hideSensitiveData ? 'Hidden' : 'Show'} sensitive data
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={godMode}
              onCheckedChange={c => setGodMode(!!c)}
              className="data-checked:border-red-500 data-checked:bg-red-500"
            />
            <span className="text-xs text-red-500 font-medium flex items-center gap-1">
              <ShieldAlert className="size-3" />
              God Mode
            </span>
          </label>
        </div>
      </div>

      {/* Participant Cards */}
      <div className="space-y-2">
        {participants.map(p => {
          const statusColor = p.paymentStatus === 'COMPLETED' ? 'default'
            : p.paymentStatus === 'PENDING' ? 'secondary'
            : 'destructive';
          return (
            <Card key={p.id} className="relative overflow-hidden transition-shadow hover:shadow-sm">
              <div className={`absolute top-0 left-0 w-1 h-full ${p.batchType === 'JUNIOR' ? 'bg-blue-500' : 'bg-purple-500'}`} />
              <CardContent className="p-3 pl-4">
                {hideSensitiveData ? (
                  <div className="flex items-start gap-3 py-1">
                    <Avatar className="size-10 rounded-lg">
                      {p.photoUrl ? <AvatarImage src={p.photoUrl} /> : null}
                      <AvatarFallback className="rounded-lg text-xs">{getInitials(p.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Guardian: {maskGuardianName(p.guardianName)} · Class {p.class} · {p.batchType}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <Avatar className="size-10 rounded-lg">
                        {p.photoUrl ? <AvatarImage src={p.photoUrl} alt={p.name} /> : null}
                        <AvatarFallback className="rounded-lg text-xs">{getInitials(p.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{p.name}</span>
                          {p.rollNumber && (
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4">
                              {p.rollNumber}
                            </Badge>
                          )}
                          <Badge variant={statusColor} className="text-[10px] px-1.5 py-0 h-4 leading-none">
                            {p.paymentStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          S/o {p.guardianName} · Class {p.class} · {p.batchType}
                          {p.gender && ` · ${p.gender === 'MALE' ? 'Male' : 'Female'}`}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(p.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                      {p.address && <p>📍 {p.address}</p>}
                      {p.email && <p>✉️ {p.email}</p>}
                      {p.referralSource && <p>🔗 Referred by: {p.referralSource}</p>}
                      {p.questionPaperLanguage && (
                        <p>🌐 Paper: {p.questionPaperLanguage === 'HINDI' ? 'Hindi' : p.questionPaperLanguage === 'ENGLISH' ? 'English' : p.questionPaperLanguage}</p>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-1.5 mt-2 pt-2 border-t border-border">
                      <Button variant="outline" size="xs" onClick={() => copyNumber(p.mobileNumber, p.id)} className="font-mono text-[11px]">
                        {p.mobileNumber}
                        {copiedId === p.id ? <CheckCircle2 className="size-3 ml-1 text-green-500" /> : <Copy className="size-3 ml-1" />}
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => window.open(`https://wa.me/91${p.mobileNumber}`, '_blank')} className="text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10">
                        <MessageCircle className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => window.open(`tel:+91${p.mobileNumber}`)} className="text-blue-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                        <PhoneCall className="size-3.5" />
                      </Button>

                      {p.paymentStatus === 'COMPLETED' && (
                        <span className={`inline-flex items-center gap-1 text-[10px] ml-auto ${p.admitCardDownloaded ? 'text-green-600' : 'text-red-500'}`}>
                          <span className={`size-1.5 rounded-full ${p.admitCardDownloaded ? 'bg-green-500' : 'bg-red-400'}`} />
                          {p.admitCardDownloaded ? 'Downloaded' : 'Not downloaded'}
                        </span>
                      )}

                      {p.paymentStatus === 'COMPLETED' && !p.groupInviteSent && !p.groupJoined && (
                        <Button variant="outline" size="xs" onClick={() => execAction(() => adminApi.sendGroupInvite(p.id).then(() => setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, groupInviteSent: true } : x))), p.name)}>
                          <Send className="size-3 mr-1" /> Invite
                        </Button>
                      )}
                      {p.groupInviteSent && !p.groupJoined && (
                        <Badge variant="secondary" className="text-[10px] h-5">Invited</Badge>
                      )}
                      {p.groupJoined && (
                        <Badge variant="default" className="text-[10px] h-5 bg-green-600">Joined</Badge>
                      )}

                      {p.paymentStatus === 'PENDING' && (
                        <Button variant="secondary" size="xs" onClick={() => execAction(() => adminApi.sendPaymentReminder(p.id).then(() => alert(`Reminder sent to ${p.name}`)), p.name)}>
                          <Bell className="size-3 mr-1" /> Remind
                        </Button>
                      )}
                      {(p.paymentStatus === 'PENDING' || p.paymentStatus === 'FAILED') && (
                        <Button variant="outline" size="xs" onClick={() => execAction(async () => {
                          const res = await adminApi.verifyPayment(p.id);
                          alert(`${p.name}: ${res.data.message}`);
                          if (res.data.status === 'SUCCESS') setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, paymentStatus: 'COMPLETED' } : x));
                        }, p.name)} className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                          <RotateCcw className="size-3 mr-1" /> Verify
                        </Button>
                      )}

                      {p.paymentStatus === 'COMPLETED' && !p.admitCardDownloaded && (
                        <Button variant="ghost" size="xs" onClick={() => execAction(() => adminApi.sendAdmitCardReminder(p.id).then(() => alert(`Reminder sent to ${p.name}`)), p.name)} className="text-orange-600">
                          <Bell className="size-3 mr-1" /> Remind
                        </Button>
                      )}

                      {p.paymentStatus === 'COMPLETED' && (
                        <>
                          <Button variant="secondary" size="xs" onClick={() => setDatesDialog({ id: p.id, name: p.name, isGodMode: godMode })}>
                            <CalendarDays className="size-3 mr-1" /> Dates
                          </Button>
                          <Dialog open={datesDialog?.id === p.id} onOpenChange={open => { if (!open) setDatesDialog(null); }}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Send Important Dates</DialogTitle>
                                <DialogDescription>
                                  Send important dates to <strong>{p.name}</strong>.
                                  {godMode && <span className="block mt-1 text-red-500">⚡ God Mode active — no rate limits.</span>}
                                </DialogDescription>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">
                                Have the dates changed? If yes, the admit card download status will be cleared so they can download the updated version.
                              </p>
                              <DialogFooter showCloseButton className="flex-col sm:flex-row gap-2 mt-2">
                                <Button variant="destructive" onClick={async () => {
                                  await (godMode ? adminApi.resendImportantDates(p.id, true) : adminApi.sendImportantDates(p.id, true));
                                  setDatesDialog(null);
                                  setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, admitCardDownloaded: false } : x));
                                  alert(`Important dates sent to ${p.name} (admit card status cleared)`);
                                }}>
                                  Yes, dates changed
                                </Button>
                                <Button onClick={async () => {
                                  await (godMode ? adminApi.resendImportantDates(p.id, false) : adminApi.sendImportantDates(p.id, false));
                                  setDatesDialog(null);
                                  alert(`Important dates sent to ${p.name}`);
                                }}>
                                  No change — just send
                                </Button>
                                <DialogClose render={<Button variant="secondary">Cancel</Button>} />
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {godMode && p.paymentStatus === 'COMPLETED' && (
                        <div className="w-full flex flex-wrap gap-1.5 mt-1.5 pt-1.5 border-t border-red-200">
                          <span className="text-[9px] text-red-400 font-medium uppercase tracking-wide w-full">⚡ God Mode</span>
                          <Button variant="destructive" size="xs" onClick={() => execAction(() => adminApi.resendPaymentConfirmation(p.id).then(() => alert(`Confirmation resent to ${p.name}`)), p.name)}>
                            <RotateCcw className="size-3 mr-1" /> Confirmation
                          </Button>
                          <Button variant="destructive" size="xs" onClick={() => execAction(() => adminApi.resendGroupInvite(p.id).then(() => alert(`Group invite resent to ${p.name}`)), p.name)}>
                            <RotateCcw className="size-3 mr-1" /> Group Invite
                          </Button>
                          <Button variant="destructive" size="xs" onClick={() => execAction(() => adminApi.resendAdmitCardReminder(p.id).then(() => alert(`Reminder resent to ${p.name}`)), p.name)}>
                            <RotateCcw className="size-3 mr-1" /> Admit Card
                          </Button>
                          <Button variant="destructive" size="xs" onClick={() => {
                            setDatesDialog({ id: p.id, name: p.name, isGodMode: true });
                          }}>
                            <RotateCcw className="size-3 mr-1" /> Dates
                          </Button>
                        </div>
                      )}

                      {godMode && p.paymentStatus === 'PENDING' && (
                        <div className="w-full flex flex-wrap gap-1.5 mt-1.5 pt-1.5 border-t border-red-200">
                          <span className="text-[9px] text-red-400 font-medium uppercase tracking-wide w-full">⚡ God Mode</span>
                          <Button variant="destructive" size="xs" onClick={() => execAction(() => adminApi.resendPaymentReminder(p.id).then(() => alert(`Reminder resent to ${p.name}`)), p.name)}>
                            <RotateCcw className="size-3 mr-1" /> Payment Reminder
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}

        {!loading && participants.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="size-8 mb-2 opacity-40" />
              <p className="text-sm">No registrations found</p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-60" />
                      <Skeleton className="h-3 w-80" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div ref={observerRef} className="h-4" />
      </div>
    </div>
  );
}
