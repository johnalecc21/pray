export const FEED_TABS = ['Para ti', 'Siguiendo', 'Comunidades'] as const;
export type FeedTab = typeof FEED_TABS[number];

export interface Story {
  id: string;
  name: string;
  isMe?: boolean;
  color?: string;
}

export interface QuickAccessItem {
  id: string;
  label: string;
  iconName: string;
  color: string;
  bgColor: string;
}

export interface EventEmbed {
  title: string;
  when: string;
  going: number;
}

export interface CommunityEmbed {
  name: string;
  members: number;
  tag: string;
}

// Tipo legacy usado por los datos mock en data.ts
export interface FeedPost {
  id: string;
  user: string;
  handle: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
  mood: string;
  moodColor: string;
  gradient: [string, string];
  isLive?: boolean;
  eventCard?: EventEmbed;
  communityCard?: CommunityEmbed;
}

// Tipo real — respuesta de la API
export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  mood: string | null;
  mood_color: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  hashtags: string[];
  is_liked_by_me: boolean;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

export interface Trend {
  id: string;
  name: string;
  posts_count: number;
}
