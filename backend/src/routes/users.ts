import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

const USERNAME_RE = /^[a-z0-9_\-]{3,30}$/;

function sanitizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

// ─── Match-IA helpers ─────────────────────────────────────────────────────────

function jaccardScore(a: string[], b: string[], maxPts: number): number {
  if (a.length === 0 && b.length === 0) return maxPts * 0.4;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 0;
  return (intersection / union) * maxPts;
}

function ageScore(ageA: number | null, ageB: number | null, maxPts: number): number {
  if (ageA == null || ageB == null) return maxPts * 0.5;
  const diff = Math.abs(ageA - ageB);
  let pct: number;
  if (diff <= 2)       pct = 1.00;
  else if (diff <= 5)  pct = 0.85;
  else if (diff <= 8)  pct = 0.60;
  else if (diff <= 12) pct = 0.30;
  else                 pct = 0.10;
  return pct * maxPts;
}

function distanceScore(km: number | null, maxPts: number): number {
  if (km == null) return maxPts * 0.5;
  if (km < 10)        return maxPts * 1.00;
  if (km < 30)        return maxPts * 0.82;
  if (km < 100)       return maxPts * 0.55;
  if (km < 500)       return maxPts * 0.25;
  return maxPts * 0.05;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SPANISH_STOPWORDS = new Set([
  'el','la','los','las','un','una','de','del','al','a','en','y','o','que','con',
  'por','para','mi','tu','su','nos','me','te','se','es','son','era','fue',
  'hay','no','lo','le','les','muy','más','pero','como','todo','porque',
  'cuando','si','ya','ser','estar','hacer','tener','ir','ver','dar','saber',
]);

function bioCosineSim(bioA: string | null, bioB: string | null, maxPts: number): number {
  if (!bioA || !bioB) return 0;
  const tokenize = (s: string) =>
    s.toLowerCase()
      .replace(/[^\wáéíóúüñ\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !SPANISH_STOPWORDS.has(w));

  const tokA = tokenize(bioA);
  const tokB = tokenize(bioB);
  if (tokA.length === 0 || tokB.length === 0) return 0;

  const freq = (toks: string[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const t of toks) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
  };

  const fA = freq(tokA);
  const fB = freq(tokB);
  const vocab = new Set([...fA.keys(), ...fB.keys()]);

  let dot = 0, normA = 0, normB = 0;
  for (const w of vocab) {
    const a = fA.get(w) ?? 0;
    const b = fB.get(w) ?? 0;
    dot   += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return (dot / (Math.sqrt(normA) * Math.sqrt(normB))) * maxPts;
}

interface MatchParams {
  theirInterests:   string[];
  myInterests:      string[];
  theirMoods:       string[];
  myMoods:          string[];
  theirIdentity:    string[];
  myIdentity:       string[];
  theirAge:         number | null;
  myAge:            number | null;
  theirPronouns:    string | null;
  myPronouns:       string | null;
  theirBio:         string | null;
  myBio:            string | null;
  sharedLikedPosts: number;
  totalLikedByMe:   number;
  distance_km:      number | null;
}

function computeMatchScore(p: MatchParams): { score: number; factors: string[] } {
  // Weights: interests=25, moods=18, identity=15, age=13, distance=10, activity=10, bio=6, pronouns=3
  const interestPts = jaccardScore(p.theirInterests, p.myInterests, 25);
  const moodPts     = jaccardScore(p.theirMoods,     p.myMoods,     18);
  const identityPts = jaccardScore(p.theirIdentity,  p.myIdentity,  15);
  const agePts      = ageScore(p.theirAge, p.myAge, 13);
  const distPts     = distanceScore(p.distance_km, 10);
  const activityRatio = p.totalLikedByMe > 0
    ? Math.min(p.sharedLikedPosts / p.totalLikedByMe, 1)
    : 0;
  const activityPts = activityRatio * 10;
  const bioPts      = bioCosineSim(p.theirBio, p.myBio, 6);
  const pronounPts  = (p.theirPronouns && p.myPronouns && p.theirPronouns === p.myPronouns) ? 3 : 0;

  const raw   = interestPts + moodPts + identityPts + agePts + distPts + activityPts + bioPts + pronounPts;
  const score = Math.min(Math.round(25 + raw * 0.74), 99);

  const commonInterests = p.theirInterests.filter(i => p.myInterests.includes(i));
  const commonMoods     = p.theirMoods.filter(m => p.myMoods.includes(m));
  const commonIdentity  = p.theirIdentity.filter(id => p.myIdentity.includes(id));

  const factors: string[] = [];
  if (commonInterests.length >= 1)
    factors.push(`${commonInterests.length} interés${commonInterests.length > 1 ? 'es' : ''} en común`);
  if (commonMoods.length >= 1)
    factors.push('misma energía');
  if (commonIdentity.length >= 1)
    factors.push('identidad afín');
  if (p.sharedLikedPosts >= 2)
    factors.push(`${p.sharedLikedPosts} posts en común`);
  if (agePts >= 10)
    factors.push('edades compatibles');
  if (bioPts >= 3)
    factors.push('bios afines');
  if (pronounPts > 0)
    factors.push('mismos pronombres');
  if (p.distance_km != null && p.distance_km < 30)
    factors.push('cerca de ti');

  return { score, factors };
}

// GET /users/check-username/:username — verificar disponibilidad (requiere auth)
router.get('/check-username/:username', requireAuth, async (req: AuthRequest, res) => {
  const username = sanitizeUsername(req.params.username as string);

  if (!USERNAME_RE.test(username)) {
    res.json({ available: false, reason: 'invalid' });
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ available: !data });
});

router.use(requireAuth);

// POST /users/onboarding
router.post('/onboarding', async (req: AuthRequest, res) => {
  const { identity, pronouns, age, interests, moods, avatar_url, username } = req.body;
  const userId = req.userId!;

  // Validate username
  if (!username) {
    res.status(400).json({ error: 'El username es requerido' });
    return;
  }
  const cleanUsername = sanitizeUsername(username);
  if (!USERNAME_RE.test(cleanUsername)) {
    res.status(400).json({ error: 'Username inválido. Usa letras, números, _ o - (3-30 caracteres)' });
    return;
  }

  // Check uniqueness (exclude current user in case of re-onboarding)
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', cleanUsername)
    .neq('id', userId)
    .maybeSingle();
  if (existing) {
    res.status(409).json({ error: 'Este username ya está en uso' });
    return;
  }

  const metadata: Record<string, unknown> = {
    identity,
    pronouns,
    age:                 age ?? null,
    interests,
    moods,
    username:            cleanUsername,
    onboarding_complete: true,
  };
  if (avatar_url) metadata.avatar_url = avatar_url;

  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });
  if (authError) {
    res.status(500).json({ error: authError.message });
    return;
  }

  const profileUpdate: Record<string, unknown> = {
    id:         userId,
    username:   cleanUsername,
    updated_at: new Date().toISOString(),
  };
  if (avatar_url) profileUpdate.avatar_url = avatar_url;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileUpdate, { onConflict: 'id' });

  if (profileError) {
    if (profileError.code === '23505') {
      res.status(409).json({ error: 'Este username ya está en uso' });
      return;
    }
    console.error('Profile upsert error:', profileError.message);
  }

  res.json({ ok: true });
});

