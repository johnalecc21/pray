import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../lib/theme';
import EventEmbed from './EventEmbed';
import CommunityEmbed from './CommunityEmbed';
import PostActions from './PostActions';
import type { FeedPost } from '../../features/feed/types';

interface PostCardProps {
  post:              FeedPost;
  isLiked:           boolean;
  isSaved:           boolean;
  onLike:            () => void;
  onSave:            () => void;
  onEventPress?:     () => void;
  onCommunityPress?: () => void;
  onLivePress?:      () => void;
}

export default function PostCard({
  post, isLiked, isSaved,
  onLike, onSave, onEventPress, onCommunityPress, onLivePress,
}: PostCardProps) {
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <LinearGradient
            colors={post.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 40, height: 40, borderRadius: 12,
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
              {post.user[0].toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
              {post.user}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
              {post.handle} · {post.time}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {post.isLive && (
            <TouchableOpacity
              onPress={onLivePress}
              style={{
                backgroundColor: `${colors.pride.orange}30`,
                borderRadius: 999,
                paddingHorizontal: 8, paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.pride.orange }}>
                LIVE
              </Text>
            </TouchableOpacity>
          )}
          <View
            style={{
              backgroundColor: `${post.moodColor}22`,
              borderRadius: 999,
              paddingHorizontal: 8, paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: post.moodColor }}>
              {post.mood}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <Text
        style={{
          fontSize: 14,
          color: colors.foreground,
          lineHeight: 20,
          paddingHorizontal: 16,
          paddingBottom: 12,
        }}
      >
        {post.content}
      </Text>

      {/* Embeds */}
      {post.eventCard && (
        <EventEmbed event={post.eventCard} onPress={onEventPress} />
      )}
      {post.communityCard && (
        <CommunityEmbed community={post.communityCard} onPress={onCommunityPress} />
      )}

      {/* Actions */}
      <PostActions
        likes={post.likes}
        comments={post.comments}
        isLiked={isLiked}
        isSaved={isSaved}
        onLike={onLike}
        onSave={onSave}
      />
    </View>
  );
}
