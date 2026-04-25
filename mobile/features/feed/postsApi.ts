import { api } from '../../lib/api';
import type { Post, Comment, Trend } from './types';

export const postsApi = {
  getFeed: (limit = 20, offset = 0) =>
    api.get<{ posts: Post[] }>(`/posts/feed?limit=${limit}&offset=${offset}`),

  createPost: (body: {
    content: string;
    image_url?: string | null;
    mood?: string | null;
    mood_color?: string | null;
  }) => api.post<{ post: Post }>('/posts', body),

  deletePost: (id: string) =>
    api.delete<{ ok: boolean }>(`/posts/${id}`),

  toggleLike: (postId: string) =>
    api.post<{ liked: boolean }>(`/posts/${postId}/like`, {}),

  getComments: (postId: string, limit = 50, offset = 0) =>
    api.get<{ comments: Comment[] }>(`/posts/${postId}/comments?limit=${limit}&offset=${offset}`),

  addComment: (postId: string, content: string) =>
    api.post<{ comment: Comment }>(`/posts/${postId}/comments`, { content }),

  deleteComment: (postId: string, commentId: string) =>
    api.delete<{ ok: boolean }>(`/posts/${postId}/comments/${commentId}`),

  getTrends: () =>
    api.get<{ trends: Trend[] }>('/posts/trends'),
};
