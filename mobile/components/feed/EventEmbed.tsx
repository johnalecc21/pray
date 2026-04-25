import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import type { EventEmbed as EventEmbedType } from '../../features/feed/types';

interface EventEmbedProps {
  event:    EventEmbedType;
  onPress?: () => void;
}

export default function EventEmbed({ event, onPress }: EventEmbedProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: `${colors.pride.orange}14`,
        borderColor:     `${colors.pride.orange}40`,
      }}
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: `${colors.pride.orange}30`,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.pride.orange} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{event.when}</Text>
        <Text style={{ fontSize: 11, color: colors.pride.orange }}>
          {event.going.toLocaleString()} asistirán
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}
