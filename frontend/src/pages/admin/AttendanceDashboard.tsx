import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { attendanceApi } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, ClipboardCheck, RefreshCw, ScanLine, Users } from 'lucide-react';

interface AttendanceStats {
  date: string;
  totalRegistrations: number;
  totalAttendance: number;
  attendancePercentage: number;
  juniorRegistrations: number;
  juniorAttendance: number;
  juniorPercentage: number;
  seniorRegistrations: number;
  seniorAttendance: number;
  seniorPercentage: number;
  lastUpdated: string;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function formatUpdated(value?: string) {
  if (!value) return 'Not loaded';
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function StatCard({
  label,
  attended,
  registered,
  percentage,
  icon: Icon,
}: {
  label: string;
  attended: number;
  registered: number;
  percentage: number;
  icon: typeof Users;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon data-icon="inline-start" />
          {label}
        </CardTitle>
        <CardDescription>{formatNumber(attended)} of {formatNumber(registered)} present</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-bold leading-none">{percentage}%</p>
          <Badge variant="secondary">{formatNumber(attended)}</Badge>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function AttendanceDashboard() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Default to today's date in IST format YYYY-MM-DD
  const [dateFilter, setDateFilter] = useState('');

  const loadStats = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await attendanceApi.getStats({ date: dateFilter || undefined });
      setStats(response.data.stats);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load attendance stats.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadStats();
    const timer = window.setInterval(() => loadStats(true), 10000);
    return () => window.clearInterval(timer);
  }, [loadStats]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      { batch: 'Junior', Present: stats.juniorAttendance, Registered: stats.juniorRegistrations },
      { batch: 'Senior', Present: stats.seniorAttendance, Registered: stats.seniorRegistrations },
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardCheck className="size-5 text-primary" />
            Attendance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live exam-day attendance for {stats?.date || 'today'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Updated {formatUpdated(stats?.lastUpdated)}</Badge>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-[140px] h-9"
          />
          <Button variant="outline" size="sm" onClick={() => loadStats(true)} disabled={refreshing}>
            <RefreshCw data-icon="inline-start" className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card size="sm" className="border-destructive/30">
          <CardContent className="text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {stats && (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard
              label="Total"
              attended={stats.totalAttendance}
              registered={stats.totalRegistrations}
              percentage={stats.attendancePercentage}
              icon={Users}
            />
            <StatCard
              label="Junior"
              attended={stats.juniorAttendance}
              registered={stats.juniorRegistrations}
              percentage={stats.juniorPercentage}
              icon={ScanLine}
            />
            <StatCard
              label="Senior"
              attended={stats.seniorAttendance}
              registered={stats.seniorRegistrations}
              percentage={stats.seniorPercentage}
              icon={BarChart3}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Batch Overview</CardTitle>
              <CardDescription>Present count compared with completed registrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="batch" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="Registered" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
