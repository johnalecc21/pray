import { useEffect, useCallback, useState } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import { useFeed } from '../../features/feed/hooks/useFeed';
import { postsApi } from '../../features/feed/postsApi';
import { colors } from '../../lib/theme';

import FeedHeader       from '../../components/feed/FeedHeader';
import FeedTabs         from '../../components/feed/FeedTabs';
import QuickAccessRow   from '../../components/feed/QuickAccessRow';
import StoriesRow       from '../../components/feed/StoriesRow';
import TrendingPill     from '../../components/feed/TrendingPill';
import PostCard         from '../../components/feed/PostCard';
import CreatePostModal  from '../../components/feed/CreatePostModal';
import CommentsModal    from '../../components/feed/CommentsModal';
import type { FeedTab, Trend, Post } from '../../features/feed/types';

function FeedListHeader({
  activeTab,
  onTabChange,
  topTrend,
}: {
  activeTab:    FeedTab;
  onTabChange:  (t: FeedTab) => void;
  topTrend?:    Trend;
}) {
  return (
    <>
      <FeedTabs activeTab={activeTab} onTabChange={onTabChange} />
      <QuickAccessRow />
      <StoriesRow />
      {topTrend && (
        <TrendingPill tag={`#${topTrend.name}`} />
      )}
    </>
  );
}

export default function FeedScreen() {
  const { user, loading: authLoading } = useAuth();
  const {
    activeTab, setActiveTab,
    posts, loading, refreshing,
    toggleLike, addPost, incrementCommentCount, refresh,
  } = useFeed();

  const [showCreate,     setShowCreate]     = useState(false);
  const [commentPostId,  setCommentPostId]  = useState<string | null>(null);
  const [topTrend,       setTopTrend]       = useState<Trend | undefined>();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    postsApi.getTrends()
      .then(({ trends }) => { if (trends[0]) setTopTrend(trends[0]); })
      .catch(() => {});
  }, []);

  const renderHeader = useCallback(
    () => (
      <FeedListHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        topTrend={topTrend}
      />
    ),
    [activeTab, setActiveTab, topTrend],
  );

  const handlePostCreated = useCallback((post: Post) => {
    addPost(post);
    setShowCreate(false);
  }, [addPost]);

  const handleCommentAdded = useCallback(() => {
    if (commentPostId) incrementCommentCount(commentPostId);
  }, [commentPostId, incrementCommentCount]);

  if (authLoading || !user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <FeedHeader />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.pride.pink} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListHeaderComponent={renderHeader}
          refreshing={refreshing}
          onRefresh={refresh}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={() => toggleLike(item.id)}
              onComment={() => setCommentPostId(item.id)}
            />
          )}
          extraData={activeTab}
        />
      )}

      {/* FAB — Nuevo post */}
      <TouchableOpacity
        accessibilityLabel="Crear post"
        activeOpacity={0.85}
        onPress={() => setShowCreate(true)}
        style={{
          position: 'absolute', bottom: 16, right: 16,
          width: 48, height: 48, borderRadius: 16,
          overflow: 'hidden',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
        }}
      >
        <LinearGradient
          colors={[colors.pride.pink, colors.pride.purple]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <CreatePostModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onPostCreated={handlePostCreated}
      />

      <CommentsModal
        visible={commentPostId !== null}
        postId={commentPostId}
        onClose={() => setCommentPostId(null)}
        onCommentAdded={handleCommentAdded}
      />
    </SafeAreaView>
  );
}
