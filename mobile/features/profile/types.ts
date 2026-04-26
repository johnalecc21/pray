export interface UserProfile {
  id:         string;
  email:      string;
  name:       string | null;
  username:   string | null;
  avatar_url: string | null;
  cover_url:  string | null;
  bio:        string | null;
  location:   string | null;
  age:        number | null;
  identity:   string[];
  pronouns:   string | null;
  interests:  string[];
  moods:      string[];
  photos:     string[];
  created_at: string;
}

export interface PublicProfile {
  id:               string;
  name:             string | null;
  username:         string | null;
  avatar_url:       string | null;
  cover_url:        string | null;
  bio:              string | null;
  age:              number | null;
  pronouns:         string | null;
  location:         string | null;
  identity:         string[];
  interests:        string[];
  moods:            string[];
  photos:           string[];
  common_interests: string[];
  common_moods:     string[];
  match_score:      number;
  is_liked_by_me:   boolean;
}

export interface ProfileUpdate {
  name?:       string;
  username?:   string;
  identity?:   string[];
  pronouns?:   string;
  age?:        number | null;
  interests?:  string[];
  moods?:      string[];
  avatar_url?: string;
  cover_url?:  string;
  bio?:        string;
  location?:   string;
  photos?:     string[];
}
