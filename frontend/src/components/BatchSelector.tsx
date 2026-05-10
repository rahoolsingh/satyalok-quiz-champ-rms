import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BatchType } from '../types';

const batches = [
  { type: 'JUNIOR' as BatchType, label: 'Junior Batch', sub: 'Classes 1 – 7', classes: 'Primary & Middle School', icon: '🎓' },
  { type: 'SENIOR' as BatchType, label: 'Senior Batch', sub: 'Classes 8 – 12', classes: 'High School', icon: '🏆' },
];

export function BatchSelector({ onSelect }: { onSelect: (b: BatchType) => void }) {
  const [hovered, setHovered] = useState<BatchType | null>(null);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
    >
      <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-2.5">Step 1 of 3</p>
      <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[#1d1d1f] mb-1.5">Choose your batch</h2>
      <p className="text-[#86868b] mb-8 text-base leading-relaxed">Select the category that matches your class</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {batches.map((b) => (
          <motion.button
            key={b.type}
            onClick={() => onSelect(b.type)}
            onHoverStart={() => setHovered(b.type)}
            onHoverEnd={() => setHovered(null)}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-4 p-5 rounded-xl text-left bg-transparent transition-all cursor-pointer
              ${hovered === b.type ? 'border-2 border-[#0071e3]' : 'border border-[#d2d2d7]'}`}
            aria-label={`Register for ${b.label}`}
          >
            <span className="text-4xl shrink-0">{b.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base text-[#1d1d1f] mb-0.5">{b.label}</p>
              <p className="text-sm text-[#86868b]">{b.sub}</p>
              <p className="text-xs text-[#86868b] mt-0.5">{b.classes}</p>
            </div>
            <span className="text-[#0071e3] text-lg shrink-0">→</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
