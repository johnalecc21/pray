import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import type { Trend } from '../../features/feed/types';

interface TrendingPillProps {
  trends:   Trend[];
  onPress?: (trend: Trend) => void;
}

export default function TrendingPill({ trends, onPress }: TrendingPillProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      {/* Encabezado */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, marginBottom: 8,
      }}>
        <Ionicons name="flame" size={13} color={colors.pride.orange} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.mutedForeground, letterSpacing: 0.5 }}>
          TENDENCIAS
        </Text>
      </View>

      {trends.length === 0 ? (
        /* Estado vacío */
        <View style={{
          marginHorizontal: 16,
          backgroundColor: colors.secondary,
          borderRadius: 12,
          paddingHorizontal: 16, paddingVertical: 10,
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          <Ionicons name="flame-outline" size={14} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, color: colors.mutedForeground, flex: 1 }}>
            Crea el primer trending con{' '}
            <Text style={{ color: colors.pride.pink, fontWeight: '600' }}>#hashtag</Text>
          </Text>
        </View>
      ) : (
        /* Pills horizontales */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {trends.map((trend) => (
            <TouchableOpacity
              key={trend.id}
              onPress={() => onPress?.(trend)}
              activeOpacity={0.75}
              style={{
                backgroundColor: `${colors.pride.pink}18`,
                borderRadius: 999,
                paddingHorizontal: 12, paddingVertical: 6,
                borderWidth: 1,
                borderColor: `${colors.pride.pink}35`,
                flexDirection: 'row', alignItems: 'center', gap: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.pride.pink, fontWeight: '700' }}>
                #{trend.name}
              </Text>
              {trend.posts_count > 0 && (
                <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                  {trend.posts_count}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
