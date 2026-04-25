import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

router.use(requireAuth);

// GET /users/me
router.get('/me', async (req: AuthRequest, res) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, created_at')
    .eq('id', req.userId!)
    .single();

  if (error || !profile) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Get email from auth
  const { data: authUser } = await supabase.auth.admin.getUserById(req.userId!);

  res.json({
    ...profile,
    email: authUser.user?.email,
  });
});

export default router;
