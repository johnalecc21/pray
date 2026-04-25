export interface OnboardingState {
  identity: string[];
  pronouns: string;
  interests: string[];
  moods: string[];
}

export interface IdentityOption {
  label: string;
  color: string;
}

export interface InterestOption {
  label: string;
  icon: string; // Ionicons name
  color: string;
}

export interface MoodOption {
  label: string;
  desc: string;
  color: string;
}

export const TOTAL_STEPS = 5;
export const STEP_LABELS = ['Bienvenida', 'Identidad', 'Intereses', 'Mood', 'Listo'] as const;
