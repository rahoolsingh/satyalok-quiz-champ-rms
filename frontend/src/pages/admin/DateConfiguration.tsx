import React, { useState, useEffect } from 'react';
import { adminApi, portalApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const statuses = ['AUTO', 'COUNTDOWN', 'OPEN', 'CLOSED'] as const;

export function DateConfiguration() {
  const [openingDate, setOpeningDate] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [manualStatus, setManualStatus] = useState('AUTO');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    portalApi.getStatus().then(r => {
      setOpeningDate(r.data.openingDate?.slice(0, 16) || '');
      setClosingDate(r.data.closingDate?.slice(0, 16) || '');
    }).catch(() => {});
  }, []);

  const saveDates = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage(''); setError('');
    try { await adminApi.updateDates(openingDate, closingDate); setMessage('Dates updated successfully'); }
    catch { setError('Failed to update dates'); } finally { setSaving(false); }
  };

  const saveStatus = async () => {
    setSaving(true); setMessage(''); setError('');
    try { await adminApi.updateStatus(manualStatus); setMessage('Portal status updated'); }
    catch { setError('Failed to update status'); } finally { setSaving(false); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-6">Portal Date Configuration</h2>
      {message && <div className="mb-4 p-3 bg-primary/10 text-primary text-sm rounded-lg border border-primary/20">{message}</div>}
      {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Registration Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveDates} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Opening Date & Time</label>
              <Input type="datetime-local" value={openingDate} onChange={e => setOpeningDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Closing Date & Time</label>
              <Input type="datetime-local" value={closingDate} onChange={e => setClosingDate(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving}>Save Dates</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Status Override</CardTitle>
          <CardDescription>Use AUTO to let dates control the portal automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap mb-4">
            {statuses.map(s => (
              <Button key={s} variant={manualStatus === s ? 'default' : 'outline'} size="sm" onClick={() => setManualStatus(s)}>
                {s}
              </Button>
            ))}
          </div>
          <Button onClick={saveStatus} disabled={saving}>Apply Status</Button>
        </CardContent>
      </Card>
    </div>
  );
}
