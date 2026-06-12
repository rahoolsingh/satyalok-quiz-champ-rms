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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Tooltip as ShadTooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
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
  UserCheck,
  UserX,
  FileText,
  GraduationCap,
  TrendingUp,
  CalendarDays,
  Send,
  RotateCcw,
  EyeOff,
  Bell,
  ShieldAlert,
  Languages,
  Smartphone,
  ExternalLink,
  UserPlus,
  Loader2,
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

const statusBadge: Record<string, 'default' | 'secondary' | 'destructive'> = {
  COMPLETED: 'default', PENDING: 'secondary', FAILED: 'destructive',
};

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
  const [customMsgDialog, setCustomMsgDialog] = useState<{ id: string; name: string } | null>(null);
  const [customMsgText, setCustomMsgText] = useState('');
  const [paymentLinkDialog, setPaymentLinkDialog] = useState<{ id: string; name: string; link: string; validTill: string } | null>(null);
  const [queueStatus, setQueueStatus] = useState<{ running: boolean; total: number; sent: number; failed: number; currentParticipant?: string } | null>(null);
  const [loadingActions, setLoadingActions] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingVCard, setDownloadingVCard] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
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
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, load]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { setPage(1); load(1); }, 400);
  };

  const downloadVCard = async () => {
    setDownloadingVCard(true);
    try {
      const res = await adminApi.getRegistrationsVCard({
        search: search || undefined,
        batch: batch || undefined,
        status: getStatusFilter(),
        admitCardDownloaded: statusFilter === 'NOT_DOWNLOADED' ? 'false' : undefined,
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      const currentYear = new Date().getFullYear();
      a.download = `quizchamp_${currentYear}_contacts.vcf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`vCard download failed: ${err.response?.data?.error || 'Error'}`);
    } finally {
      setDownloadingVCard(false);
    }
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

  const openWhatsApp = (mobile: string) => window.open(`https://wa.me/91${mobile}`, '_blank');
  const openCall = (mobile: string) => window.open(`tel:+91${mobile}`);
  const copyNumber = (mobile: string, id: string) => {
    navigator.clipboard.writeText(mobile);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

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
            {total} total{counts.junior > 0 && ` · ${counts.junior} junior`}{counts.senior > 0 && ` · ${counts.senior} senior`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadVCard}
            className="gap-1.5 text-xs px-3 py-1.5 h-8"
            disabled={downloadingVCard}
          >
            {downloadingVCard ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
            Download vCard
          </Button>
          <Badge variant="outline" className="gap-1.5 text-xs px-3 py-1.5 h-8">
            <TrendingUp className="size-3.5" />
            {metrics.formsFilled} filled
          </Badge>
        </div>
      </div>

      {/* Stats */}
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
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} interval="preserveStartEnd" className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} allowDecimals={false} className="text-muted-foreground" />
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

      {/* Filters */}
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

      {/* Status + Toggles */}
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
              <EyeOff className="size-3" />
              Hide guardian
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

      {/* Admit Card Queue Controls */}
      {godMode && (
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10">
          <CardContent className="py-3 px-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-red-600 flex items-center gap-1"><Send className="size-3" />Admit Card Queue</span>
            <Button size="xs" variant="outline" className="text-emerald-600 border-emerald-300" onClick={async () => {
              const res = await adminApi.admitCardQueueStart();
              alert(res.data.message);
              const s = await adminApi.admitCardQueueStatus();
              setQueueStatus(s.data);
            }}>Start Queue</Button>
            <Button size="xs" variant="outline" className="text-red-600 border-red-300" onClick={async () => {
              await adminApi.admitCardQueueStop();
              setQueueStatus(prev => prev ? { ...prev, running: false } : null);
            }}>Stop Queue</Button>
            <Button size="xs" variant="destructive" onClick={async () => {
              const confirmed = window.confirm('Reset admit card queue? This will clear sent status so bulk admit cards can be sent again.');
              if (!confirmed) return;
              const res = await adminApi.admitCardQueueReset();
              alert(res.data.message);
              const s = await adminApi.admitCardQueueStatus();
              setQueueStatus(s.data);
            }}>Reset Queue</Button>
            <Button size="xs" variant="outline" onClick={async () => {
              const s = await adminApi.admitCardQueueStatus();
              setQueueStatus(s.data);
            }}>Refresh Status</Button>
            {queueStatus && (
              <span className="text-xs text-muted-foreground">
                {queueStatus.running ? '🟢 Running' : '⚪ Stopped'} — Sent: {queueStatus.sent}/{queueStatus.total} | Failed: {queueStatus.failed}
                {queueStatus.currentParticipant && ` | Current: ${queueStatus.currentParticipant}`}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden border-border">
        <div className="overflow-x-auto">
          <TooltipProvider delay={300}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Participant</TableHead>
                {!hideSensitiveData && <TableHead className="min-w-[130px]">Guardian</TableHead>}
                <TableHead className="min-w-[80px]">Class</TableHead>
                <TableHead className="min-w-[70px]">Batch</TableHead>
                {!hideSensitiveData && <TableHead className="min-w-[70px]">Gender</TableHead>}
                <TableHead className="min-w-[80px]">Paper</TableHead>
                {!hideSensitiveData && <TableHead className="min-w-[110px]">Referral</TableHead>}
                {!hideSensitiveData && <TableHead className="min-w-[110px]">Mobile</TableHead>}
                <TableHead className="min-w-[80px]">Status</TableHead>
                <TableHead className="min-w-[75px]">Admit</TableHead>
                <TableHead className="min-w-[160px]">Actions</TableHead>
                <TableHead className="min-w-[50px]">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map(p => (
                <TableRow key={p.id} className="group">
                  {/* Participant */}
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="size-8 rounded-lg shrink-0">
                        {p.photoUrl ? <AvatarImage src={p.photoUrl} alt={p.name} /> : null}
                        <AvatarFallback className="rounded-lg text-[10px]">{getInitials(p.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight truncate max-w-[120px]">{p.name}</p>
                        {p.rollNumber && <p className="text-[10px] font-mono text-primary leading-tight truncate">{p.rollNumber}</p>}
                      </div>
                    </div>
                  </TableCell>

                  {/* Guardian */}
                  {!hideSensitiveData && (
                    <TableCell className="text-sm text-muted-foreground max-w-[130px] truncate">{p.guardianName}</TableCell>
                  )}

                  {/* Class */}
                  <TableCell className="text-sm">Class {p.class}</TableCell>

                  {/* Batch */}
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${p.batchType === 'JUNIOR' ? 'border-blue-300 text-blue-700 dark:text-blue-300' : 'border-purple-300 text-purple-700 dark:text-purple-300'}`}>
                      {p.batchType}
                    </Badge>
                  </TableCell>

                  {/* Gender */}
                  {!hideSensitiveData && (
                    <TableCell className="text-sm text-muted-foreground">{p.gender === 'MALE' ? 'Male' : p.gender === 'FEMALE' ? 'Female' : '—'}</TableCell>
                  )}

                  {/* Paper Language */}
                  <TableCell className="text-sm text-muted-foreground">
                    {p.questionPaperLanguage === 'HINDI' ? 'Hindi' : p.questionPaperLanguage === 'ENGLISH' ? 'English' : '—'}
                  </TableCell>

                  {/* Referral */}
                  {!hideSensitiveData && (
                    <TableCell className="text-sm text-muted-foreground max-w-[110px] truncate">{p.referralSource || '—'}</TableCell>
                  )}

                  {/* Mobile */}
                  {!hideSensitiveData && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-mono">{p.mobileNumber}</span>
                        <Button variant="ghost" size="icon-xs" onClick={() => copyNumber(p.mobileNumber, p.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedId === p.id ? <CheckCircle2 className="size-3 text-green-500" /> : <Copy className="size-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  )}

                  {/* Payment Status */}
                  <TableCell>
                    <Badge variant={statusBadge[p.paymentStatus] || 'default'} className="text-[10px] px-1.5 py-0 h-5 leading-none">
                      {p.paymentStatus}
                    </Badge>
                  </TableCell>

                  {/* Admit Card */}
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-[11px] ${p.admitCardDownloaded ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`size-1.5 rounded-full ${p.admitCardDownloaded ? 'bg-green-500' : 'bg-red-400'}`} />
                      {p.admitCardDownloaded ? 'Yes' : 'No'}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ShadTooltip>
                        <TooltipTrigger render={<Button variant="outline" size="xs" onClick={() => openWhatsApp(p.mobileNumber)} className="text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10 gap-1">
                          <MessageCircle className="size-3" />WhatsApp
                        </Button>} />
                        <TooltipContent>WhatsApp {p.mobileNumber}</TooltipContent>
                      </ShadTooltip>
                      <ShadTooltip>
                        <TooltipTrigger render={<Button variant="outline" size="xs" onClick={() => openCall(p.mobileNumber)} className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1">
                          <PhoneCall className="size-3" />Call
                        </Button>} />
                        <TooltipContent>Call {p.mobileNumber}</TooltipContent>
                      </ShadTooltip>
                      {p.paymentStatus === 'COMPLETED' && !p.groupInviteSent && !p.groupJoined && (
                        <ShadTooltip>
                          <TooltipTrigger render={<Button variant="outline" size="xs" onClick={() => execAction(() => adminApi.sendGroupInvite(p.id).then(() => setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, groupInviteSent: true } : x))), p.name)} className="gap-1">
                            <UserPlus className="size-3" />Invite
                          </Button>} />
                          <TooltipContent>Send WhatsApp group invite</TooltipContent>
                        </ShadTooltip>
                      )}
                      {p.paymentStatus === 'COMPLETED' && (
                        <ShadTooltip>
                          <TooltipTrigger render={<Button variant="outline" size="xs" onClick={() => setDatesDialog({ id: p.id, name: p.name, isGodMode: godMode })} className="gap-1">
                            <CalendarDays className="size-3" />Dates
                          </Button>} />
                          <TooltipContent>Send important dates</TooltipContent>
                        </ShadTooltip>
                      )}
                      {godMode && (
                        <Button variant="outline" size="xs" onClick={() => setCustomMsgDialog({ id: p.id, name: p.name })} className="gap-1">
                          💬 Message
                        </Button>
                      )}
                      {!p.admitCardDownloaded && p.paymentStatus === 'COMPLETED' && (
                        <ShadTooltip>
                          <TooltipTrigger render={<Button variant="outline" size="xs" onClick={() => execAction(() => adminApi.sendAdmitCardReminder(p.id).then(() => alert(`Reminder sent to ${p.name}`)), p.name)} className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 gap-1">
                            <Bell className="size-3" />Remind
                          </Button>} />
                          <TooltipContent>Remind to download admit card</TooltipContent>
                        </ShadTooltip>
                      )}
                      {p.paymentStatus === 'COMPLETED' && p.rollNumber && (
                        <>
                          <ShadTooltip>
                            <TooltipTrigger render={<Button variant="outline" size="xs" disabled={!!loadingActions[`pdf-${p.id}`]} onClick={async () => {
                              setLoadingActions(prev => ({ ...prev, [`pdf-${p.id}`]: 'downloading' }));
                              try {
                                const res = await adminApi.downloadAdmitCard(p.id);
                                const url = URL.createObjectURL(res.data);
                                const a = document.createElement('a'); a.href = url; a.download = `AdmitCard_${p.rollNumber}.pdf`; a.click(); URL.revokeObjectURL(url);
                              } catch (err: any) { alert(`Download failed: ${err.response?.data?.error || 'Error'}`); }
                              finally { setLoadingActions(prev => { const n = { ...prev }; delete n[`pdf-${p.id}`]; return n; }); }
                            }} className="text-violet-600 border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 gap-1">
                              {loadingActions[`pdf-${p.id}`] ? <Loader2 className="size-3 animate-spin" /> : <FileDown className="size-3" />}PDF
                            </Button>} />
                            <TooltipContent>Download admit card PDF</TooltipContent>
                          </ShadTooltip>
                          <ShadTooltip>
                            <TooltipTrigger render={<Button variant="outline" size="xs" disabled={!!loadingActions[`wa-${p.id}`]} onClick={async () => {
                              setLoadingActions(prev => ({ ...prev, [`wa-${p.id}`]: 'sending' }));
                              try {
                                await adminApi.sendAdmitCardWhatsApp(p.id, godMode);
                                alert(`Admit card sent to ${p.name} on WhatsApp`);
                              } catch (err: any) { alert(`${p.name}: ${err.response?.data?.error || 'Failed'}`); }
                              finally { setLoadingActions(prev => { const n = { ...prev }; delete n[`wa-${p.id}`]; return n; }); }
                            }} className="text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10 gap-1">
                              {loadingActions[`wa-${p.id}`] ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}Card
                            </Button>} />
                            <TooltipContent>Send admit card on WhatsApp</TooltipContent>
                          </ShadTooltip>
                        </>
                      )}
                      {(p.paymentStatus === 'PENDING' || p.paymentStatus === 'FAILED') && (
                        <>
                          <ShadTooltip>
                            <TooltipTrigger render={<Button variant="outline" size="xs" onClick={() => execAction(async () => {
                              const res = await adminApi.verifyPayment(p.id);
                              alert(`${p.name}: ${res.data.message}`);
                              if (res.data.status === 'SUCCESS') setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, paymentStatus: 'COMPLETED' } : x));
                            }, p.name)} className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1">
                              <RotateCcw className="size-3" />Verify
                            </Button>} />
                            <TooltipContent>Verify payment with gateway</TooltipContent>
                          </ShadTooltip>

                          <ShadTooltip>
                            <TooltipTrigger render={<Button variant="outline" size="xs" onClick={() => execAction(async () => {
                              const res = await adminApi.generatePaymentToken(p.id);
                              setPaymentLinkDialog({ id: p.id, name: p.name, link: res.data.paymentLink, validTill: res.data.validTill });
                            }, p.name)} className="text-indigo-600 border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 gap-1">
                              <ExternalLink className="size-3" />Link
                            </Button>} />
                            <TooltipContent>Generate special payment bypass link</TooltipContent>
                          </ShadTooltip>
                        </>
                      )}
                      {p.paymentStatus === 'PENDING' && (
                        <ShadTooltip>
                          <TooltipTrigger render={<Button variant="outline" size="xs" onClick={() => execAction(() => adminApi.sendPaymentReminder(p.id).then(() => alert(`Reminder sent to ${p.name}`)), p.name)} className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1">
                            <Bell className="size-3" />Remind
                          </Button>} />
                          <TooltipContent>Send payment reminder</TooltipContent>
                        </ShadTooltip>
                      )}
                    </div>
                  </TableCell>

                  {/* Time */}
                  <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">{timeAgo(p.createdAt)}</TableCell>
                </TableRow>
              ))}

              {/* Loading rows */}
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={!hideSensitiveData ? 12 : 7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}

              {/* Empty */}
              {!loading && participants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 opacity-40" />
                    <p>No registrations found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </TooltipProvider>
        </div>
      </Card>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {/* Dates Dialog */}
      <Dialog open={!!datesDialog} onOpenChange={open => { if (!open) setDatesDialog(null); }}>
        {datesDialog && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Important Dates</DialogTitle>
              <DialogDescription>
                Send important dates to <strong>{datesDialog.name}</strong>.
                {godMode && <span className="block mt-1 text-red-500">⚡ God Mode active — no rate limits.</span>}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Have the dates changed? If yes, the admit card download status will be cleared so they can download the updated version.
            </p>
            <DialogFooter showCloseButton className="flex-col sm:flex-row gap-2 mt-2">
              <Button variant="destructive" onClick={async () => {
                const { id, name, isGodMode } = datesDialog;
                await (isGodMode ? adminApi.resendImportantDates(id, true) : adminApi.sendImportantDates(id, true));
                setDatesDialog(null);
                setParticipants(prev => prev.map(x => x.id === id ? { ...x, admitCardDownloaded: false } : x));
                alert(`Important dates sent to ${name} (admit card status cleared)`);
              }}>
                Yes, dates changed
              </Button>
              <Button onClick={async () => {
                const { id, name, isGodMode } = datesDialog;
                await (isGodMode ? adminApi.resendImportantDates(id, false) : adminApi.sendImportantDates(id, false));
                setDatesDialog(null);
                alert(`Important dates sent to ${name}`);
              }}>
                No change — just send
              </Button>
              <DialogClose render={<Button variant="secondary">Cancel</Button>} />
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Payment Link Dialog */}
      <Dialog open={!!paymentLinkDialog} onOpenChange={open => { if (!open) setPaymentLinkDialog(null); }}>
        {paymentLinkDialog && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bypass Payment Link</DialogTitle>
              <DialogDescription>
                A unique link has been generated for <strong>{paymentLinkDialog.name}</strong> to make the payment even when registration is closed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Generated Link:</span>
                <span className="text-xs font-mono break-all select-all text-gray-700 dark:text-gray-300">
                  {paymentLinkDialog.link}
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Valid till: {paymentLinkDialog.validTill} IST (5 hours only)
                </span>
              </div>
              
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-lg border border-blue-100 dark:border-blue-900/50 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Copy Message Preview:</span>
                <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-sans">
                  Hi {paymentLinkDialog.name} here is the link to complete your payment, {paymentLinkDialog.link}, this is valid till {paymentLinkDialog.validTill} IST.
                </p>
              </div>
            </div>
            
            <DialogFooter showCloseButton className="mt-4 flex-col sm:flex-row gap-2">
              <Button
                onClick={() => {
                  const message = `Hi ${paymentLinkDialog.name} here is the link to complete your payment, ${paymentLinkDialog.link}, this is valid till ${paymentLinkDialog.validTill} IST.`;
                  navigator.clipboard.writeText(message);
                  alert('Copied formatted message to clipboard!');
                }}
                className="w-full sm:w-auto gap-1.5"
              >
                <Copy className="size-4" /> Copy Message
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm(`Are you sure you want to regenerate the link for ${paymentLinkDialog.name}? This will immediately invalidate the current active link.`)) {
                    return;
                  }
                  try {
                    const res = await adminApi.generatePaymentToken(paymentLinkDialog.id, true);
                    setPaymentLinkDialog({
                      id: paymentLinkDialog.id,
                      name: paymentLinkDialog.name,
                      link: res.data.paymentLink,
                      validTill: res.data.validTill
                    });
                    alert('New payment link generated successfully!');
                  } catch (err: any) {
                    alert(err.response?.data?.error || 'Failed to regenerate link');
                  }
                }}
                className="w-full sm:w-auto gap-1.5"
              >
                <RotateCcw className="size-4" /> Regenerate
              </Button>
              <DialogClose render={<Button variant="secondary" className="w-full sm:w-auto">Close</Button>} />
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* God Mode resend buttons rendered outside table for simplicity — shown as a small floating panel */}
      {godMode && participants.some(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PENDING') && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="p-3 shadow-lg border-red-200 dark:border-red-900">
            <p className="text-[10px] text-red-500 font-medium uppercase tracking-wide mb-2">⚡ God Mode</p>
            <div className="flex flex-wrap gap-1.5">
              {participants.filter(p => p.paymentStatus === 'COMPLETED').slice(0, 1).map(p => (
                <div key={p.id} className="flex flex-wrap gap-1">
                  <Button variant="destructive" size="xs" onClick={() => execAction(() => adminApi.resendPaymentConfirmation(p.id).then(() => alert(`Confirmation resent to ${p.name}`)), p.name)}>Resend Confirmation</Button>
                  <Button variant="destructive" size="xs" onClick={() => execAction(() => adminApi.resendGroupInvite(p.id).then(() => alert(`Group invite resent to ${p.name}`)), p.name)}>Resend Group Invite</Button>
                  <Button variant="destructive" size="xs" onClick={() => execAction(() => adminApi.resendAdmitCardReminder(p.id).then(() => alert(`Reminder resent to ${p.name}`)), p.name)}>Resend Admit Card</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Custom Message Dialog */}
      {customMsgDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Send Custom Message</h3>
            <p className="text-xs text-gray-500 mb-4">to {customMsgDialog.name}</p>
            <textarea
              value={customMsgText}
              onChange={e => setCustomMsgText(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={async () => {
                  if (!customMsgText.trim()) return;
                  try {
                    await adminApi.sendCustomMessage(customMsgDialog.id, customMsgText.trim());
                    alert(`Message sent to ${customMsgDialog.name}`);
                  } catch (err: any) {
                    alert(err.response?.data?.error || 'Failed to send');
                  }
                  setCustomMsgDialog(null);
                  setCustomMsgText('');
                }}
                disabled={!customMsgText.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
              <button
                onClick={() => { setCustomMsgDialog(null); setCustomMsgText(''); }}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
