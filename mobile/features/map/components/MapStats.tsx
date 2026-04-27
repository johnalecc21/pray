import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../lib/theme';
import type { MapStats } from '../types';

interface Props {
  stats: MapStats;
}

const STAT_CONFIG = [
  { key: 'online_count', label: 'Online ahora', color: colors.pride.green  },
  { key: 'views_today',  label: 'Te vieron hoy', color: colors.pride.yellow },
  { key: 'hot_matches',  label: 'Matches hot',   color: colors.pride.pink   },
] as const;

export function MapStats({ stats }: Props) {
  return (
    <View style={styles.row}>
      {STAT_CONFIG.map(({ key, label, color }) => (
        <View key={key} style={styles.card}>
          <Text style={[styles.value, { color }]}>{stats[key]}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  card:  { flex: 1, borderRadius: 18, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  value: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  label: { fontSize: 11, color: colors.mutedForeground, lineHeight: 14 },
});
