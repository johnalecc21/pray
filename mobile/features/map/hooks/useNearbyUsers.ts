import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { NearbyUser, MapFilter } from '../types';

interface UseNearbyUsersResult {
  users:      NearbyUser[];
  myHotMode:  boolean;
  loading:    boolean;
  refetch:    () => Promise<void>;
}

export function useNearbyUsers(filter: MapFilter, hotModeOnly: boolean): UseNearbyUsersResult {
  const [users,     setUsers]     = useState<NearbyUser[]>([]);
  const [myHotMode, setMyHotMode] = useState(false);
  const [loading,   setLoading]   = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { users: data, my_hot_mode } = await api.get<{ users: NearbyUser[]; my_hot_mode: boolean }>(
        `/map/nearby?filter=${filter.toLowerCase()}&hot_mode=${hotModeOnly}`,
      );
      setUsers(data);
      setMyHotMode(my_hot_mode);
    } catch (err) {
      console.error('[map] nearby error:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filter, hotModeOnly]);

  useEffect(() => { refetch(); }, [refetch]);

  return { users, myHotMode, loading, refetch };
}
