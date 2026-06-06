import { useCallback, useEffect, useMemo, useState } from 'react';
import { attendanceApi } from '@/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownAZ, ArrowUpAZ, ChevronLeft, ChevronRight, Download, Loader2, Search, UserCheck } from 'lucide-react';

type BatchFilter = 'ALL' | 'JUNIOR' | 'SENIOR';
type StatusFilter = 'PRESENT' | 'ABSENT';
type SortBy = 'checkInTime' | 'rollNumber' | 'name';
type SortOrder = 'asc' | 'desc';

interface AttendanceRecord {
  attendanceId?: string;
  participantId: string;
  rollNumber: string;
  name: string;
  class: string;
  batchType: 'JUNIOR' | 'SENIOR';
  mobileNumber?: string;
  photoUrl?: string;
  checkInTime?: string;
  scanMethod?: 'QR' | 'MANUAL';
  status: StatusFilter;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function formatTime(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function getTodayIndianDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function timeAgo(value?: string) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function isRecent(value?: string) {
  if (!value) return false;
  return Date.now() - new Date(value).getTime() < 5 * 60 * 1000;
}

export function AttendanceList() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 50, pages: 0 });
  const [batch, setBatch] = useState<BatchFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('PRESENT');
  const [date, setDate] = useState(getTodayIndianDateString());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('checkInTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => ({
    batchType: batch === 'ALL' ? undefined : batch,
    status,
    date: date || undefined,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
    page,
    limit,
  }), [batch, date, debouncedSearch, limit, page, sortBy, sortOrder, status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await attendanceApi.getList(params);
      setRecords(response.data.records);
      setPagination(response.data.pagination);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [batch, date, debouncedSearch, limit, sortBy, sortOrder, status]);

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder(field === 'checkInTime' ? 'desc' : 'asc');
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const response = await attendanceApi.exportCsv({
        batchType: batch === 'ALL' ? undefined : batch,
        status,
        date: date || undefined,
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <UserCheck className="size-5 text-primary" />
            Attendance List
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{pagination.total} {status.toLowerCase()} participant records on {date}</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={exporting}>
          {exporting ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Download data-icon="inline-start" />}
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search by roll number or student name.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search roll number or name"
                className="pl-9"
              />
            </div>
            <Input
              type="date"
              value={date}
              onChange={event => setDate(event.target.value || getTodayIndianDateString())}
              className="w-full xl:w-44"
            />
            <Tabs value={batch} onValueChange={value => setBatch(value as BatchFilter)}>
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="JUNIOR">Junior</TabsTrigger>
                <TabsTrigger value="SENIOR">Senior</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={status} onValueChange={value => setStatus(value as StatusFilter)}>
              <TabsList>
                <TabsTrigger value="PRESENT">Present</TabsTrigger>
                <TabsTrigger value="ABSENT">Absent</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(limit)} onValueChange={value => setLimit(Number(value))}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {status === 'PRESENT' && (
              <>
                <Button variant="outline" size="sm" onClick={() => toggleSort('checkInTime')}>
                  {sortBy === 'checkInTime' && sortOrder === 'asc' ? <ArrowUpAZ data-icon="inline-start" /> : <ArrowDownAZ data-icon="inline-start" />}
                  Time
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleSort('rollNumber')}>
                  {sortBy === 'rollNumber' && sortOrder === 'desc' ? <ArrowDownAZ data-icon="inline-start" /> : <ArrowUpAZ data-icon="inline-start" />}
                  Roll
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleSort('name')}>
                  {sortBy === 'name' && sortOrder === 'desc' ? <ArrowDownAZ data-icon="inline-start" /> : <ArrowUpAZ data-icon="inline-start" />}
                  Name
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card size="sm" className="border-destructive/30">
          <CardContent className="text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>{status === 'PRESENT' ? 'Check-in' : 'Mobile'}</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-10 w-56" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                </TableRow>
              ))}
              {!loading && records.map(record => (
                <TableRow key={record.attendanceId || record.participantId} className={isRecent(record.checkInTime) ? 'bg-primary/5' : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={record.photoUrl} />
                        <AvatarFallback>{getInitials(record.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{record.name}</p>
                        <p className="text-xs text-muted-foreground">{record.rollNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{record.class}</TableCell>
                  <TableCell><Badge variant="secondary">{record.batchType}</Badge></TableCell>
                  <TableCell>
                    {status === 'PRESENT' ? (
                      <div>
                        <p>{formatTime(record.checkInTime)}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(record.checkInTime)}</p>
                      </div>
                    ) : record.mobileNumber || '-'}
                  </TableCell>
                  <TableCell>
                    {status === 'PRESENT' ? <Badge variant="outline">{record.scanMethod}</Badge> : <Badge variant="destructive">ABSENT</Badge>}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {pagination.page} of {Math.max(1, pagination.pages)} · {pagination.total} total
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page <= 1 || loading}>
            <ChevronLeft data-icon="inline-start" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(prev => Math.min(pagination.pages || 1, prev + 1))} disabled={page >= pagination.pages || loading}>
            Next
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
