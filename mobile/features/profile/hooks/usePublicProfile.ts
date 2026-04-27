import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { PublicProfile } from '../types';

interface UsePublicProfileResult {
  profile:      PublicProfile | null;
  loading:      boolean;
  error:        string | null;
  liked:        boolean;
  isMatch:      boolean;
  toggleLike:   () => Promise<void>;
  dismissMatch: () => void;
}

export function usePublicProfile(userId: string | undefined): UsePublicProfileResult {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [liked,   setLiked]   = useState(false);
  const [isMatch, setIsMatch] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { profile: data } = await api.get<{ profile: PublicProfile }>(`/users/${userId}`);
        if (!cancelled) {
          setProfile(data);
          setLiked(data.is_liked_by_me);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar el perfil');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const toggleLike = useCallback(async () => {
    if (!userId) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    try {
      const result = await api.post<{ liked: boolean; matched: boolean }>(`/users/${userId}/like`, {});
      setLiked(result.liked);
      if (result.matched) setIsMatch(true);
    } catch {
      setLiked(wasLiked);
    }
  }, [userId, liked]);

  const dismissMatch = useCallback(() => setIsMatch(false), []);

  return { profile, loading, error, liked, isMatch, toggleLike, dismissMatch };
}
