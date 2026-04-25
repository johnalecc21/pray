export const colors = {
  light: {
    background: '#ffffff',
    foreground: '#171717',
    card: '#ffffff',
    cardForeground: '#171717',
    primary: '#1c1c1c',
    primaryForeground: '#fafafa',
    secondary: '#f5f5f5',
    secondaryForeground: '#1c1c1c',
    muted: '#f5f5f5',
    mutedForeground: '#737373',
    accent: '#f5f5f5',
    accentForeground: '#1c1c1c',
    destructive: '#dc2626',
    destructiveForeground: '#dc2626',
    border: '#e5e5e5',
    input: '#e5e5e5',
    ring: '#a3a3a3',
  },
  dark: {
    background: '#171717',
    foreground: '#fafafa',
    card: '#171717',
    cardForeground: '#fafafa',
    primary: '#fafafa',
    primaryForeground: '#1c1c1c',
    secondary: '#404040',
    secondaryForeground: '#fafafa',
    muted: '#404040',
    mutedForeground: '#a3a3a3',
    accent: '#404040',
    accentForeground: '#fafafa',
    destructive: '#7f1d1d',
    destructiveForeground: '#ef4444',
    border: '#404040',
    input: '#404040',
    ring: '#6b6b6b',
  },
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof colors.light;
