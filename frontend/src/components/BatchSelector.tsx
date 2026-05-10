import React from 'react';
import { motion } from 'framer-motion';
import { BatchType } from '../types';

interface BatchSelectorProps {
  onSelect: (batch: BatchType) => void;
}

const batches: { type: BatchType; label: string; desc: string; classes: string; color: string; glow: string; icon: string }[] = [
  {
    type: 'JUNIOR',
    label: 'Junior Batch',
    desc: 'Classes 1 – 7',
    classes: 'Primary & Middle School',
    color: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))',
    glow: 'rgba(6,182,212,0.4)',
    icon: '🎓',
  },
  {
    type: 'SENIOR',
    label: 'Senior Batch',
    desc: 'Classes 8 – 12',
    classes: 'High School',
    color: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))',
    glow: 'rgba(168,85,247,0.4)',
    icon: '🏆',
  },
];

export function BatchSelector({ onSelect }: BatchSelectorProps) {
  return (
    <motion.div
      style={wrap}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.p style={eyebrow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        Step 1 of 3
      </motion.p>
      <motion.h2 style={heading} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        Choose Your Batch
      </motion.h2>
      <motion.p style={sub} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        Select the category that matches your class
      </motion.p>

      <div style={grid}>
        {batches.map((b, i) => (
          <motion.button
            key={b.type}
            style={{ ...card, background: b.color }}
            onClick={() => onSelect(b.type)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.1 }}
            whileHover={{ scale: 1.03, boxShadow: `0 20px 60px ${b.glow}` }}
            whileTap={{ scale: 0.98 }}
            aria-label={`Register for ${b.label}`}
          >
            <div style={iconWrap}>
              <span style={{ fontSize: '2.8rem' }}>{b.icon}</span>
            </div>
            <div style={cardBody}>
              <h3 style={cardTitle}>{b.label}</h3>
              <p style={cardDesc}>{b.desc}</p>
              <p style={cardSub}>{b.classes}</p>
            </div>
            <motion.div
              style={arrow}
              initial={{ x: 0 }}
              whileHover={{ x: 6 }}
            >
              →
            </motion.div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

const wrap: React.CSSProperties = { textAlign: 'center', padding: '40px 20px', maxWidth: '700px', margin: '0 auto' };
const eyebrow: React.CSSProperties = { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '3px', color: '#8b5cf6', fontWeight: 600, marginBottom: '12px' };
const heading: React.CSSProperties = { fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: '#f1f5f9', marginBottom: '10px' };
const sub: React.CSSProperties = { color: '#64748b', marginBottom: '40px', fontSize: '1rem' };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' };
const card: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
  padding: '36px 28px', borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.1)',
  cursor: 'pointer', transition: 'border-color 0.2s',
  textAlign: 'center',
};
const iconWrap: React.CSSProperties = {
  width: '72px', height: '72px', borderRadius: '50%',
  background: 'rgba(255,255,255,0.08)', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
};
const cardBody: React.CSSProperties = { flex: 1 };
const cardTitle: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' };
const cardDesc: React.CSSProperties = { fontSize: '1rem', color: '#94a3b8', marginBottom: '4px' };
const cardSub: React.CSSProperties = { fontSize: '0.8rem', color: '#475569' };
const arrow: React.CSSProperties = { fontSize: '1.3rem', color: '#8b5cf6' };
