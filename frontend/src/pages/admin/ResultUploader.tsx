import React, { useState } from 'react';
import { adminApi } from '../../api/client';

export function ResultUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [publicationDate, setPublicationDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a CSV file'); return; }
    setUploading(true);
    setMessage('');
    setError('');
    setValidationErrors([]);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await adminApi.uploadResults(formData);
      setMessage(res.data.message);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; invalidRollNumbers?: string[] } } })?.response?.data;
      setError(data?.error || 'Upload failed');
      if (data?.invalidRollNumbers) setValidationErrors(data.invalidRollNumbers);
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setMessage('');
    setError('');
    try {
      await adminApi.publishResults(publicationDate || undefined);
      setMessage('Results published successfully');
    } catch {
      setError('Failed to publish results');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <h2 style={styles.heading}>Result Management</h2>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}
      {validationErrors.length > 0 && (
        <div style={styles.validationBox}>
          <strong>Invalid Roll Numbers:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            {validationErrors.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      )}

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Upload Results (CSV)</h3>
        <p style={styles.hint}>CSV format: <code>rollNumber,score,rank,remarks</code></p>
        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={styles.fileInput}
            aria-label="Select CSV file"
          />
          <button type="submit" style={styles.btn} disabled={uploading || !file}>
            {uploading ? 'Uploading...' : 'Upload Results'}
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Publish Results</h3>
        <p style={styles.hint}>Set a publication date or publish immediately.</p>
        <div style={styles.field}>
          <label style={styles.label}>Publication Date & Time (optional)</label>
          <input type="datetime-local" style={styles.input} value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)} />
        </div>
        <button style={{ ...styles.btn, background: '#16a34a' }} onClick={handlePublish} disabled={publishing}>
          {publishing ? 'Publishing...' : '🚀 Publish Results Now'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: '1.5rem', fontWeight: 700, color: '#1a237e', marginBottom: '24px' },
  success: { background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px' },
  validationBox: { background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '12px' },
  hint: { color: '#6b7280', fontSize: '0.85rem', marginBottom: '16px' },
  fileInput: { display: 'block', marginBottom: '12px', fontSize: '0.9rem' },
  btn: { padding: '10px 24px', background: '#1a237e', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: '#374151' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '0.95rem' },
};
