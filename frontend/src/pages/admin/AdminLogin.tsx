import React, { useState } from 'react';
import { adminApi } from '../../api/client';

interface AdminLoginProps {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.login(username, password);
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUsername', res.data.username);
      onLogin();
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Quiz Champ 2026</h1>
        <p style={styles.sub}>Admin Dashboard</p>

        {error && <div style={styles.error} role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input style={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" aria-required="true" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" aria-required="true" />
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f8' },
  card: { background: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '380px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#1a237e', textAlign: 'center' },
  sub: { color: '#666', textAlign: 'center', marginBottom: '28px', marginTop: '4px' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: '#374151' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '0.95rem' },
  btn: { width: '100%', padding: '12px', background: '#1a237e', color: 'white', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '8px' },
};
