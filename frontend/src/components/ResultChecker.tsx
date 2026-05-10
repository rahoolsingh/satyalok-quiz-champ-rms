import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultData } from '../types';
import { resultsApi } from '../api/client';

export function ResultChecker() {
  const [roll, setRoll] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

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
      <h2 className="text-[clamp(1.4rem,3vw,1.8rem)] font-bold tracking-tight text-[#1d1d1f] mb-1.5">Check your result</h2>
      <p className="text-[#86868b] text-sm mb-6">Enter your 5-digit roll number</p>

      <form onSubmit={handleSearch} className="flex gap-2.5 mb-4">
        <input
          value={roll}
          onChange={e => setRoll(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="e.g. 12345"
          inputMode="numeric"
          maxLength={5}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Roll number"
          className={`flex-1 px-4 py-2.5 bg-white text-[#1d1d1f] rounded-lg text-base text-center tracking-widest outline-none transition-all
            ${focused ? 'border border-[#0071e3] shadow-[0_0_0_3px_rgba(0,113,227,0.2)]' : 'border border-[#d2d2d7]'}`}
        />
        <motion.button type="submit" disabled={loading}
          whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
          className="px-5 py-2.5 bg-[#0071e3] text-white rounded-full font-semibold text-sm flex items-center gap-1.5 shrink-0">
          {loading
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : 'Search'}
        </motion.button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[#ef4444] text-sm mb-3" role="alert">{error}</motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="border border-[#d2d2d7] rounded-xl overflow-hidden mt-2">
            <div className="px-5 py-4 border-b border-[#f5f5f7]">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#f5f5f7] text-[#1d1d1f] px-2.5 py-0.5 rounded-full text-xs font-semibold">#{result.rollNumber}</span>
                <span className="text-[#86868b] text-xs">{result.batchType}</span>
              </div>
              <p className="font-semibold text-[#1d1d1f]">{result.name}</p>
              <p className="text-[#86868b] text-sm">Class: {result.class}</p>
            </div>
            <div className="flex">
              <div className={`flex-1 px-5 py-4 text-center ${result.rank ? 'border-r border-[#f5f5f7]' : ''}`}>
                <p className="text-[0.68rem] font-medium text-[#86868b] uppercase tracking-wider mb-1">Score</p>
                <p className="text-4xl font-bold text-[#0071e3] tracking-tight">{result.score}</p>
              </div>
              {result.rank && (
                <div className="flex-1 px-5 py-4 text-center">
                  <p className="text-[0.68rem] font-medium text-[#86868b] uppercase tracking-wider mb-1">Rank</p>
                  <p className="text-4xl font-bold text-[#1d1d1f] tracking-tight">#{result.rank}</p>
                </div>
              )}
            </div>
            {result.remarks && (
              <p className="px-5 py-3 text-[#86868b] text-sm border-t border-[#f5f5f7] italic">{result.remarks}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
