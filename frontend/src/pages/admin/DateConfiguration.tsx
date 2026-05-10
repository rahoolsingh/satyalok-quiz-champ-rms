import React, { useState, useEffect } from 'react';
import { adminApi, portalApi } from '../../api/client';

export function DateConfiguration() {
  const [openingDate, setOpeningDate] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [manualStatus, setManualStatus] = useState('AUTO');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    portalApi.getStatus().then((res) => {
      const d = res.data;
      setOpeningDate(d.openingDate ? d.openingDate.slice(0, 16) : '');
      setClosingDate(d.closingDate ? d.closingDate.slice(0, 16) : '');
    }).catch(() => {});
  }, []);

  const handleSaveDates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await adminApi.updateDates(openingDate, closingDate);
      setMessage('Dates updated successfully');
    } catch {
      setError('Failed to update dates');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStatus = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await adminApi.updateStatus(manualStatus);
      setMessage('Portal status updated');
    } catch {
      setError('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={styles.heading}>Portal Date Configuration</h2>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Registration Dates</h3>
        <form onSubmit={handleSaveDates}>
          <div style={styles.field}>
            <label style={styles.label}>Opening Date & Time</label>
            <input type="datetime-local" style={styles.input} value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} aria-required="true" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Closing Date & Time</label>
            <input type="datetime-local" style={styles.input} value={closingDate} onChange={(e) => setClosingDate(e.target.value)} aria-required="true" />
          </div>
          <button type="submit" style={styles.btn} disabled={saving}>Save Dates</button>
        </form>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Manual Portal Status Override</h3>
        <p style={styles.hint}>Override the automatic date-based status. Use AUTO to let dates control the portal.</p>
        <div style={styles.statusRow}>
          {['AUTO', 'COUNTDOWN', 'OPEN', 'CLOSED'].map((s) => (
            <button
              key={s}
              style={{ ...styles.statusBtn, ...(manualStatus === s ? styles.statusBtnActive : {}) }}
              onClick={() => setManualStatus(s)}
              aria-pressed={manualStatus === s}
            >
              {s}
            </button>
          ))}
        </div>
        <button style={styles.btn} onClick={handleSaveStatus} disabled={saving}>Apply Status</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: '1.5rem', fontWeight: 700, color: '#1a237e', marginBottom: '24px' },
  success: { background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '16px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: '#374151' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '0.95rem' },
  btn: { padding: '10px 24px', background: '#1a237e', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' },
  hint: { color: '#6b7280', fontSize: '0.85rem', marginBottom: '16px' },
  statusRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' },
  statusBtn: { padding: '8px 20px', border: '2px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#374151' },
  statusBtnActive: { borderColor: '#1a237e', background: '#1a237e', color: 'white' },
};
