import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { postsApi } from '../features/feed/postsApi';
import type { Post, UserReply } from '../features/feed/types';

interface PostsContextValue {
  feedPosts:     Post[];
  feedLoading:   boolean;
  feedRefreshing: boolean;
  fetchFeed:     (isRefresh?: boolean) => Promise<void>;

  userPosts:        Post[];
  userPostsLoading: boolean;
  userPostsLoaded:  boolean;
  fetchUserPosts:   (userId: string) => Promise<void>;

  likedPosts:        Post[];
  likedPostsLoading: boolean;
  likedPostsLoaded:  boolean;
  fetchLikedPosts:   () => Promise<void>;

  userReplies:        UserReply[];
  userRepliesLoading: boolean;
  userRepliesLoaded:  boolean;
  fetchUserReplies:   () => Promise<void>;

  toggleLike:           (postId: string) => Promise<void>;
  deletePost:           (postId: string) => Promise<void>;
  addPost:              (post: Post) => void;
  incrementCommentCount:(postId: string) => void;
}

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [feedPosts,      setFeedPosts]      = useState<Post[]>([]);
  const [feedLoading,    setFeedLoading]    = useState(true);
  const [feedRefreshing, setFeedRefreshing] = useState(false);

  const [userPosts,        setUserPosts]        = useState<Post[]>([]);
  const [userPostsLoading, setUserPostsLoading] = useState(false);
  const [userPostsLoaded,  setUserPostsLoaded]  = useState(false);

  const [likedPosts,        setLikedPosts]        = useState<Post[]>([]);
  const [likedPostsLoading, setLikedPostsLoading] = useState(false);
  const [likedPostsLoaded,  setLikedPostsLoaded]  = useState(false);

  const [userReplies,        setUserReplies]        = useState<UserReply[]>([]);
  const [userRepliesLoading, setUserRepliesLoading] = useState(false);
  const [userRepliesLoaded,  setUserRepliesLoaded]  = useState(false);

  // Refs so toggleLike can read current state without being in its dep array
  const feedPostsRef  = useRef<Post[]>([]);
  const userPostsRef  = useRef<Post[]>([]);
  const likedPostsRef = useRef<Post[]>([]);
  useEffect(() => { feedPostsRef.current  = feedPosts;  }, [feedPosts]);
  useEffect(() => { userPostsRef.current  = userPosts;  }, [userPosts]);
  useEffect(() => { likedPostsRef.current = likedPosts; }, [likedPosts]);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setFeedRefreshing(true);
    else           setFeedLoading(true);
    try {
      const { posts } = await postsApi.getFeed();
      setFeedPosts(posts);
    } catch (err) {
      console.error('fetchFeed:', err);
    } finally {
      setFeedLoading(false);
      setFeedRefreshing(false);
    }
  }, []);

  const fetchUserPosts = useCallback(async (userId: string) => {
    setUserPostsLoading(true);
    try {
      const { posts } = await postsApi.getPostsByUser(userId);
      setUserPosts(posts);
      setUserPostsLoaded(true);
    } catch (err) {
      console.error('fetchUserPosts:', err);
    } finally {
      setUserPostsLoading(false);
    }
  }, []);

  const fetchLikedPosts = useCallback(async () => {
    setLikedPostsLoading(true);
    try {
      const { posts } = await postsApi.getLikedPosts();
      setLikedPosts(posts);
      setLikedPostsLoaded(true);
    } catch (err) {
      console.error('fetchLikedPosts:', err);
    } finally {
      setLikedPostsLoading(false);
    }
  }, []);

  const fetchUserReplies = useCallback(async () => {
    setUserRepliesLoading(true);
    try {
      const { replies } = await postsApi.getUserReplies();
      setUserReplies(replies);
      setUserRepliesLoaded(true);
    } catch (err) {
      console.error('fetchUserReplies:', err);
    } finally {
      setUserRepliesLoading(false);
    }
  }, []);

  // Stable reference: uses refs to read current state
  const toggleLike = useCallback(async (postId: string) => {
    const refPost =
      feedPostsRef.current.find(p => p.id === postId) ||
      userPostsRef.current.find(p => p.id === postId) ||
      likedPostsRef.current.find(p => p.id === postId);
    if (!refPost) return;

    const wasLiked = refPost.is_liked_by_me;

    const applyToggle = (posts: Post[]) => posts.map(p =>
      p.id !== postId ? p : {
        ...p,
        is_liked_by_me: !p.is_liked_by_me,
        likes_count: p.is_liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
      }
    );

    setFeedPosts(applyToggle);
    setUserPosts(applyToggle);

    if (wasLiked) {
      setLikedPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      setLikedPosts(prev => [{
        ...refPost,
        is_liked_by_me: true,
        likes_count: refPost.likes_count + 1,
      }, ...prev]);
    }

    try {
      await postsApi.toggleLike(postId);
    } catch {
      // Revert all changes
      setFeedPosts(applyToggle);
      setUserPosts(applyToggle);
      if (wasLiked) {
        setLikedPosts(prev => [{ ...refPost }, ...prev]);
      } else {
        setLikedPosts(prev => prev.filter(p => p.id !== postId));
      }
    }
  }, []);

  // Stable: uses functional updates, throws on API error so caller can show Alert
  const deletePost = useCallback(async (postId: string) => {
    setFeedPosts( prev => prev.filter(p => p.id !== postId));
    setUserPosts( prev => prev.filter(p => p.id !== postId));
    setLikedPosts(prev => prev.filter(p => p.id !== postId));
    await postsApi.deletePost(postId);
  }, []);

  const addPost = useCallback((post: Post) => {
    setFeedPosts( prev => [post, ...prev]);
    setUserPosts( prev => [post, ...prev]);
  }, []);

  const incrementCommentCount = useCallback((postId: string) => {
    const update = (posts: Post[]) =>
      posts.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p);
    setFeedPosts(update);
    setUserPosts(update);
    setLikedPosts(update);
  }, []);

  return (
    <PostsContext.Provider value={{
      feedPosts, feedLoading, feedRefreshing, fetchFeed,
      userPosts, userPostsLoading, userPostsLoaded, fetchUserPosts,
      likedPosts, likedPostsLoading, likedPostsLoaded, fetchLikedPosts,
      userReplies, userRepliesLoading, userRepliesLoaded, fetchUserReplies,
      toggleLike, deletePost, addPost, incrementCommentCount,
    }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
}
