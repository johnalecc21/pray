import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

interface TrendingPillProps {
  tag?:     string;
  onPress?: () => void;
}

export default function TrendingPill({ tag = '#PrideBogota', onPress }: TrendingPillProps) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.secondary,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <Ionicons name="flame" size={13} color={colors.pride.orange} />
      <Text style={{ fontSize: 12, color: colors.mutedForeground, flex: 1 }}>
        {'Tendencia: '}
        <Text style={{ color: colors.foreground, fontWeight: '600' }}>{tag}</Text>
      </Text>
      <TouchableOpacity onPress={onPress} hitSlop={8}>
        <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}
