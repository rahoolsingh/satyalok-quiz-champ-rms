import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/client';

interface Participant {
  id: string;
  rollNumber: string | null;
  name: string;
  class: string;
  batchType: string;
  guardianName: string;
  mobileNumber: string;
  email: string | null;
  paymentStatus: string;
  createdAt: string;
}

interface RegistrationResponse {
  participants: Participant[];
  total: number;
  page: number;
  limit: number;
  counts: { junior: number; senior: number };
}

const STATUS_COLORS: Record<string, React.CSSProperties> = {
  COMPLETED: { background: '#dcfce7', color: '#166534' },
  PENDING: { background: '#fef9c3', color: '#854d0e' },
  FAILED: { background: '#fef2f2', color: '#dc2626' },
};

export function RegistrationList() {
  const [data, setData] = useState<RegistrationResponse | null>(null);
  const [search, setSearch] = useState('');
  const [batch, setBatch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRegistrations({ search: search || undefined, batch: batch || undefined, page, limit: 20 });
      setData(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, batch, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div>
      <h2 style={styles.heading}>Registrations</h2>

      {data && (
        <div style={styles.counts}>
          <div style={styles.countCard}>
            <div style={styles.countNum}>{data.counts.junior}</div>
            <div style={styles.countLabel}>Junior</div>
          </div>
          <div style={styles.countCard}>
            <div style={styles.countNum}>{data.counts.senior}</div>
            <div style={styles.countLabel}>Senior</div>
          </div>
          <div style={{ ...styles.countCard, background: '#1a237e', color: 'white' }}>
            <div style={styles.countNum}>{data.counts.junior + data.counts.senior}</div>
            <div style={styles.countLabel}>Total</div>
          </div>
        </div>
      )}

      <div style={styles.filters}>
        <input
          style={styles.searchInput}
          placeholder="Search by name, roll number, or mobile..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          aria-label="Search participants"
        />
        <select style={styles.select} value={batch} onChange={(e) => { setBatch(e.target.value); setPage(1); }} aria-label="Filter by batch">
          <option value="">All Batches</option>
          <option value="JUNIOR">Junior</option>
          <option value="SENIOR">Senior</option>
        </select>
      </div>

      <div style={styles.tableWrapper}>
        {loading ? (
          <p style={{ padding: '20px', color: '#666' }}>Loading...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Roll #</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Batch</th>
                <th style={styles.th}>Mobile</th>
                <th style={styles.th}>Payment</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.participants.map((p) => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.td}>{p.rollNumber || '—'}</td>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>{p.class}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...(p.batchType === 'JUNIOR' ? styles.juniorBadge : styles.seniorBadge) }}>
                      {p.batchType}
                    </span>
                  </td>
                  <td style={styles.td}>{p.mobileNumber}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...(STATUS_COLORS[p.paymentStatus] || {}) }}>
                      {p.paymentStatus}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data?.participants.length === 0 && (
                <tr><td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>No registrations found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span style={{ color: '#374151' }}>Page {page} of {totalPages}</span>
          <button style={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: '1.5rem', fontWeight: 700, color: '#1a237e', marginBottom: '20px' },
  counts: { display: 'flex', gap: '16px', marginBottom: '20px' },
  countCard: { background: 'white', borderRadius: '10px', padding: '16px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center', minWidth: '100px' },
  countNum: { fontSize: '2rem', fontWeight: 800, color: '#1a237e' },
  countLabel: { fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' },
  filters: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem' },
  select: { padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem', background: 'white' },
  tableWrapper: { background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', fontSize: '0.9rem', color: '#374151' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
  juniorBadge: { background: '#dbeafe', color: '#1d4ed8' },
  seniorBadge: { background: '#f3e8ff', color: '#7c3aed' },
  pagination: { display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', marginTop: '20px' },
  pageBtn: { padding: '8px 16px', background: 'white', border: '1.5px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
};