// GET /users/me
router.get('/me', async (req: AuthRequest, res) => {
  const { data, error } = await supabase.auth.admin.getUserById(req.userId!);
  if (error || !data.user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const meta = data.user.user_metadata ?? {};

  // Also read username from profiles table (source of truth for uniqueness)
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', req.userId!)
    .maybeSingle();

  res.json({
    id:         data.user.id,
    email:      data.user.email,
    name:       meta.name        ?? null,
    username:   profileRow?.username ?? meta.username ?? null,
    avatar_url: meta.avatar_url  ?? null,
    cover_url:  meta.cover_url   ?? null,
    bio:        meta.bio         ?? null,
    location:   meta.location    ?? null,
    age:        meta.age         ?? null,
    identity:   meta.identity    ?? [],
    pronouns:   meta.pronouns    ?? null,
    interests:  meta.interests   ?? [],
    moods:      meta.moods       ?? [],
    photos:     meta.photos      ?? [],
    created_at: data.user.created_at,
  });
});

// PUT /users/profile
router.put('/profile', async (req: AuthRequest, res) => {
  const {
    name, identity, pronouns, age, interests, moods,
    avatar_url, cover_url, bio, location, photos, username,
    latitude, longitude,
  } = req.body;
  const userId = req.userId!;

  // Username change handling
  if (username !== undefined) {
    const cleanUsername = sanitizeUsername(username);
    if (!USERNAME_RE.test(cleanUsername)) {
      res.status(400).json({ error: 'Username inválido. Usa letras, números, _ o - (3-30 caracteres)' });
      return;
    }

    // Check uniqueness (ignore current user)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .neq('id', userId)
      .maybeSingle();
    if (existing) {
      res.status(409).json({ error: 'Este username ya está en uso' });
      return;
    }
  }

  const metadata: Record<string, unknown> = {};
  if (name       !== undefined) metadata.name       = name;
  if (identity   !== undefined) metadata.identity   = identity;
  if (pronouns   !== undefined) metadata.pronouns   = pronouns;
  if (age        !== undefined) metadata.age        = age;
  if (interests  !== undefined) metadata.interests  = interests;
  if (moods      !== undefined) metadata.moods      = moods;
  if (avatar_url !== undefined) metadata.avatar_url = avatar_url;
  if (cover_url  !== undefined) metadata.cover_url  = cover_url;
  if (bio        !== undefined) metadata.bio        = bio;
  if (location   !== undefined) metadata.location   = location;
  if (photos     !== undefined) metadata.photos     = photos;
  if (username   !== undefined) metadata.username   = sanitizeUsername(username);
  if (latitude   !== undefined) metadata.latitude   = latitude;
  if (longitude  !== undefined) metadata.longitude  = longitude;

  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });
  if (authError) {
    res.status(500).json({ error: authError.message });
    return;
  }

  const profileUpdate: Record<string, unknown> = {
    id:         userId,
    updated_at: new Date().toISOString(),
  };
  if (name       !== undefined) profileUpdate.name       = name;
  if (avatar_url !== undefined) profileUpdate.avatar_url = avatar_url;
  if (username   !== undefined) profileUpdate.username   = sanitizeUsername(username);
  if (latitude   !== undefined) profileUpdate.latitude   = latitude;
  if (longitude  !== undefined) profileUpdate.longitude  = longitude;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileUpdate, { onConflict: 'id' });

  if (profileError) {
    if (profileError.code === '23505') {
      res.status(409).json({ error: 'Este username ya está en uso' });
      return;
    }
    console.error('Profile upsert error:', profileError.message);
  }

  res.json({ ok: true });
});

