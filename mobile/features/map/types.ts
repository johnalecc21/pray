export interface NearbyUser {
  id:          string;
  name:        string | null;
  username:    string | null;
  avatar_url:  string | null;
  age:         number | null;
  distance_km: number | null;
  bearing_deg: number | null;
  online:      boolean;
  hot_mode:    boolean;
  vibe:        string | null;
  moods:       string[];
}

export interface MapStats {
  online_count: number;
  views_today:  number;
  hot_matches:  number;
}

export type MapFilter = 'Todos' | 'Online' | 'Cerca' | 'Fiesta' | 'Dating' | 'Hot';

export const MAP_FILTERS: MapFilter[] = ['Todos', 'Online', 'Cerca', 'Fiesta', 'Dating', 'Hot'];
