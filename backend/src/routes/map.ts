import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

// ─── helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

const FIVE_MIN_MS = 5 * 60_000;

// ─── PATCH /map/presence ─────────────────────────────────────────────────────

router.patch('/presence', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { error } = await supabase
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// ─── POST /map/hot-mode ───────────────────────────────────────────────────────

router.post('/hot-mode', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { active } = req.body as { active: boolean };
  const { error } = await supabase
    .from('profiles')
    .update({ hot_mode: Boolean(active) })
    .eq('id', userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true, active: Boolean(active) });
});

// ─── POST /map/view/:userId ───────────────────────────────────────────────────

router.post('/view/:userId', async (req: AuthRequest, res) => {
  const viewerId = req.userId!;
  const viewedId = req.params.userId;
  if (viewerId === viewedId) { res.json({ ok: true }); return; }

  const fiveMinAgo = new Date(Date.now() - FIVE_MIN_MS).toISOString();
  const { data: recent } = await supabase
    .from('profile_views')
    .select('id')
    .eq('viewer_id', viewerId)
    .eq('viewed_id', viewedId)
    .gt('viewed_at', fiveMinAgo)
    .maybeSingle();

  if (!recent) {
    await supabase.from('profile_views').insert({ viewer_id: viewerId, viewed_id: viewedId });
  }
  res.json({ ok: true });
});

// ─── GET /map/stats ───────────────────────────────────────────────────────────

router.get('/stats', async (req: AuthRequest, res) => {
  const userId     = req.userId!;
  const fiveMinAgo = new Date(Date.now() - FIVE_MIN_MS).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: onlineCount },
    { count: viewsToday },
    { data: iLiked },
  ] = await Promise.all([
    supabase.from('profiles')
      .select('id', { count: 'exact', head: true })
      .neq('id', userId)
      .gt('last_seen_at', fiveMinAgo),
    supabase.from('profile_views')
      .select('id', { count: 'exact', head: true })
      .eq('viewed_id', userId)
      .gt('viewed_at', todayStart.toISOString()),
    supabase.from('user_likes').select('liked_id').eq('liker_id', userId),
  ]);

  let hotMatches = 0;
  if (iLiked?.length) {
    const iLikedIds = (iLiked as any[]).map(r => r.liked_id as string);
    const { data: mutual } = await supabase
      .from('user_likes')
      .select('liker_id')
      .eq('liked_id', userId)
      .in('liker_id', iLikedIds);

    if (mutual?.length) {
      const mutualIds = (mutual as any[]).map(r => r.liker_id as string);
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('id', mutualIds)
        .eq('hot_mode', true);
      hotMatches = count ?? 0;
    }
  }

  res.json({
    online_count: onlineCount ?? 0,
    views_today:  viewsToday  ?? 0,
    hot_matches:  hotMatches,
  });
});

// ─── GET /map/nearby ──────────────────────────────────────────────────────────
// moods/age live in auth user_metadata, not in profiles table — must join both

router.get('/nearby', async (req: AuthRequest, res) => {
  const userId  = req.userId!;
  const filter  = ((req.query.filter as string) ?? 'todos').toLowerCase();
  const hotOnly = req.query.hot_mode === 'true' || filter === 'hot';

  const [
    { data: me },
    myAuthResult,
    profilesResult,
    listResult,
  ] = await Promise.all([
    supabase.from('profiles')
      .select('latitude, longitude, hot_mode')
      .eq('id', userId)
      .maybeSingle(),
    supabase.auth.admin.getUserById(userId),
    // No lat/lon filter here — some users have coords only in user_metadata
    supabase.from('profiles')
      .select('id, name, username, avatar_url, latitude, longitude, hot_mode, last_seen_at')
      .neq('id', userId),
    supabase.auth.admin.listUsers({ perPage: 500 }),
  ]);

  const { data: profiles, error } = profilesResult;
  if (error) { res.status(500).json({ error: error.message }); return; }

  const allAuthUsers = listResult.data?.users ?? [];
  const metaMap = new Map(
    allAuthUsers.map(u => [u.id, (u.user_metadata ?? {}) as Record<string, unknown>]),
  );

  // Current user's coords: profiles table first, then auth metadata fallback
  const myMeta  = myAuthResult.data?.user?.user_metadata ?? {};
  const myLat   = ((me as any)?.latitude  ?? myMeta.latitude  ?? null) as number | null;
  const myLon   = ((me as any)?.longitude ?? myMeta.longitude ?? null) as number | null;
  const now     = Date.now();

  let users = ((profiles ?? []) as any[]).flatMap(p => {
    const meta = metaMap.get(p.id) ?? {};

    // Coords: profiles table first, auth metadata fallback
    const lat = (p.latitude  ?? (meta.latitude  as number | undefined) ?? null) as number | null;
    const lon = (p.longitude ?? (meta.longitude as number | undefined) ?? null) as number | null;

    // Skip users with no location at all
    if (lat == null || lon == null) return [];

    const distance_km = myLat != null && myLon != null
      ? parseFloat(haversineKm(myLat, myLon, lat, lon).toFixed(3))
      : null;
    const bearing_deg = myLat != null && myLon != null
      ? parseFloat(bearingDeg(myLat, myLon, lat, lon).toFixed(1))
      : null;
    const online  = p.last_seen_at
      ? (now - new Date(p.last_seen_at).getTime()) < FIVE_MIN_MS
      : false;
    const moods: string[] = (meta.moods as string[]) ?? [];

    return [{
      id:         p.id                                      as string,
      name:       (p.name       ?? meta.name       ?? null) as string | null,
      username:   (p.username   ?? meta.username   ?? null) as string | null,
      avatar_url: (p.avatar_url ?? meta.avatar_url ?? null) as string | null,
      age:        (meta.age     ?? null)                    as number | null,
      distance_km,
      bearing_deg,
      online,
      hot_mode:   Boolean(p.hot_mode),
      vibe:       moods[0] ?? null,
      moods,
    }];
  });

  // Apply filters
  if (hotOnly)                 users = users.filter(u => u.hot_mode);
  if (filter === 'online')     users = users.filter(u => u.online);
  else if (filter === 'cerca') users = users.filter(u => u.distance_km != null && u.distance_km <= 5);
  else if (['fiesta', 'dating', 'amistad', 'networking'].includes(filter)) {
    users = users.filter(u => u.moods.some((m: string) => m.toLowerCase() === filter));
  }

  users.sort((a, b) => {
    if (a.distance_km != null && b.distance_km != null) return a.distance_km - b.distance_km;
    if (a.distance_km != null) return -1;
    if (b.distance_km != null) return 1;
    return 0;
  });

  res.json({ users, my_hot_mode: Boolean((me as any)?.hot_mode ?? false) });
});

export default router;
