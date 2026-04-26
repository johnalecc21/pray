import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { api } from '../../../lib/api';

type PermStatus = 'unknown' | 'granted' | 'denied';

export function useLocation() {
  const [status,  setStatus]  = useState<PermStatus>('unknown');
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);

  async function saveCurrentPosition() {
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await api.put('/users/profile', {
        latitude:  coords.latitude,
        longitude: coords.longitude,
      });
      setSaved(true);
    } catch {}
  }

  // On mount: if permission already granted, silently update coordinates
  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.getForegroundPermissionsAsync();
      if (perm === 'granted') {
        setStatus('granted');
        setSaved(true); // treat as already configured; still refresh in background
        saveCurrentPosition();
      } else if (perm === 'denied') {
        setStatus('denied');
      }
      // 'undetermined' stays as 'unknown' → banner shows
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestAndSave = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return false;
      }
      setStatus('granted');
      await saveCurrentPosition();
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, loading, saved, requestAndSave };
}
