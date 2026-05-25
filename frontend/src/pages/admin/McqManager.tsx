import React, { useState, useEffect, useRef } from 'react';
import { McqItem } from '../../types';
import { mcqApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Upload, Download, Search, X } from 'lucide-react';

export function McqManager() {
  const [mcqs, setMcqs] = useState<McqItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<McqItem | null>(null);
  const [form, setForm] = useState({
    question: '',
    optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: 'A',
    class: '', batchType: '', subject: '',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page: p, limit };
      if (search.trim()) params.search = search.trim();
      if (filterBatch) params.batchType = filterBatch;
      const r = await mcqApi.list(params);
      setMcqs(r.data.mcqs);
      setTotal(r.data.total);
      setPage(r.data.page);
    } catch {
      setError('Failed to load MCQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { load(1); }, 300);
    return () => clearTimeout(timer);
  }, [search, filterBatch]);

  const openCreate = () => {
    setEditing(null);
    setForm({ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', class: '', batchType: '', subject: '' });
    setDialogOpen(true);
  };

  const openEdit = (mcq: McqItem) => {
    setEditing(mcq);
    setForm({
      question: mcq.question,
      optionA: mcq.options.A, optionB: mcq.options.B, optionC: mcq.options.C, optionD: mcq.options.D,
      correctAnswer: mcq.correctAnswer,
      class: mcq.class || '', batchType: mcq.batchType || '', subject: mcq.subject || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) { setError('Question is required'); return; }
    if (!form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
      setError('All four options are required'); return;
    }
    setError(''); setMessage('');
    const payload = {
      question: form.question.trim(),
      options: { A: form.optionA.trim(), B: form.optionB.trim(), C: form.optionC.trim(), D: form.optionD.trim() },
      correctAnswer: form.correctAnswer,
      class: form.class.trim() || undefined,
      batchType: form.batchType || undefined,
      subject: form.subject.trim() || undefined,
    };
    try {
      if (editing) {
        await mcqApi.update(editing.id, payload);
        setMessage('MCQ updated');
      } else {
        await mcqApi.create(payload);
        setMessage('MCQ created');
      }
      setDialogOpen(false);
      await load();
    } catch { setError('Failed to save MCQ'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this MCQ?')) return;
    try {
      await mcqApi.delete(id);
      setMessage('MCQ deleted');
      await load();
    } catch { setError('Failed to delete MCQ'); }
  };

  const handleImport = async () => {
    if (!importFile) { setError('Please select a CSV file'); return; }
    setImporting(true); setError(''); setMessage('');
    const fd = new FormData();
    fd.append('file', importFile);
    fd.append('mode', importMode);
    try {
      const r = await mcqApi.importCsv(fd);
      setMessage(r.data.message);
      setImportDialogOpen(false);
      setImportFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; rowErrors?: Array<{ row: number; error: string }> } } })?.response?.data;
      if (data?.rowErrors) {
        setError(`${data.error}\n${data.rowErrors.map((e: { row: number; error: string }) => `Row ${e.row}: ${e.error}`).join('\n')}`);
      } else {
        setError(data?.error || 'Failed to import MCQs');
      }
    } finally { setImporting(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const r = await mcqApi.exportCsv();
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'mcqs.csv'; a.click();
      window.URL.revokeObjectURL(url);
      setMessage('MCQs exported');
    } catch { setError('Failed to export MCQs'); }
    finally { setExporting(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight">MCQ Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="size-4 mr-1" />Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="size-4 mr-1" />{exporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button onClick={openCreate} size="sm">
            <Plus className="size-4 mr-1" />Add MCQ
          </Button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-primary/10 text-primary text-sm rounded-lg border border-primary/20">{message}</div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 whitespace-pre-line">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="pl-8"
          />
        </div>
        <Select value={filterBatch || null} onValueChange={(v) => setFilterBatch(v ?? '')}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Batches</SelectItem>
            <SelectItem value="JUNIOR">Junior</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
            <SelectItem value="BOTH">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All MCQs ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : mcqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No MCQs added yet.</p>
          ) : (
            <div className="space-y-3">
              {mcqs.map((mcq) => (
                <div key={mcq.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-2">{mcq.question}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {(['A', 'B', 'C', 'D'] as const).map((k) => (
                          <div key={k} className="flex items-center gap-1.5 text-xs">
                            <span className={`inline-flex items-center justify-center size-5 rounded-full font-semibold text-[10px] ${
                              mcq.correctAnswer === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>{k}</span>
                            <span className="text-muted-foreground truncate">{mcq.options[k]}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {mcq.batchType && (
                          <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{mcq.batchType}</span>
                        )}
                        {mcq.class && (
                          <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Class {mcq.class}</span>
                        )}
                        {mcq.subject && (
                          <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{mcq.subject}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(mcq)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(mcq.id)} className="text-destructive">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</Button>
                <Button variant="outline" size="xs" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit MCQ' : 'Add MCQ'}</DialogTitle>
            <DialogDescription>Fill in the question, options, and correct answer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question</label>
              <Textarea
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="Enter the question..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Option {k}</label>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center justify-center size-5 rounded-full font-semibold text-[10px] shrink-0 ${
                      form.correctAnswer === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>{k}</span>
                    <Input
                      value={form[`option${k}`]}
                      onChange={(e) => setForm({ ...form, [`option${k}`]: e.target.value })}
                      placeholder={`Option ${k}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correct Answer</label>
              <Select value={form.correctAnswer} onValueChange={(v) => setForm({ ...form, correctAnswer: v ?? 'A' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Batch</label>
                <Select value={form.batchType || null} onValueChange={(v) => setForm({ ...form, batchType: v ?? '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="JUNIOR">Junior</SelectItem>
                    <SelectItem value="SENIOR">Senior</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Class</label>
                <Input
                  value={form.class}
                  onChange={(e) => setForm({ ...form, class: e.target.value })}
                  placeholder="e.g. 10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Science"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import MCQs from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: question, optionA, optionB, optionC, optionD, correctAnswer, class, batchType, subject
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Import mode:</label>
              <div className="flex gap-2">
                <Button
                  variant={importMode === 'append' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportMode('append')}
                >
                  Append
                </Button>
                <Button
                  variant={importMode === 'replace' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setImportMode('replace')}
                >
                  Replace All
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {importMode === 'append'
                ? 'New MCQs will be added to the existing list.'
                : 'All existing MCQs will be deleted before importing.'}
            </p>
            <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors text-muted-foreground text-sm">
              <Upload className="size-6" />
              <span>{importFile ? importFile.name : 'Click to select CSV file'}</span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            <Button variant="link" size="sm" className="text-xs" onClick={handleExport}>
              Download sample CSV
            </Button>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleImport} disabled={!importFile || importing}>
              {importing ? 'Importing...' : `Import (${importMode === 'replace' ? 'Replace' : 'Append'})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
