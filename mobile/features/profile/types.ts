export interface UserProfile {
  id:         string;
  email:      string;
  name:       string | null;
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

export interface ProfileUpdate {
  name?:       string;
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
