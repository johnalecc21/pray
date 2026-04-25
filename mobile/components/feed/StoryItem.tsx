import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../lib/theme';
import type { Story } from '../../features/feed/types';

interface StoryItemProps {
  story: Story;
  onPress?: () => void;
}

export default function StoryItem({ story, onPress }: StoryItemProps) {
  if (story.isMe) {
    return (
      <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', gap: 4 }} activeOpacity={0.7}>
        <View
          style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: colors.secondary,
            borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 22, color: colors.mutedForeground }}>+</Text>
        </View>
        <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: '500', maxWidth: 52 }} numberOfLines={1}>
          {story.name}
        </Text>
      </TouchableOpacity>
    );
  }

  const ringColor = story.color ?? colors.pride.pink;

  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', gap: 4 }} activeOpacity={0.7}>
      <LinearGradient
        colors={[ringColor, colors.pride.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 56, height: 56, borderRadius: 16, padding: 2 }}
      >
        <View
          style={{
            flex: 1, borderRadius: 14,
            backgroundColor: `${ringColor}40`,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
            {story.name[0].toUpperCase()}
          </Text>
        </View>
      </LinearGradient>
      <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: '500', maxWidth: 52 }} numberOfLines={1}>
        {story.name}
      </Text>
    </TouchableOpacity>
  );
}
