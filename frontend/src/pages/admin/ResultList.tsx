import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownAZ, ArrowUpAZ, ChevronLeft, ChevronRight, Loader2, Search, Trophy, FileImage } from 'lucide-react';

type BatchFilter = 'JUNIOR' | 'SENIOR';
type SortBy = 'score' | 'rank' | 'name' | 'rollNumber';
type SortOrder = 'asc' | 'desc';

interface ResultRecord {
  id: string;
  participantId: string;
  rollNumber: string;
  score: number;
  positiveMarks?: number;
  negativeMarks?: number;
  rank?: number;
  remarks?: string;
  answerSheetUrl?: string;
  publishedAt?: string;
  participantName: string;
  batchType: string;
  participantClass: string;
  participantPhotoUrl?: string;
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

export function ResultList() {
  const [records, setRecords] = useState<ResultRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 50, pages: 0 });
  const [batch, setBatch] = useState<BatchFilter>('JUNIOR');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => ({
    batch,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
    page,
    limit,
  }), [batch, debouncedSearch, limit, page, sortBy, sortOrder]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getResultsList(params);
      setRecords(response.data.results || []);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        pages: response.data.pages,
      });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load results.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [batch, debouncedSearch, limit, sortBy, sortOrder]);

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder(field === 'score' ? 'desc' : 'asc');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Trophy className="size-5 text-primary" />
            Result List
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{pagination.total} result records</p>
        </div>
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
            <Tabs value={batch} onValueChange={value => setBatch(value as BatchFilter)}>
              <TabsList>
                <TabsTrigger value="JUNIOR">Junior</TabsTrigger>
                <TabsTrigger value="SENIOR">Senior</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(limit)} onValueChange={value => setLimit(Number(value))}>
              <SelectTrigger size="sm" className="w-[120px]">
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
            <Button variant="outline" size="sm" onClick={() => toggleSort('score')}>
              {sortBy === 'score' && sortOrder === 'asc' ? <ArrowUpAZ className="mr-1 h-4 w-4" /> : <ArrowDownAZ className="mr-1 h-4 w-4" />}
              Score
            </Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort('rank')}>
              {sortBy === 'rank' && sortOrder === 'asc' ? <ArrowUpAZ className="mr-1 h-4 w-4" /> : <ArrowDownAZ className="mr-1 h-4 w-4" />}
              Rank
            </Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort('name')}>
              {sortBy === 'name' && sortOrder === 'desc' ? <ArrowDownAZ className="mr-1 h-4 w-4" /> : <ArrowUpAZ className="mr-1 h-4 w-4" />}
              Name
            </Button>
            <Button variant="outline" size="sm" onClick={() => toggleSort('rollNumber')}>
              {sortBy === 'rollNumber' && sortOrder === 'desc' ? <ArrowDownAZ className="mr-1 h-4 w-4" /> : <ArrowUpAZ className="mr-1 h-4 w-4" />}
              Roll Number
            </Button>
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
                <TableHead>Score</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Answer Sheet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-10 w-56" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
              {!loading && records.map(record => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={record.participantPhotoUrl} />
                        <AvatarFallback>{getInitials(record.participantName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{record.participantName}</p>
                        <p className="text-xs text-muted-foreground">{record.rollNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{record.participantClass}</TableCell>
                  <TableCell><Badge variant="secondary">{record.batchType}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{record.score}</span>
                      {(record.positiveMarks !== undefined || record.negativeMarks !== undefined) && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-emerald-600 font-medium">+{record.positiveMarks || 0}</span>
                          <span className="text-destructive font-medium">-{record.negativeMarks || 0}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.rank ? <Badge variant="default">#{record.rank}</Badge> : '-'}
                  </TableCell>
                  <TableCell>
                    {record.answerSheetUrl ? (
                      <a href={record.answerSheetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
                        <FileImage className="h-4 w-4" /> View
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No results found.
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
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(prev => Math.min(pagination.pages || 1, prev + 1))} disabled={page >= pagination.pages || loading}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
