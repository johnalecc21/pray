export interface OnboardingState {
  identity:  string[];
  pronouns:  string;
  interests: string[];
  moods:     string[];
  avatarUri: string | null;   // local URI before upload
  avatarUrl: string | null;   // remote URL after upload
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
  desc:  string;
  color: string;
  icon?: string; // Ionicons name
}

export const TOTAL_STEPS = 5;
export const STEP_LABELS = ['Bienvenida', 'Identidad', 'Intereses', 'Mood', 'Listo'] as const;
