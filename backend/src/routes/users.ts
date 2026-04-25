import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

router.use(requireAuth);

// POST /users/onboarding
router.post('/onboarding', async (req: AuthRequest, res) => {
  const { identity, pronouns, interests, moods, avatar_url } = req.body;
  const userId = req.userId!;

  // 1. Update Supabase Auth user_metadata
  const metadata: Record<string, unknown> = {
    identity,
    pronouns,
    interests,
    moods,
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

  // 2. Update profiles table (upsert por si el trigger no lo creó aún)
  const profileUpdate: Record<string, unknown> = {
    id: userId,
    updated_at: new Date().toISOString(),
  };
  if (avatar_url) profileUpdate.avatar_url = avatar_url;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileUpdate, { onConflict: 'id' });

  if (profileError) {
    // No es fatal — los datos están en user_metadata igualmente
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
  res.json({
    id:         data.user.id,
    email:      data.user.email,
    name:       meta.name        ?? null,
    avatar_url: meta.avatar_url  ?? null,
    cover_url:  meta.cover_url   ?? null,
    bio:        meta.bio         ?? null,
    location:   meta.location    ?? null,
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
  const { name, identity, pronouns, interests, moods, avatar_url, cover_url, bio, location, photos } = req.body;
  const userId = req.userId!;

  const metadata: Record<string, unknown> = {};
  if (name       !== undefined) metadata.name       = name;
  if (identity   !== undefined) metadata.identity   = identity;
  if (pronouns   !== undefined) metadata.pronouns   = pronouns;
  if (interests  !== undefined) metadata.interests  = interests;
  if (moods      !== undefined) metadata.moods      = moods;
  if (avatar_url !== undefined) metadata.avatar_url = avatar_url;
  if (cover_url  !== undefined) metadata.cover_url  = cover_url;
  if (bio        !== undefined) metadata.bio        = bio;
  if (location   !== undefined) metadata.location   = location;
  if (photos     !== undefined) metadata.photos     = photos;

  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });

  if (authError) {
    res.status(500).json({ error: authError.message });
    return;
  }

  const profileUpdate: Record<string, unknown> = {
    id: userId,
    updated_at: new Date().toISOString(),
  };
  if (name       !== undefined) profileUpdate.name       = name;
  if (avatar_url !== undefined) profileUpdate.avatar_url = avatar_url;

  await supabase.from('profiles').upsert(profileUpdate, { onConflict: 'id' });

  res.json({ ok: true });
});

export default router;
