import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

// ─── helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function jaccardSim(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0.4;
  const union = new Set([...a, ...b]).size;
  if (!union) return 0;
  return a.filter(x => b.includes(x)).length / union;
}

function quickScore(
  myMeta:    Record<string, unknown>,
  theirMeta: Record<string, unknown>,
  distKm:    number | null,
): number {
  const intSim  = jaccardSim((myMeta.interests  as string[]) ?? [], (theirMeta.interests as string[]) ?? []);
  const moodSim = jaccardSim((myMeta.moods      as string[]) ?? [], (theirMeta.moods     as string[]) ?? []);
  const idSim   = jaccardSim((myMeta.identity   as string[]) ?? [], (theirMeta.identity  as string[]) ?? []);
  const distPts = distKm == null ? 5 : distKm < 10 ? 10 : distKm < 30 ? 8.2 : distKm < 100 ? 5.5 : distKm < 500 ? 2.5 : 0.5;
  return Math.min(Math.round(25 + (intSim * 25 + moodSim * 18 + idSim * 15 + distPts) * 0.74), 99);
}

// ─── GET /match/candidates ───────────────────────────────────────────────────

router.get('/candidates', async (req: AuthRequest, res) => {
  const userId = req.userId!;

  // Fetch in parallel — match_passes might not exist yet, handle gracefully
  const [
    { data: myData },
    { data: likedRows },
    { data: passedRows },
    listResult,
  ] = await Promise.all([
    supabase.auth.admin.getUserById(userId),
    supabase.from('user_likes').select('liked_id').eq('liker_id', userId),
    supabase.from('match_passes').select('passed_id').eq('passer_id', userId),
    supabase.auth.admin.listUsers({ perPage: 500 }),
  ]);
  const allAuthUsers = listResult.data?.users ?? [];

  if (!myData?.user) { res.status(404).json({ error: 'User not found' }); return; }

  const myMeta = myData.user.user_metadata ?? {};
  const myLat  = (myMeta.latitude  as number | undefined) ?? null;
  const myLon  = (myMeta.longitude as number | undefined) ?? null;

  const excluded = new Set<string>([
    userId,
    ...(likedRows  ?? []).map((r: any) => r.liked_id  as string),
    ...(passedRows ?? []).map((r: any) => r.passed_id as string),
  ]);

  // Filter to onboarded users only (have username in metadata)
  const eligible = allAuthUsers.filter(u => {
    if (excluded.has(u.id)) return false;
    const meta = u.user_metadata ?? {};
    return !!(meta.username);
  });

  if (!eligible.length) { res.json({ candidates: [] }); return; }

  // Optionally enrich with profiles table (safe columns only — no lat/lon)
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, username, name, avatar_url')
    .in('id', eligible.map(u => u.id));
  const profileMap = new Map((profileRows ?? []).map((p: any) => [p.id, p]));

  const candidates = eligible.map(u => {
    const meta       = (u.user_metadata ?? {}) as Record<string, unknown>;
    const prof       = profileMap.get(u.id);
    const theirLat   = (meta.latitude  as number | undefined) ?? null;
    const theirLon   = (meta.longitude as number | undefined) ?? null;

    const theirInterests = (meta.interests as string[] | undefined) ?? [];
    const myInterests    = (myMeta.interests    as string[] | undefined) ?? [];
    const theirMoods     = (meta.moods     as string[] | undefined) ?? [];
    const myMoods        = (myMeta.moods        as string[] | undefined) ?? [];

    let distance_km: number | null = null;
    if (myLat != null && myLon != null && theirLat != null && theirLon != null) {
      distance_km = parseFloat(haversineKm(myLat, myLon, theirLat, theirLon).toFixed(3));
    }

    const match_score      = quickScore(myMeta as Record<string, unknown>, meta, distance_km);
    const common_interests = theirInterests.filter(i => myInterests.includes(i));
    const common_moods     = theirMoods.filter(m => myMoods.includes(m));
    const match_factors: string[] = [];
    if (common_interests.length) match_factors.push(`${common_interests.length} interés${common_interests.length > 1 ? 'es' : ''} en común`);
    if (common_moods.length)     match_factors.push('misma energía');
    if (distance_km != null && distance_km < 30) match_factors.push('cerca de ti');

    return {
      id:               u.id,
      name:             (prof?.name       ?? meta.name       ?? null) as string | null,
      username:         (prof?.username   ?? meta.username   ?? null) as string | null,
      avatar_url:       (prof?.avatar_url ?? meta.avatar_url ?? null) as string | null,
      age:              (meta.age         as number | null) ?? null,
      bio:              (meta.bio         as string | null) ?? null,
      location:         (meta.location    as string | null) ?? null,
      pronouns:         (meta.pronouns    as string | null) ?? null,
      identity:         (meta.identity    as string[]) ?? [],
      interests:        theirInterests,
      moods:            theirMoods,
      photos:           (meta.photos      as string[]) ?? [],
      match_score,
      match_factors,
      distance_km,
      common_interests,
      common_moods,
    };
  });

  candidates.sort((a, b) => {
    if (a.distance_km != null && b.distance_km != null) return a.distance_km - b.distance_km;
    if (a.distance_km != null) return -1;
    if (b.distance_km != null) return 1;
    return b.match_score - a.match_score;
  });

  res.json({ candidates });
});

