import { useEffect } from 'react';
import { AppState } from 'react-native';
import { api } from '../../../lib/api';

export function usePresence() {
  useEffect(() => {
    async function ping() {
      try { await api.patch<{ ok: boolean }>('/map/presence', {}); } catch { /* silent */ }
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
