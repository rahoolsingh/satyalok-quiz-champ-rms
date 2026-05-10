import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultData } from '../types';
import { resultsApi } from '../api/client';

export function ResultChecker() {
  const [rollNumber, setRollNumber] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(rollNumber)) { setError('Please enter a valid 5-digit roll number'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await resultsApi.getResult(rollNumber);
      setResult(res.data);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to fetch result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div style={wrap} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={iconCircle}>📊</div>
          <h2 style={title}>Check Your Result</h2>
          <p style={sub}>Enter your 5-digit roll number</p>
        </div>

        <form onSubmit={handleSearch} style={form}>
          <input
            style={input}
            value={rollNumber}
            onChange={e => setRollNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 12345"
            inputMode="numeric"
            maxLength={5}
            aria-label="Roll number"
          />
          <motion.button
            type="submit"
            style={btn}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? <span style={spinner} /> : 'Search'}
          </motion.button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div style={errBox} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert">
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div
              style={resultCard}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div style={resultHeader}>
                <span style={rollBadge}>#{result.rollNumber}</span>
                <span style={batchBadge(result.batchType)}>{result.batchType}</span>
              </div>
              <h3 style={resultName}>{result.name}</h3>
              <p style={resultClass}>Class: {result.class}</p>

              <div style={scoreRow}>
                <ScoreBox label="Score" value={String(result.score)} color="#8b5cf6" />
                {result.rank && <ScoreBox label="Rank" value={`#${result.rank}`} color="#f59e0b" />}
              </div>

              {result.remarks && <p style={remarks}>"{result.remarks}"</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ScoreBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
      <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
    </div>
  );
}

function batchBadge(b: string): React.CSSProperties {
  return {
    padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
    background: b === 'JUNIOR' ? 'rgba(6,182,212,0.15)' : 'rgba(168,85,247,0.15)',
    color: b === 'JUNIOR' ? '#06b6d4' : '#a78bfa',
  };
}

const wrap: React.CSSProperties = { padding: '20px', maxWidth: '480px', margin: '0 auto' };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px' };
const iconCircle: React.CSSProperties = { width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(108,59,255,0.15)', border: '1px solid rgba(108,59,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 14px' };
const title: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' };
const sub: React.CSSProperties = { color: '#64748b', fontSize: '0.9rem' };
const form: React.CSSProperties = { display: 'flex', gap: '10px', marginBottom: '16px' };
const input: React.CSSProperties = { flex: 1, padding: '13px 16px', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '1.1rem', color: '#f1f5f9', textAlign: 'center', letterSpacing: '4px' };
const btn: React.CSSProperties = { padding: '13px 22px', background: 'linear-gradient(135deg, #6c3bff, #8b5cf6)', color: 'white', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', border: 'none', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const spinner: React.CSSProperties = { width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' };
const errBox: React.CSSProperties = { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.88rem' };
const resultCard: React.CSSProperties = { background: 'rgba(108,59,255,0.08)', border: '1px solid rgba(108,59,255,0.2)', borderRadius: '16px', padding: '20px', marginTop: '16px' };
const resultHeader: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '12px' };
const rollBadge: React.CSSProperties = { background: 'rgba(108,59,255,0.2)', color: '#a78bfa', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 };
const resultName: React.CSSProperties = { fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' };
const resultClass: React.CSSProperties = { color: '#64748b', fontSize: '0.88rem', marginBottom: '16px' };
const scoreRow: React.CSSProperties = { display: 'flex', gap: '12px' };
const remarks: React.CSSProperties = { marginTop: '14px', color: '#64748b', fontSize: '0.88rem', fontStyle: 'italic', textAlign: 'center' };
