import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const USERNAME_RE = /^[a-z0-9_\-]{3,30}$/;

export function useUsernameCheck(username: string, currentUsername?: string | null): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>('idle');

  useEffect(() => {
    if (!username) {
      setStatus('idle');
      return;
    }

    const cleaned = username.trim().toLowerCase();

    if (!USERNAME_RE.test(cleaned)) {
      setStatus('invalid');
      return;
    }

    // Same as existing username — no need to check
    if (currentUsername && cleaned === currentUsername.toLowerCase()) {
      setStatus('available');
      return;
    }

    setStatus('checking');

    const timer = setTimeout(async () => {
      try {
        const { available } = await api.get<{ available: boolean }>(
          `/users/check-username/${cleaned}`,
        );
        setStatus(available ? 'available' : 'taken');
      } catch {
        setStatus('idle');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [username, currentUsername]);

  return status;
}
