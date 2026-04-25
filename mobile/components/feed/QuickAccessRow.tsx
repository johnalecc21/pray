import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { quickAccess } from '../../features/feed/data';
import { colors } from '../../lib/theme';

interface QuickAccessRowProps {
  onPress?: (id: string) => void;
}

export default function QuickAccessRow({ onPress }: QuickAccessRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
      }}
    >
      {quickAccess.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => onPress?.(item.id)}
          style={{ flex: 1, alignItems: 'center', gap: 6 }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 48, height: 48, borderRadius: 16,
              backgroundColor: item.bgColor,
              borderWidth: 1,
              borderColor: `${item.color}33`,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name={item.iconName as any} size={20} color={item.color} />
          </View>
          <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: '500' }}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
