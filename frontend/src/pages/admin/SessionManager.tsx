import { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await adminApi.getSessions();
      setSessions(res.data.sessions);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleExpireAll = async () => {
    if (!confirm('Expire all other sessions?')) return;
    await adminApi.expireAllSessions();
    fetchSessions();
  };

  const handleExpire = async (id: string) => {
    await adminApi.expireSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const parseDevice = (ua: string) => {
    if (/iPhone|iPad/.test(ua)) return { type: 'iOS', icon: '📱' };
    if (/Android/.test(ua)) return { type: 'Android', icon: '📱' };
    if (/Mac/.test(ua)) return { type: 'Mac', icon: '💻' };
    if (/Windows/.test(ua)) return { type: 'Windows', icon: '🖥️' };
    if (/Linux/.test(ua)) return { type: 'Linux', icon: '🐧' };
    return { type: 'Unknown', icon: '🌐' };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#d2d2d7] border-t-[#0071e3] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1d1d1f]">Active Sessions</h2>
          <p className="text-sm text-[#86868b]">{sessions.length} active session(s)</p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={handleExpireAll}
            className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Expire All Others
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map(s => {
          const device = parseDevice(s.deviceInfo);
          return (
            <div key={s.id} className={`bg-white border rounded-xl p-4 ${s.isCurrent ? 'border-[#0071e3] ring-1 ring-[#0071e3]/20' : 'border-[#d2d2d7]'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{device.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#1d1d1f]">{device.type}</p>
                      {s.isCurrent && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">THIS DEVICE</span>
                      )}
                    </div>
                    <p className="text-xs text-[#86868b] mt-0.5 max-w-[300px] truncate">{s.deviceInfo}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[#86868b]">
                      <span>IP: {s.ipAddress || 'Unknown'}</span>
                      <span>Last active: {new Date(s.lastActiveAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                    </div>
                  </div>
                </div>
                {!s.isCurrent && (
                  <button
                    onClick={() => handleExpire(s.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Expire
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
