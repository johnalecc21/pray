import { useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import { useFeed } from '../../features/feed/hooks/useFeed';
import { feedPosts } from '../../features/feed/data';
import { colors } from '../../lib/theme';

import FeedHeader     from '../../components/feed/FeedHeader';
import FeedTabs       from '../../components/feed/FeedTabs';
import QuickAccessRow from '../../components/feed/QuickAccessRow';
import StoriesRow     from '../../components/feed/StoriesRow';
import TrendingPill   from '../../components/feed/TrendingPill';
import PostCard       from '../../components/feed/PostCard';
import type { FeedTab } from '../../features/feed/types';

function FeedListHeader({ activeTab, onTabChange }: { activeTab: FeedTab; onTabChange: (t: FeedTab) => void }) {
  return (
    <>
      <FeedTabs activeTab={activeTab} onTabChange={onTabChange} />
      <QuickAccessRow />
      <StoriesRow />
      <TrendingPill />
    </>
  );
}

export default function FeedScreen() {
  const { user, loading } = useAuth();
  const { activeTab, setActiveTab, liked, saved, toggleLike, toggleSave } = useFeed();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  const renderHeader = useCallback(
    () => <FeedListHeader activeTab={activeTab} onTabChange={setActiveTab} />,
    [activeTab, setActiveTab],
  );

  if (loading || !user) return null;

  const posts = feedPosts[activeTab];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <FeedHeader />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            isLiked={!!liked[item.id]}
            isSaved={!!saved[item.id]}
            onLike={() => toggleLike(item.id)}
            onSave={() => toggleSave(item.id)}
          />
        )}
        // Re-render when tab changes so FlatList sees new data
        extraData={activeTab}
      />

      {/* FAB — Nuevo post */}
      <TouchableOpacity
        accessibilityLabel="Crear post"
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          width: 48, height: 48,
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={[colors.pride.pink, colors.pride.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
