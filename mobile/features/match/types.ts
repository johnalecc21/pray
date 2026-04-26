export interface MatchCandidate {
  id:               string;
  name:             string | null;
  username:         string | null;
  avatar_url:       string | null;
  age:              number | null;
  bio:              string | null;
  location:         string | null;
  pronouns:         string | null;
  identity:         string[];
  interests:        string[];
  moods:            string[];
  photos:           string[];
  match_score:      number;
  match_factors:    string[];
  distance_km:      number | null;
  common_interests: string[];
  common_moods:     string[];
}

export interface MatchUser {
  id:          string;
  name:        string | null;
  username:    string | null;
  avatar_url:  string | null;
  age:         number | null;
  moods:       string[];
  distance_km: number | null;
  matched_at:  string;
}
