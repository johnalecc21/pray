import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

interface PostActionsProps {
  likes:      number;
  comments:   number;
  isLiked:    boolean;
  onLike:     () => void;
  onComment?: () => void;
  onShare?:   () => void;
}

export default function PostActions({
  likes, comments, isLiked,
  onLike, onComment, onShare,
}: PostActionsProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity
          onPress={onLike}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          hitSlop={8}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? colors.pride.pink : colors.mutedForeground}
          />
          <Text style={{ fontSize: 12, color: isLiked ? colors.pride.pink : colors.mutedForeground }}>
            {likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onComment}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          hitSlop={8}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onShare} hitSlop={8}>
          <Ionicons name="share-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
