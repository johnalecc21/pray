import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import type { MatchCandidate } from '../types';
import type { PublicProfile } from '../../profile/types';

interface UseMatchCandidatesResult {
  candidates:   MatchCandidate[];
  loading:      boolean;
  currentIndex: number;
  matchedUser:  MatchCandidate | null;
  isEmpty:      boolean;
  swipeLike:    (candidate: MatchCandidate) => Promise<void>;
  swipePass:    (candidate: MatchCandidate) => Promise<void>;
  dismissMatch: () => void;
  refetch:      () => Promise<void>;
}

function profileToCandidate(p: PublicProfile): MatchCandidate {
  return {
    id:               p.id,
    name:             p.name,
    username:         p.username,
    avatar_url:       p.avatar_url,
    age:              p.age,
    bio:              p.bio,
    location:         p.location,
    pronouns:         p.pronouns,
    identity:         p.identity ?? [],
    interests:        p.interests ?? [],
    moods:            p.moods ?? [],
    photos:           p.photos ?? [],
    match_score:      p.match_score,
    match_factors:    p.match_factors ?? [],
    distance_km:      p.distance_km,
    common_interests: p.common_interests ?? [],
    common_moods:     p.common_moods ?? [],
  };
}

export function useMatchCandidates(): UseMatchCandidatesResult {
  const { user } = useAuth();
  const [candidates,   setCandidates]   = useState<MatchCandidate[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedUser,  setMatchedUser]  = useState<MatchCandidate | null>(null);
  const swipingRef    = useRef(false);
  const shownMatchIds = useRef(new Set<string>());

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { candidates: data } = await api.get<{ candidates: MatchCandidate[] }>('/match/candidates');
      console.log('[candidates] loaded:', data.length);
      setCandidates(data);
      setCurrentIndex(0);
    } catch (err) {
      console.error('[candidates] error:', err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  // Realtime: when someone likes the current user, check for mutual match
  useEffect(() => {
    if (!user?.id) return;

    const channelName = `incoming-likes-${user.id}`;
    console.log('[realtime] subscribing | my id:', user.id);

    // Remove any stale channel with this name (React Strict Mode runs effects twice)
    supabase.getChannels().forEach(ch => {
      if (ch.topic === `realtime:${channelName}`) supabase.removeChannel(ch);
    });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'user_likes',
          filter: `liked_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('[realtime] INSERT received:', JSON.stringify(payload.new));
          const likerId = (payload.new as any).liker_id as string;
          if (shownMatchIds.current.has(likerId)) return;
          try {
            const { profile } = await api.get<{ profile: PublicProfile }>(`/users/${likerId}`);
            console.log('[realtime] is_liked_by_me:', profile.is_liked_by_me);
            if (profile.is_liked_by_me) {
              shownMatchIds.current.add(likerId);
              setMatchedUser(profileToCandidate(profile));
            }
          } catch (err) {
            console.error('[realtime] match check error:', err);
          }
        },
      )
      .subscribe((status, err) => {
        console.log('[realtime] channel status:', status, err ?? '');
      });

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const swipeLike = useCallback(async (candidate: MatchCandidate) => {
    if (swipingRef.current) return;
    swipingRef.current = true;
    setCurrentIndex(i => i + 1);
    try {
      const result = await api.post<{ liked: boolean; matched: boolean }>(
        `/match/like/${candidate.id}`, {},
      );
      console.log('[swipeLike] result:', result);
      if (result.matched) {
        shownMatchIds.current.add(candidate.id);
        setMatchedUser(candidate);
      }
    } catch (err) {
      console.error('[swipeLike] error:', err);
    } finally {
      swipingRef.current = false;
    }
  }, []);

  const swipePass = useCallback(async (candidate: MatchCandidate) => {
    if (swipingRef.current) return;
    swipingRef.current = true;
    setCurrentIndex(i => i + 1);
    try {
      await api.post(`/match/pass/${candidate.id}`, {});
    } catch {
      // silent
    } finally {
      swipingRef.current = false;
    }
  }, []);

  const dismissMatch = useCallback(() => {
    setMatchedUser(prev => {
      if (prev?.id) shownMatchIds.current.delete(prev.id);
      return null;
    });
  }, []);

  return {
    candidates,
    loading,
    currentIndex,
    matchedUser,
    isEmpty: !loading && currentIndex >= candidates.length,
    swipeLike,
    swipePass,
    dismissMatch,
    refetch,
  };
}
