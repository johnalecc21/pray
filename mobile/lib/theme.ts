export const colors = {
  background: '#0d0b14',
  foreground: '#f7f7f7',
  card: '#141220',
  cardForeground: '#f7f7f7',
  popover: '#141220',
  popoverForeground: '#f7f7f7',
  primary: '#d946a8',
  primaryForeground: '#f7f7f7',
  secondary: '#1e1b2e',
  secondaryForeground: '#f7f7f7',
  muted: '#1e1b2e',
  mutedForeground: '#8886a4',
  accent: '#9333ea',
  accentForeground: '#f7f7f7',
  destructive: '#dc2626',
  destructiveForeground: '#f7f7f7',
  border: '#26243a',
  input: '#1e1b2e',
  ring: '#d946a8',
  sidebar: '#100e1a',

  pride: {
    red: '#f43f5e',
    orange: '#f97316',
    yellow: '#bef264',
    green: '#4ade80',
    blue: '#60a5fa',
    purple: '#a855f7',
    pink: '#d946a8',
  },
} as const;

export const radius = { sm: 12, md: 14, lg: 16, xl: 20 } as const;

/** Colores del gradiente pride en orden para LinearGradient */
export const prideGradient = [
  colors.pride.red,
  colors.pride.orange,
  colors.pride.yellow,
  colors.pride.green,
  colors.pride.blue,
  colors.pride.purple,
  colors.pride.pink,
] as const;

/** Gradiente corto (para textos y bordes) */
export const prideGradientShort = [
  colors.pride.red,
  colors.pride.orange,
  colors.pride.green,
  colors.pride.blue,
  colors.pride.pink,
] as const;

export type ThemeColors = typeof colors;
