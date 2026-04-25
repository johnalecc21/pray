import { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { OnboardingState } from '../types';
import { TOTAL_STEPS } from '../types';
import { api } from '../../../lib/api';

const ONBOARDING_KEY = 'onboarding_complete';

export function useOnboarding() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>({
    identity:  ['Gay'],
    pronouns:  'él/him',
    interests: ['Gym', 'Música'],
    moods:     ['Dating'],
  });

  const toggleMulti = useCallback(
    (key: keyof Pick<OnboardingState, 'identity' | 'interests' | 'moods'>, value: string) => {
      setState((prev) => ({
        ...prev,
        [key]: prev[key].includes(value)
          ? prev[key].filter((x) => x !== value)
          : [...prev[key], value],
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

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const isLast = step === TOTAL_STEPS - 1;

  async function complete() {
    try {
      await api.post('/users/onboarding', state).catch(() => null); // best-effort
    } finally {
      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    }
  }

  return { step, state, toggleMulti, setSingle, next, back, isLast, complete };
}

export async function hasCompletedOnboarding() {
  const val = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return val === 'true';
}
