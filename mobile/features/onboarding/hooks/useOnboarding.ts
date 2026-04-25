import { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../lib/supabase';
import { uploadAvatar } from '../../../lib/storage';
import { api } from '../../../lib/api';
import type { OnboardingState } from '../types';
import { TOTAL_STEPS } from '../types';

const ONBOARDING_KEY = 'onboarding_complete';

export function useOnboarding() {
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    identity:  ['Gay'],
    pronouns:  'él/him',
    interests: ['Gym', 'Música'],
    moods:     ['Dating'],
    avatarUri: null,
    avatarUrl: null,
  });

  const toggleMulti = useCallback(
    (key: keyof Pick<OnboardingState, 'identity' | 'interests' | 'moods'>, value: string) => {
      setState((prev) => ({
        ...prev,
        [key]: prev[key].includes(value)
          ? (prev[key] as string[]).filter((x) => x !== value)
          : [...(prev[key] as string[]), value],
      }));
    },
    [],
  );

  const setSingle = useCallback(
    (key: keyof Pick<OnboardingState, 'pronouns'>, value: string) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setAvatarUri = useCallback((uri: string) => {
    setState((prev) => ({ ...prev, avatarUri: uri, avatarUrl: null }));
  }, []);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)), []);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const isLast = step === TOTAL_STEPS - 1;

  async function complete() {
    setUploading(true);
    try {
      let avatarUrl = state.avatarUrl;

      if (state.avatarUri && !avatarUrl) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (userId) {
          avatarUrl = await uploadAvatar(userId, state.avatarUri);
          setState((prev) => ({ ...prev, avatarUrl }));
        }
      }

      await api.post('/users/onboarding', {
        identity:   state.identity,
        pronouns:   state.pronouns,
        interests:  state.interests,
        moods:      state.moods,
        avatar_url: avatarUrl,
      }).catch(() => null);

      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    } finally {
      setUploading(false);
    }
  }

  return { step, state, uploading, toggleMulti, setSingle, setAvatarUri, next, back, isLast, complete };
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return val === 'true';
}
