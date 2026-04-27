import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { MapStats } from '../types';

export function useMapStats() {
  const [stats,   setStats]   = useState<MapStats>({ online_count: 0, views_today: 0, hot_matches: 0 });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await api.get<MapStats>('/map/stats');
      setStats(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { stats, loading, refetch };
}
