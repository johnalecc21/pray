import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../lib/theme';
import type { MapFilter } from '../types';
import { MAP_FILTERS } from '../types';

interface Props {
  active:   MapFilter;
  onChange: (f: MapFilter) => void;
}

export function MapFilters({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {MAP_FILTERS.map(f => {
        const isActive = active === f;
        return (
          <TouchableOpacity
            key={f}
            onPress={() => onChange(f)}
            activeOpacity={0.75}
            style={styles.chip}
          >
            {isActive ? (
              <LinearGradient
                colors={[colors.pride.orange, colors.pride.pink]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.chipInner}
              >
                <Text style={styles.chipTextActive}>{f}</Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.chipInner, styles.chipTextInactive]}>{f}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row:             { paddingHorizontal: 20, gap: 8, paddingVertical: 2 },
  chip:            { borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  chipInner:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  chipTextActive:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  chipTextInactive:{ fontSize: 13, fontWeight: '600', color: colors.mutedForeground, backgroundColor: colors.secondary },
});
