import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../lib/api';
import type { MatchCandidate } from '../types';

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

export function useMatchCandidates(): UseMatchCandidatesResult {
  const [candidates,   setCandidates]   = useState<MatchCandidate[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedUser,  setMatchedUser]  = useState<MatchCandidate | null>(null);
  const swipingRef = useRef(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { candidates: data } = await api.get<{ candidates: MatchCandidate[] }>('/match/candidates');
      setCandidates(data);
      setCurrentIndex(0);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const swipeLike = useCallback(async (candidate: MatchCandidate) => {
    if (swipingRef.current) return;
    swipingRef.current = true;
    setCurrentIndex(i => i + 1);
    try {
      const result = await api.post<{ liked: boolean; matched: boolean }>(
        `/users/${candidate.id}/like`, {},
      );
      if (result.matched) setMatchedUser(candidate);
    } catch {
      // silent — swipe already happened visually
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

  const dismissMatch = useCallback(() => setMatchedUser(null), []);

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
