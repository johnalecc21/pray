import { useState, useEffect } from 'react';
import type { FeedTab } from '../types';
import { usePosts } from '../../../context/PostsContext';

export function useFeed() {
  const {
    feedPosts, feedLoading, feedRefreshing, fetchFeed,
    toggleLike, addPost, deletePost, incrementCommentCount,
  } = usePosts();

  const [activeTab, setActiveTab] = useState<FeedTab>('Para ti');

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  return {
    activeTab, setActiveTab,
    posts:      feedPosts,
    loading:    feedLoading,
    refreshing: feedRefreshing,
    toggleLike,
    addPost,
    deletePost,
    incrementCommentCount,
    refresh: () => fetchFeed(true),
  };
}
