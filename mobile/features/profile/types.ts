export interface UserProfile {
  id:         string;
  email:      string;
  name:       string | null;
  avatar_url: string | null;
  identity:   string[];
  pronouns:   string | null;
  interests:  string[];
  moods:      string[];
  created_at: string;
}

export interface ProfileUpdate {
  name?:       string;
  identity?:   string[];
  pronouns?:   string;
  interests?:  string[];
  moods?:      string[];
  avatar_url?: string;
}
