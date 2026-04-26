import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import { userGradient, formatRelativeTime } from '../../features/feed/utils';
import PostActions from './PostActions';
import type { Post } from '../../features/feed/types';

interface PostCardProps {
  post:           Post;
  onLike:         () => void;
  onComment?:     () => void;
  onShare?:       () => void;
  isOwn?:         boolean;
  onDelete?:      () => void;
  onAuthorPress?: () => void;
}

function HashtagText({ content }: { content: string }) {
  const parts = content.split(/(#[\wÀ-ž]+)/g);
  return (
    <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <Text key={i} style={{ color: colors.pride.pink, fontWeight: '600' }}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

export default function PostCard({ post, onLike, onComment, onShare, isOwn, onDelete, onAuthorPress }: PostCardProps) {
  const name     = post.author?.name ?? post.author?.username ?? 'Usuario';
  const handle   = post.author?.username
    ? `@${post.author.username}`
    : `@${name.toLowerCase().replace(/[^a-z0-9]/gi, '')}`;
  const time     = formatRelativeTime(post.created_at);
  const gradient = userGradient(post.user_id);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: 16,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity
          onPress={onAuthorPress}
          activeOpacity={onAuthorPress ? 0.7 : 1}
          disabled={!onAuthorPress}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
        >
          {post.author?.avatar_url ? (
            <Image
              source={{ uri: post.author.avatar_url }}
              style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }}
            />
          ) : (
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 40, height: 40, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                {name[0].toUpperCase()}
              </Text>
            </LinearGradient>
          )}

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
              {name}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
              {handle} · {time}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {post.mood && (
            <View
              style={{
                backgroundColor: `${post.mood_color ?? colors.pride.purple}22`,
                borderRadius: 999,
                paddingHorizontal: 8, paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: post.mood_color ?? colors.pride.purple }}>
                {post.mood}
              </Text>
            </View>
          )}
          {isOwn && onDelete && (
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Eliminar post', '¿Quieres eliminar esta publicación?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: onDelete },
                ])
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenido */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <HashtagText content={post.content} />
      </View>

      {/* Imagen */}
      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={{ width: '100%', height: 200 }}
          resizeMode="cover"
        />
      )}

      {/* Acciones */}
      <PostActions
        likes={post.likes_count}
        comments={post.comments_count}
        isLiked={post.is_liked_by_me}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
      />
    </View>
  );
}
