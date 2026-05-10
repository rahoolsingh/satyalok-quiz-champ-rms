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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%' }}>
      <h2 style={{ fontSize: 'clamp(1.4rem,3vw,1.8rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#1d1d1f', marginBottom: 6 }}>Check your result</h2>
      <p style={{ color: '#86868b', fontSize: '0.95rem', marginBottom: 24 }}>Enter your 5-digit roll number</p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          value={roll}
          onChange={e => setRoll(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="e.g. 12345"
          inputMode="numeric"
          maxLength={5}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Roll number"
          style={{
            flex: 1, padding: '11px 14px', background: '#ffffff', color: '#1d1d1f',
            border: `1px solid ${focused ? '#0071e3' : '#d2d2d7'}`,
            borderRadius: 8, fontSize: '1rem', textAlign: 'center', letterSpacing: '0.15em',
            boxShadow: focused ? '0 0 0 3px rgba(0,113,227,0.2)' : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ opacity: 0.88 }}
          whileTap={{ scale: 0.97 }}
          style={{ padding: '11px 22px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {loading && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
          {loading ? '' : 'Search'}
        </motion.button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ color: '#ef4444', fontSize: '0.88rem', marginBottom: 12 }} role="alert">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ border: '1px solid #d2d2d7', borderRadius: 12, overflow: 'hidden', marginTop: 8 }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f5f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ background: '#f5f5f7', color: '#1d1d1f', padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>#{result.rollNumber}</span>
                <span style={{ color: '#86868b', fontSize: '0.82rem' }}>{result.batchType}</span>
              </div>
              <p style={{ fontWeight: 600, fontSize: '1.05rem', color: '#1d1d1f' }}>{result.name}</p>
              <p style={{ color: '#86868b', fontSize: '0.88rem' }}>Class: {result.class}</p>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ flex: 1, padding: '16px 20px', textAlign: 'center', borderRight: result.rank ? '1px solid #f5f5f7' : 'none' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Score</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#0071e3', letterSpacing: '-0.02em' }}>{result.score}</p>
              </div>
              {result.rank && (
                <div style={{ flex: 1, padding: '16px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 500, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Rank</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>#{result.rank}</p>
                </div>
              )}
            </div>
            {result.remarks && (
              <p style={{ padding: '12px 20px', color: '#86868b', fontSize: '0.88rem', borderTop: '1px solid #f5f5f7', fontStyle: 'italic' }}>
                {result.remarks}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
