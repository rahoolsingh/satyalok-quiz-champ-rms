import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultData } from '../types';
import { resultsApi } from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ResultChecker() {
  const [roll, setRoll] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(roll)) { setError('Please enter a valid 5-digit roll number'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await resultsApi.getResult(roll);
      setResult(res.data);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'No result found');
    } finally { setLoading(false); }
  };

  return (
    <motion.div className="w-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-[clamp(1.4rem,3vw,1.8rem)] font-bold tracking-tight text-foreground mb-1.5">Check your result</h2>
      <p className="text-muted-foreground text-sm mb-6">Enter your 5-digit roll number</p>

      <form onSubmit={handleSearch} className="flex gap-2.5 mb-4">
        <Input
          value={roll}
          onChange={e => setRoll(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="e.g. 12345"
          inputMode="numeric"
          maxLength={5}
          aria-label="Roll number"
          className="text-base text-center tracking-widest"
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? (
            <span className="size-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
          ) : 'Search'}
        </Button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-destructive text-sm mb-3" role="alert">{error}</motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="ring-1 ring-border rounded-xl overflow-hidden mt-2">
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-muted text-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold">#{result.rollNumber}</span>
                <span className="text-muted-foreground text-xs">{result.batchType}</span>
              </div>
              <p className="font-semibold text-foreground">{result.name}</p>
              <p className="text-muted-foreground text-sm">Class: {result.class}</p>
            </div>
            <div className="flex">
              <div className={`flex-1 px-5 py-4 text-center ${result.rank ? 'border-r border-border' : ''}`}>
                <p className="text-[0.68rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">Score</p>
                <p className="text-4xl font-bold text-primary tracking-tight">{result.score}</p>
              </div>
              {result.rank && (
                <div className="flex-1 px-5 py-4 text-center">
                  <p className="text-[0.68rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">Rank</p>
                  <p className="text-4xl font-bold text-foreground tracking-tight">#{result.rank}</p>
                </div>
              )}
            </div>
            {result.remarks && (
              <p className="px-5 py-3 text-muted-foreground text-sm border-t border-border italic">{result.remarks}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
