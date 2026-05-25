import React, { useState, useEffect, useRef } from 'react';
import { FaqItem } from '../../types';
import { adminFaqApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, GripVertical, Upload, Download } from 'lucide-react';

export function FaqManager() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', isPublished: true });
  const [dialogOpen, setDialogOpen] = useState(false);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const r = await adminFaqApi.getAll();
      setFaqs(r.data);
    } catch {
      setError('Failed to load FAQs');
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ question: '', answer: '', isPublished: true });
    setDialogOpen(true);
  };

  const openEdit = (faq: FaqItem) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, isPublished: faq.isPublished ?? true });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      setError('Question and answer are required');
      return;
    }
    setError('');
    setMessage('');
    try {
      if (editing) {
        await adminFaqApi.update(editing.id, form);
        setMessage('FAQ updated');
      } else {
        await adminFaqApi.create(form);
        setMessage('FAQ created');
      }
      setDialogOpen(false);
      await load();
    } catch {
      setError('Failed to save FAQ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await adminFaqApi.delete(id);
      setMessage('FAQ deleted');
      await load();
    } catch {
      setError('Failed to delete FAQ');
    }
  };

  const move = async (i: number, dir: 'up' | 'down') => {
    const arr = [...faqs];
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    try {
      for (let idx = 0; idx < arr.length; idx++) {
        await adminFaqApi.update(arr[idx].id, { displayOrder: idx });
      }
      setFaqs(arr.map((f, idx) => ({ ...f, displayOrder: idx })));
    } catch {
      setError('Failed to reorder');
    }
  };

  const handleImport = async () => {
    if (!importFile) { setError('Please select a CSV file'); return; }
    setImporting(true); setError(''); setMessage('');
    const fd = new FormData();
    fd.append('file', importFile);
    fd.append('mode', importMode);
    try {
      const r = await adminFaqApi.importCsv(fd);
      setMessage(r.data.message);
      setImportDialogOpen(false);
      setImportFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; rowErrors?: Array<{ row: number; error: string }> } } })?.response?.data;
      if (data?.rowErrors) {
        setError(`${data.error}\n${data.rowErrors.map((e) => `Row ${e.row}: ${e.error}`).join('\n')}`);
      } else {
        setError(data?.error || 'Failed to import FAQs');
      }
    } finally { setImporting(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const r = await adminFaqApi.exportCsv();
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'faqs.csv'; a.click();
      window.URL.revokeObjectURL(url);
      setMessage('FAQs exported');
    } catch {
      setError('Failed to export FAQs');
    } finally { setExporting(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight">FAQ Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="size-4 mr-1" />Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="size-4 mr-1" />{exporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button onClick={openCreate} size="sm">
            <Plus className="size-4 mr-1" />Add FAQ
          </Button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-primary/10 text-primary text-sm rounded-lg border border-primary/20">{message}</div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 whitespace-pre-line">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All FAQs ({faqs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No FAQs added yet.</p>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={faq.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <button onClick={() => move(i, 'up')} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed leading-none">
                      <GripVertical className="size-3 rotate-90" />
                    </button>
                    <button onClick={() => move(i, 'down')} disabled={i === faqs.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed leading-none">
                      <GripVertical className="size-3 rotate-90" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{faq.question}</span>
                      {!faq.isPublished && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Draft</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(faq)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(faq.id)} className="text-destructive">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the question and answer below.' : 'Fill in the question and answer for the new FAQ.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question</label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Enter the question..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Answer</label>
              <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Enter the answer..." rows={4} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} id="faq-published" />
              <label htmlFor="faq-published" className="text-sm text-muted-foreground">Published</label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import FAQs from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: question, answer, isPublished (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Import mode:</label>
              <div className="flex gap-2">
                <Button variant={importMode === 'append' ? 'default' : 'outline'} size="sm" onClick={() => setImportMode('append')}>Append</Button>
                <Button variant={importMode === 'replace' ? 'destructive' : 'outline'} size="sm" onClick={() => setImportMode('replace')}>Replace All</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {importMode === 'append'
                ? 'New FAQs will be added to the existing list.'
                : 'All existing FAQs will be deleted before importing.'}
            </p>
            <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors text-muted-foreground text-sm">
              <Upload className="size-6" />
              <span>{importFile ? importFile.name : 'Click to select CSV file'}</span>
              <input ref={fileRef} type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
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
