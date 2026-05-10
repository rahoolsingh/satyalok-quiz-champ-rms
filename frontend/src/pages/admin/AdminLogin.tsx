import React, { useState } from 'react';
import { adminApi } from '../../api/client';

export function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await adminApi.login(username, password);
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUsername', res.data.username);
      onLogin();
    } catch { setError('Invalid username or password'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fbfbfd] p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mb-1">Quiz Champ 2026</h1>
        <p className="text-[#86868b] text-sm mb-8">Admin Dashboard</p>

        {error && <p className="text-[#ef4444] text-sm mb-4 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin"
              className="w-full px-3.5 py-2.5 bg-white border border-[#d2d2d7] rounded-lg text-sm focus:border-[#0071e3] focus:shadow-[0_0_0_3px_rgba(0,113,227,0.2)] outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-[#d2d2d7] rounded-lg text-sm focus:border-[#0071e3] focus:shadow-[0_0_0_3px_rgba(0,113,227,0.2)] outline-none transition-all" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-[#0071e3] text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
