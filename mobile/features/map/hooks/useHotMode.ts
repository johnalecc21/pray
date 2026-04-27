import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../lib/api';

export function useHotMode(serverValue: boolean) {
  const [active,  setActive]  = useState(serverValue);
  const [pending, setPending] = useState(false);

  // Sync when serverValue changes (e.g. on first load)
  useEffect(() => { setActive(serverValue); }, [serverValue]);

  const toggle = useCallback(async () => {
    if (pending) return;
    const next = !active;
    setActive(next);
    setPending(true);
    try {
      await api.post<{ ok: boolean }>('/map/hot-mode', { active: next });
    } catch {
      setActive(!next); // revert on error
    } finally {
      setPending(false);
    }
  }, [active, pending]);

  return { active, toggle, pending };
}
