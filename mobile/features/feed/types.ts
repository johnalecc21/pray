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
