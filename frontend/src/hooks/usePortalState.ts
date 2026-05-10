import { useState, useEffect, useCallback } from 'react';
import { PortalStatus } from '../types';
import { portalApi } from '../api/client';

export function usePortalState(refreshInterval = 30000) {
  const [status, setStatus] = useState<PortalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await portalApi.getStatus();
      setStatus(res.data);
      setError(null);
    } catch {
      setError('Failed to load portal status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, refreshInterval]);

  return { status, loading, error, refetch: fetchStatus };
}