// GET /users/:userId — perfil público de otro usuario
router.get('/:userId', async (req: AuthRequest, res) => {
  const userId      = req.params.userId as string;
  const requesterId = req.userId!;

  if (userId === requesterId) {
    res.status(400).json({ error: 'Usa /users/me para tu propio perfil' });
    return;
  }

  const [
    { data: targetData },
    { data: myData },
    { data: profileRows },
    { data: myLikes },
    { data: theirLikes },
    { data: likeRow },
  ] = await Promise.all([
    supabase.auth.admin.getUserById(userId),
    supabase.auth.admin.getUserById(requesterId),
    supabase.from('profiles').select('id, username, latitude, longitude').in('id', [userId, requesterId]),
    supabase.from('post_likes').select('post_id').eq('user_id', requesterId),
    supabase.from('post_likes').select('post_id').eq('user_id', userId),
    supabase.from('user_likes').select('liked_id').eq('liker_id', requesterId).eq('liked_id', userId).maybeSingle(),
  ]);

  if (!targetData?.user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const meta   = targetData.user.user_metadata ?? {};
  const myMeta = myData?.user?.user_metadata   ?? {};

  const targetProfile = (profileRows ?? []).find((p: any) => p.id === userId);
  const myProfile     = (profileRows ?? []).find((p: any) => p.id === requesterId);

  const theirInterests = (meta.interests   as string[]) ?? [];
  const theirMoods     = (meta.moods       as string[]) ?? [];
  const theirIdentity  = (meta.identity    as string[]) ?? [];
  const myInterests    = (myMeta.interests as string[]) ?? [];
  const myMoods        = (myMeta.moods     as string[]) ?? [];
  const myIdentity     = (myMeta.identity  as string[]) ?? [];

  const myLikedIds    = new Set<string>((myLikes    ?? []).map((r: any) => r.post_id as string));
  const theirLikedIds = new Set<string>((theirLikes ?? []).map((r: any) => r.post_id as string));
  const sharedLiked   = [...myLikedIds].filter(id => theirLikedIds.has(id)).length;

  let distance_km: number | null = null;
  if (
    targetProfile?.latitude  != null && targetProfile?.longitude != null &&
    myProfile?.latitude      != null && myProfile?.longitude     != null
  ) {
    distance_km = Math.round(haversineKm(
      myProfile.latitude,     myProfile.longitude,
      targetProfile.latitude, targetProfile.longitude,
    ));
  }

  const { score, factors } = computeMatchScore({
    theirInterests, myInterests,
    theirMoods,     myMoods,
    theirIdentity,  myIdentity,
    theirAge:         (meta.age   as number | null) ?? null,
    myAge:            (myMeta.age as number | null) ?? null,
    theirPronouns:    (meta.pronouns   as string | null) ?? null,
    myPronouns:       (myMeta.pronouns as string | null) ?? null,
    theirBio:         (meta.bio   as string | null) ?? null,
    myBio:            (myMeta.bio as string | null) ?? null,
    sharedLikedPosts: sharedLiked,
    totalLikedByMe:   myLikedIds.size,
    distance_km,
  });

  const commonInterests = theirInterests.filter(i => myInterests.includes(i));
  const commonMoods     = theirMoods.filter(m => myMoods.includes(m));

  res.json({
    profile: {
      id:               userId,
      name:             meta.name      ?? null,
      username:         targetProfile?.username ?? meta.username ?? null,
      avatar_url:       meta.avatar_url ?? null,
      cover_url:        meta.cover_url  ?? null,
      bio:              meta.bio        ?? null,
      age:              meta.age        ?? null,
      pronouns:         meta.pronouns   ?? null,
      location:         meta.location   ?? null,
      identity:         theirIdentity,
      interests:        theirInterests,
      moods:            theirMoods,
      photos:           (meta.photos    as string[]) ?? [],
      common_interests: commonInterests,
      common_moods:     commonMoods,
      match_score:      score,
      match_factors:    factors,
      distance_km,
      is_liked_by_me:   !!likeRow,
    },
  });
});

// POST /users/:userId/like — toggle like a un usuario
router.post('/:userId/like', async (req: AuthRequest, res) => {
  const likerId = req.userId!;
  const likedId = req.params.userId;

  if (likerId === likedId) {
    res.status(400).json({ error: 'No puedes darte me gusta a ti mismo' });
    return;
  }

  const { data: existing } = await supabase
    .from('user_likes')
    .select('liked_id')
    .eq('liker_id', likerId)
    .eq('liked_id', likedId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('user_likes').delete().eq('liker_id', likerId).eq('liked_id', likedId);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ liked: false });
  } else {
    const { error } = await supabase
      .from('user_likes').insert({ liker_id: likerId, liked_id: likedId });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ liked: true });
  }
});

export default router;