// ─── POST /match/pass/:userId ─────────────────────────────────────────────────

router.post('/pass/:userId', async (req: AuthRequest, res) => {
  const passerId = req.userId!;
  const passedId = req.params.userId as string;
  if (passerId === passedId) { res.status(400).json({ error: 'Invalid' }); return; }

  const { error } = await supabase
    .from('match_passes')
    .upsert({ passer_id: passerId, passed_id: passedId }, { onConflict: 'passer_id,passed_id' });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// ─── GET /match/matches ───────────────────────────────────────────────────────

router.get('/matches', async (req: AuthRequest, res) => {
  const userId = req.userId!;

  try {
  const { data: iLiked, error: iLikedError } = await supabase
    .from('user_likes').select('liked_id, created_at').eq('liker_id', userId);

  if (iLikedError) { console.error('[matches] iLiked error:', iLikedError); res.status(500).json({ error: iLikedError.message }); return; }
  if (!iLiked?.length) { res.json({ matches: [] }); return; }

  const iLikedIds = iLiked.map((r: any) => r.liked_id as string);

  const { data: theyLiked, error: theyLikedError } = await supabase
    .from('user_likes').select('liker_id').eq('liked_id', userId).in('liker_id', iLikedIds);

  if (theyLikedError) { console.error('[matches] theyLiked error:', theyLikedError); res.status(500).json({ error: theyLikedError.message }); return; }
  if (!theyLiked?.length) { res.json({ matches: [] }); return; }

  const mutualIds = theyLiked.map((r: any) => r.liker_id as string);

  const [
    { data: profiles },
    listResult,
    { data: myRow },
    { data: myData },
  ] = await Promise.all([
    supabase.from('profiles').select('id, username, name, avatar_url, latitude, longitude').in('id', mutualIds),
    supabase.auth.admin.listUsers({ perPage: 500 }),
    supabase.from('profiles').select('latitude, longitude').eq('id', userId).maybeSingle(),
    supabase.auth.admin.getUserById(userId),
  ]);
  const authUsers = listResult.data?.users ?? [];

  const myMeta = myData?.user?.user_metadata ?? {};
  const myLat  = myRow?.latitude  ?? (myMeta.latitude  as number | undefined) ?? null;
  const myLon  = myRow?.longitude ?? (myMeta.longitude as number | undefined) ?? null;

  const authMap    = new Map((authUsers ?? []).map((u: any) => [u.id, (u.user_metadata ?? {}) as Record<string, unknown>]));
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const likedAtMap = new Map(iLiked.map((r: any) => [r.liked_id as string, r.created_at as string]));

  const matches = mutualIds.map(id => {
    const p    = profileMap.get(id);
    const meta = authMap.get(id) ?? {} as Record<string, unknown>;
    const theirLat = p?.latitude  ?? (meta.latitude  as number | undefined) ?? null;
    const theirLon = p?.longitude ?? (meta.longitude as number | undefined) ?? null;
    let distance_km: number | null = null;
    if (myLat != null && myLon != null && theirLat != null && theirLon != null) {
      distance_km = parseFloat(haversineKm(myLat, myLon, theirLat, theirLon).toFixed(3));
    }
    return {
      id,
      name:       (p?.name       ?? meta.name       ?? null) as string | null,
      username:   (p?.username   ?? meta.username   ?? null) as string | null,
      avatar_url: (p?.avatar_url ?? meta.avatar_url ?? null) as string | null,
      age:        (meta.age      as number | null)  ?? null,
      moods:      (meta.moods    as string[])       ?? [],
      distance_km,
      matched_at: likedAtMap.get(id) ?? new Date().toISOString(),
    };
  });

  matches.sort((a, b) => new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime());
  res.json({ matches });
  } catch (err: any) {
    console.error('[matches] unexpected error:', err);
    res.status(500).json({ error: err?.message ?? 'Internal error' });
  }
});

export default router;
