import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../../../lib/api';

export function usePresence() {
  useEffect(() => {
    async function ping() {
      try {
        const body: Record<string, unknown> = {};
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          body.latitude  = loc.coords.latitude;
          body.longitude = loc.coords.longitude;
        }
        await api.patch<{ ok: boolean }>('/map/presence', body);
      } catch { /* silent */ }
    }

    ping();
    const interval = setInterval(ping, 60_000);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') ping();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
}
