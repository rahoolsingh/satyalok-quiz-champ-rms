import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function FeeConfiguration() {
  const [feeJunior, setFeeJunior] = useState('');
  const [feeSenior, setFeeSenior] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getFees().then(r => {
      setFeeJunior(String(r.data.feeJunior));
      setFeeSenior(String(r.data.feeSenior));
    }).catch(() => {
      setFeeJunior('100');
      setFeeSenior('150');
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const junior = Number(feeJunior);
    const senior = Number(feeSenior);
    if (!junior || !senior || junior <= 0 || senior <= 0) {
      setError('Both fees must be positive numbers');
      return;
    }
    setSaving(true); setMessage(''); setError('');
    try {
      await adminApi.updateFees(junior, senior);
      setMessage('Fees updated successfully');
    } catch {
      setError('Failed to update fees');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-6">Registration Fee Configuration</h2>

      {message && <div className="mb-4 p-3 bg-primary/10 text-primary text-sm rounded-lg border border-primary/20">{message}</div>}
      {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Batch Fees (₹ INR)</CardTitle>
          <CardDescription>Set the registration fee for each batch. Changes take effect immediately for new registrations.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Junior Batch Fee (₹)</label>
                <Input type="number" min="1" step="1" value={feeJunior} onChange={e => setFeeJunior(e.target.value)} placeholder="100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Senior Batch Fee (₹)</label>
                <Input type="number" min="1" step="1" value={feeSenior} onChange={e => setFeeSenior(e.target.value)} placeholder="150" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Fees'}</Button>
              <p className="text-sm text-muted-foreground">
                Current: Junior ₹{feeJunior || '—'} · Senior ₹{feeSenior || '—'}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
