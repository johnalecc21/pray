import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /auth/register
router.post('/register', async (req, res) => {
  const body = registerSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const { name, email, password } = body.data;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { name },
    email_confirm: true,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  // Sign in to get session tokens
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !session.session) {
    res.status(500).json({ error: 'User created but could not sign in' });
    return;
  }

  res.status(201).json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
    },
    session: {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      expires_at: session.session.expires_at,
    },
  });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const body = loginSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const { email, password } = body.data;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

// GET /auth/oauth/url/:provider
router.get('/oauth/url/:provider', async (req, res) => {
  const provider = req.params.provider as 'google' | 'facebook' | 'apple';
  const redirectTo = `${process.env.APP_URL ?? 'charco://'}auth-callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error || !data.url) {
    res.status(500).json({ error: 'Could not generate OAuth URL' });
    return;
  }

  res.json({ url: data.url });
});

// POST /auth/oauth/exchange
router.post('/oauth/exchange', async (req, res) => {
  const { code } = z.object({ code: z.string() }).parse(req.body);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    res.status(400).json({ error: 'Could not exchange code' });
    return;
  }

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

// POST /auth/oauth/apple
router.post('/oauth/apple', async (req, res) => {
  const { identity_token, name } = z.object({
    identity_token: z.string(),
    name: z.string().optional(),
  }).parse(req.body);

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identity_token,
  });

  if (error || !data.session) {
    res.status(401).json({ error: 'Apple sign in failed' });
    return;
  }

  // Update name on first sign in
  if (name) {
    await supabase.auth.admin.updateUserById(data.user.id, {
      user_metadata: { name },
    });
  }

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: name ?? data.user.user_metadata?.name,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  const { refresh_token } = z.object({ refresh_token: z.string() }).parse(req.body);

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });

  if (error || !data.session) {
    res.status(401).json({ error: 'Session expired' });
    return;
  }

  res.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

export default router;
