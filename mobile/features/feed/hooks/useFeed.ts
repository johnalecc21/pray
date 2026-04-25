import { useState, useCallback, useEffect } from 'react';
import type { FeedTab, Post } from '../types';
import { postsApi } from '../postsApi';

export function useFeed() {
  const [activeTab,  setActiveTab]  = useState<FeedTab>('Para ti');
  const [posts,      setPosts]      = useState<Post[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    try {
      const { posts: data } = await postsApi.getFeed();
      setPosts(data);
    } catch (err) {
      console.error('useFeed: error cargando posts', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const toggleLike = useCallback(async (postId: string) => {
    // Actualización optimista
    setPosts(prev => prev.map(p =>
      p.id !== postId ? p : {
        ...p,
        is_liked_by_me: !p.is_liked_by_me,
        likes_count: p.is_liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
      }
    ));
    try {
      await postsApi.toggleLike(postId);
    } catch {
      // Revertir en caso de error
      setPosts(prev => prev.map(p =>
        p.id !== postId ? p : {
          ...p,
          is_liked_by_me: !p.is_liked_by_me,
          likes_count: p.is_liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
        }
      ));
    }
  }, []);

  const addPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev]);
  }, []);

  const incrementCommentCount = useCallback((postId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
    ));
  }, []);

  return {
    activeTab, setActiveTab,
    posts,
    loading, refreshing,
    toggleLike,
    addPost,
    incrementCommentCount,
    refresh: () => fetchPosts(true),
  };
}
