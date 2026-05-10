import React from 'react';
import { motion } from 'framer-motion';
import { AdmitCardData } from '../types';

interface AdmitCardProps {
  data: AdmitCardData;
  participantId?: string;
}

export function AdmitCard({ data, participantId }: AdmitCardProps) {
  const handleDownload = () => {
    if (participantId) window.open(`/api/registration/admit-card/${participantId}?format=html`, '_blank');
  };

  return (
    <motion.div
      style={wrap}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Success banner */}
      <motion.div
        style={successBanner}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span style={{ fontSize: '1.5rem' }}>🎉</span>
        <div>
          <p style={{ fontWeight: 700, color: '#f1f5f9' }}>Registration Successful!</p>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Your admit card has been generated</p>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        style={card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        id="admit-card"
      >
        {/* Header */}
        <div style={cardHeader}>
          <div style={headerGlow} />
          <h2 style={eventName}>{data.eventName}</h2>
          <p style={cardSubtitle}>Official Admit Card</p>
        </div>

        {/* Roll number */}
        <motion.div
          style={rollSection}
          animate={{ boxShadow: ['0 0 20px rgba(108,59,255,0.3)', '0 0 50px rgba(108,59,255,0.6)', '0 0 20px rgba(108,59,255,0.3)'] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <p style={rollLabel}>Roll Number</p>
          <p style={rollNumber} aria-label={`Roll number ${data.rollNumber}`}>
            {data.rollNumber.split('').map((d, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                style={{ display: 'inline-block' }}
              >
                {d}
              </motion.span>
            ))}
          </p>
        </motion.div>

        {/* Details grid */}
        <div style={detailsGrid}>
          {[
            { label: 'Name', value: data.name },
            { label: 'Class', value: data.class },
            { label: 'Batch', value: data.batchType },
            { label: 'Guardian', value: data.guardianName },
            { label: 'Mobile', value: data.mobileNumber },
            { label: 'Date', value: new Date(data.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
          ].map(({ label, value }, i) => (
            <motion.div
              key={label}
              style={detailItem}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
            >
              <span style={detailLabel}>{label}</span>
              <span style={detailValue}>{value}</span>
            </motion.div>
          ))}
        </div>

        <p style={note}>Bring this admit card on the day of the quiz. Roll number is required for entry.</p>
      </motion.div>

      {/* Actions */}
      <motion.div style={actions} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <motion.button style={printBtn} onClick={() => window.print()} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          🖨️ Print
        </motion.button>
        {participantId && (
          <motion.button style={downloadBtn} onClick={handleDownload} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            ⬇️ Download
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

const wrap: React.CSSProperties = { padding: '20px', maxWidth: '540px', margin: '0 auto' };
const successBanner: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px' };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(108,59,255,0.3)', borderRadius: '24px', overflow: 'hidden' };
const cardHeader: React.CSSProperties = { position: 'relative', textAlign: 'center', padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' };
const headerGlow: React.CSSProperties = { position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '100px', background: 'radial-gradient(circle, rgba(108,59,255,0.4) 0%, transparent 70%)', pointerEvents: 'none' };
const eventName: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', position: 'relative' };
const cardSubtitle: React.CSSProperties = { color: '#64748b', fontSize: '0.85rem', marginTop: '4px', position: 'relative' };
const rollSection: React.CSSProperties = { textAlign: 'center', background: 'linear-gradient(135deg, rgba(108,59,255,0.2), rgba(139,92,246,0.15))', padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' };
const rollLabel: React.CSSProperties = { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '3px', color: '#8b5cf6', marginBottom: '8px' };
const rollNumber: React.CSSProperties = { fontSize: '3rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: '10px', fontFamily: "'Space Grotesk', sans-serif" };
const detailsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', padding: '8px 0' };
const detailItem: React.CSSProperties = { padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' };
const detailLabel: React.CSSProperties = { display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: '3px' };
const detailValue: React.CSSProperties = { fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' };
const note: React.CSSProperties = { textAlign: 'center', color: '#334155', fontSize: '0.78rem', padding: '16px 24px', fontStyle: 'italic' };
const actions: React.CSSProperties = { display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' };
const printBtn: React.CSSProperties = { padding: '11px 28px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' };
const downloadBtn: React.CSSProperties = { padding: '11px 28px', background: 'linear-gradient(135deg, #6c3bff, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' };
