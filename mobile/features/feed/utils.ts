import { colors } from '../../lib/theme';

const GRADIENTS: [string, string][] = [
  [colors.pride.pink,   colors.pride.purple],
  [colors.pride.purple, colors.pride.blue],
  [colors.pride.blue,   colors.pride.green],
  [colors.pride.green,  colors.pride.yellow],
  [colors.pride.orange, colors.pride.red],
  [colors.pride.red,    colors.pride.pink],
];

export function userGradient(userId: string): [string, string] {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

export function formatRelativeTime(dateStr: string): string {
  const diff    = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1)  return 'ahora';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7)     return `${days}d`;
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}
