import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { MatchUser } from '../types';

export function useMatches() {
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { matches: data } = await api.get<{ matches: MatchUser[] }>('/match/matches');
      console.log('[matches] loaded:', data.length, data);
      setMatches(data);
    } catch (err) {
      console.error('[matches] error:', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { matches, loading, refetch };
}
