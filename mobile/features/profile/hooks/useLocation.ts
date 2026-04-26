import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { api } from '../../../lib/api';

type PermStatus = 'unknown' | 'granted' | 'denied';
type SaveState  = 'idle' | 'saving' | 'saved' | 'error';

export function useLocation() {
  const [status,    setStatus]    = useState<PermStatus>('unknown');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const saveCurrentPosition = useCallback(async (): Promise<boolean> => {
    setSaveState('saving');
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await api.put('/users/profile', {
        latitude:  coords.latitude,
        longitude: coords.longitude,
      });
      setSaveState('saved');
      return true;
    } catch {
      setSaveState('error');
      return false;
    }
  }, []);

  // On mount: check existing permission without requesting
  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.getForegroundPermissionsAsync();
      if (perm === 'granted') {
        setStatus('granted');
        saveCurrentPosition();
      } else if (perm === 'denied') {
        setStatus('denied');
      }
      // 'undetermined' → status stays 'unknown' → banner shows
    })();
  }, [saveCurrentPosition]);

  const requestAndSave = useCallback(async (): Promise<boolean> => {
    setSaveState('saving');
    try {
      if (status === 'granted') {
        return await saveCurrentPosition();
      }
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        setSaveState('idle');
        return false;
      }
      setStatus('granted');
      return await saveCurrentPosition();
    } catch {
      setSaveState('error');
      return false;
    }
  }, [status, saveCurrentPosition]);

  return {
    status,
    saveState,
    loading: saveState === 'saving',
    saved:   saveState === 'saved',
    requestAndSave,
  };
}
