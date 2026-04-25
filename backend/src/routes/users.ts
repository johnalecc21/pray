import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

const USERNAME_RE = /^[a-z0-9_\-]{3,30}$/;

function sanitizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

// GET /users/check-username/:username — verificar disponibilidad (requiere auth)
router.get('/check-username/:username', requireAuth, async (req: AuthRequest, res) => {
  const username = sanitizeUsername(req.params.username);

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

export default router;
