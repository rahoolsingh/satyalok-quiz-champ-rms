import React, { useState, useEffect } from 'react';
import { adminApi, portalApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function ResultUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [pubDate, setPubDate] = useState('');
  const [currentPubDate, setCurrentPubDate] = useState<string | null>(null);
  const [resultsPublished, setResultsPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [invalidRolls, setInvalidRolls] = useState<string[]>([]);

  useEffect(() => {
    portalApi.getStatus().then(r => {
      setCurrentPubDate(r.data.resultPublicationDate || null);
      setResultsPublished(r.data.resultsPublished || false);
      if (r.data.resultPublicationDate) {
        setPubDate(r.data.resultPublicationDate.slice(0, 16));
      }
    }).catch(() => {});
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a CSV file'); return; }
    setUploading(true); setMessage(''); setError(''); setInvalidRolls([]);
    const fd = new FormData(); fd.append('file', file);
    try { const r = await adminApi.uploadResults(fd); setMessage(r.data.message); }
    catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string; invalidRollNumbers?: string[] } } })?.response?.data;
      setError(d?.error || 'Upload failed');
      if (d?.invalidRollNumbers) setInvalidRolls(d.invalidRollNumbers);
    } finally { setUploading(false); }
  };

  const handlePublish = async () => {
    setPublishing(true); setMessage(''); setError('');
    try { await adminApi.publishResults(pubDate || undefined); setMessage('Results published successfully'); }
    catch { setError('Failed to publish results'); } finally { setPublishing(false); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-6">Result Management</h2>
      {message && <Alert className="mb-4 border-primary/20 bg-primary/5"><AlertTitle>{message}</AlertTitle></Alert>}
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>{error}</AlertTitle></Alert>}
      {invalidRolls.length > 0 && (
        <Alert className="mb-4 border-orange-500/20 bg-orange-50">
          <AlertTitle>Invalid Roll Numbers:</AlertTitle>
          <AlertDescription><ul className="mt-1 list-disc pl-4">{invalidRolls.map(r => <li key={r}>{r}</li>)}</ul></AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Upload Results (CSV)</CardTitle>
          <CardDescription>Format: <code className="bg-muted px-1.5 py-0.5 rounded">rollNumber,score,positiveMarks,negativeMarks,rank,remarks</code></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-3">
            <Input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="file:text-sm file:text-foreground" />
            <Button type="submit" disabled={uploading || !file}>{uploading ? 'Uploading…' : 'Upload Results'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Result Announcement Date & Time</CardTitle>
        </CardHeader>
        <CardContent>
          {currentPubDate ? (
            <div className="mb-4 p-3 bg-muted rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">Current Announcement Schedule</p>
              <p className="text-base font-semibold mt-1">
                {new Date(currentPubDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                {' '}
                {new Date(currentPubDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
              </p>
              <p className={`text-xs font-medium mt-1 ${resultsPublished ? 'text-green-600' : 'text-orange-600'}`}>
                {resultsPublished ? '✓ Published — visible to students' : '⏳ Scheduled — not yet visible'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">No announcement date has been set yet.</p>
          )}
          <div className="space-y-1.5 mb-3">
            <label className="text-sm font-medium">Set Announcement Date & Time (IST)</label>
            <Input type="datetime-local" value={pubDate} onChange={e => setPubDate(e.target.value)} />
          </div>
          <Button onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Publishing…' : resultsPublished ? '🔄 Update Announcement Date' : '🚀 Publish Results Now'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
