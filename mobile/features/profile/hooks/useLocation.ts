import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { api } from '../../../lib/api';

type PermStatus = 'unknown' | 'granted' | 'denied';

export function useLocation() {
  const [status,  setStatus]  = useState<PermStatus>('unknown');
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);

  const saveCurrentPosition = useCallback(async (): Promise<boolean> => {
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await api.put('/users/profile', {
        latitude:  coords.latitude,
        longitude: coords.longitude,
      });
      setSaved(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  // On mount: check existing permission without requesting
  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.getForegroundPermissionsAsync();
      if (perm === 'granted') {
        setStatus('granted');
        // saved stays false until saveCurrentPosition succeeds
        saveCurrentPosition();
      } else if (perm === 'denied') {
        setStatus('denied');
      }
      // 'undetermined' → status stays 'unknown' → banner shows
    })();
  }, [saveCurrentPosition]);

  const requestAndSave = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      // If already granted, skip the dialog and just save
      if (status === 'granted') {
        return await saveCurrentPosition();
      }
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return false;
      }
      setStatus('granted');
      return await saveCurrentPosition();
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [status, saveCurrentPosition]);

  return { status, loading, saved, requestAndSave };
}
