import React from 'react';
import { motion } from 'framer-motion';
import { AdmitCardData } from '../types';

export function AdmitCard({ data, participantId }: { data: AdmitCardData; participantId?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%' }}>
      {/* Success message */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <span style={{ fontSize: '1.4rem' }}>✅</span>
        <div>
          <p style={{ fontWeight: 600, color: '#1d1d1f', fontSize: '1rem' }}>Registration successful</p>
          <p style={{ color: '#86868b', fontSize: '0.88rem' }}>Your admit card is ready</p>
        </div>
      </div>

      {/* Admit card */}
      <div id="admit-card" style={{ border: '1px solid #d2d2d7', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header strip */}
        <div style={{ background: '#0071e3', padding: '20px 24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Official Admit Card</p>
          <h2 style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{data.eventName}</h2>
        </div>

        {/* Roll number */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #d2d2d7', textAlign: 'center' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#86868b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Roll Number</p>
          <motion.p
            style={{ fontSize: '2.8rem', fontWeight: 700, letterSpacing: '0.15em', color: '#1d1d1f' }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {data.rollNumber}
          </motion.p>
        </div>

        {/* Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {[
            { label: 'Name', value: data.name },
            { label: 'Class', value: data.class },
            { label: 'Batch', value: data.batchType },
            { label: 'Guardian', value: data.guardianName },
            { label: 'Mobile', value: data.mobileNumber },
            { label: 'Date', value: new Date(data.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
          ].map(({ label, value }, i) => (
            <div key={label} style={{ padding: '14px 24px', borderBottom: i < 4 ? '1px solid #f5f5f7' : 'none', borderRight: i % 2 === 0 ? '1px solid #f5f5f7' : 'none' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 500, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1d1d1f' }}>{value}</p>
            </div>
          ))}
        </div>

        <p style={{ padding: '12px 24px', color: '#86868b', fontSize: '0.78rem', textAlign: 'center', borderTop: '1px solid #f5f5f7' }}>
          Bring this admit card on the day of the quiz. Roll number is required for entry.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button onClick={() => window.print()} style={{ flex: 1, padding: '11px 20px', background: 'transparent', color: '#0066cc', border: '1px solid #d2d2d7', borderRadius: 20, fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem' }}>
          Print
        </button>
        {participantId && (
          <button onClick={() => window.open(`/api/registration/admit-card/${participantId}?format=html`, '_blank')} style={{ flex: 1, padding: '11px 20px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
            Download
          </button>
        )}
      </div>
    </motion.div>
  );
}
