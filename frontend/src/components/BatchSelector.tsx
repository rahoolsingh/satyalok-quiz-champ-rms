import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BatchType } from '../types';

const batches: { type: BatchType; label: string; sub: string; classes: string; icon: string }[] = [
  { type: 'JUNIOR', label: 'Junior Batch', sub: 'Classes 1 – 7', classes: 'Primary & Middle School', icon: '🎓' },
  { type: 'SENIOR', label: 'Senior Batch', sub: 'Classes 8 – 12', classes: 'High School', icon: '🏆' },
];

export function BatchSelector({ onSelect }: { onSelect: (b: BatchType) => void }) {
  const [hovered, setHovered] = useState<BatchType | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      style={{ width: '100%' }}
    >
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0071e3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Step 1 of 3</p>
      <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#1d1d1f', marginBottom: 6 }}>Choose your batch</h2>
      <p style={{ color: '#86868b', marginBottom: 32, fontSize: '1rem', lineHeight: 1.5 }}>Select the category that matches your class</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {batches.map((b) => (
          <motion.button
            key={b.type}
            onClick={() => onSelect(b.type)}
            onHoverStart={() => setHovered(b.type)}
            onHoverEnd={() => setHovered(null)}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '20px 24px', borderRadius: 12, cursor: 'pointer',
              background: 'transparent', textAlign: 'left',
              border: `${hovered === b.type ? 2 : 1}px solid ${hovered === b.type ? '#0071e3' : '#d2d2d7'}`,
              transition: 'border-color 0.15s, border-width 0.15s',
            }}
            aria-label={`Register for ${b.label}`}
          >
            <span style={{ fontSize: '2rem', flexShrink: 0 }}>{b.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '1rem', color: '#1d1d1f', marginBottom: 2 }}>{b.label}</p>
              <p style={{ fontSize: '0.88rem', color: '#86868b' }}>{b.sub}</p>
              <p style={{ fontSize: '0.78rem', color: '#86868b', marginTop: 2 }}>{b.classes}</p>
            </div>
            <span style={{ color: '#0071e3', fontSize: '1.1rem', flexShrink: 0 }}>→</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
