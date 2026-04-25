import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import type { CommunityEmbed as CommunityEmbedType } from '../../features/feed/types';

interface CommunityEmbedProps {
  community: CommunityEmbedType;
  onPress?:  () => void;
}

export default function CommunityEmbed({ community, onPress }: CommunityEmbedProps) {
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
        backgroundColor: `${colors.pride.green}14`,
        borderColor:     `${colors.pride.green}40`,
      }}
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: `${colors.pride.green}30`,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name="people-outline" size={18} color={colors.pride.green} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>
          {community.name}
        </Text>
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
          {community.members.toLocaleString()} miembros
        </Text>
        <Text style={{ fontSize: 11, color: colors.pride.green }}>{community.tag}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}
