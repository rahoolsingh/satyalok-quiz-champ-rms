import { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Active Sessions</h2>
          <p className="text-sm text-muted-foreground">{sessions.length} active session(s)</p>
        </div>
        {sessions.length > 1 && (
          <Button variant="destructive" size="sm" onClick={handleExpireAll}>
            Expire All Others
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map(s => {
          const device = parseDevice(s.deviceInfo);
          return (
            <Card key={s.id} className={s.isCurrent ? 'ring-1 ring-primary/30' : ''}>
              <CardContent className="flex items-start justify-between pt-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{device.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{device.type}</p>
                      {s.isCurrent && <Badge variant="default">THIS DEVICE</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[300px] truncate">{s.deviceInfo}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>IP: {s.ipAddress || 'Unknown'}</span>
                      <span>Last active: {new Date(s.lastActiveAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                    </div>
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button variant="destructive" size="xs" onClick={() => handleExpire(s.id)}>
                    Expire
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
