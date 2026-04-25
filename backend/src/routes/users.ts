import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

router.use(requireAuth);

// GET /users/me
router.get('/me', async (req: AuthRequest, res) => {
  const { data, error } = await supabase.auth.admin.getUserById(req.userId!);

  if (error || !data.user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name ?? null,
    avatar_url: data.user.user_metadata?.avatar_url ?? null,
    created_at: data.user.created_at,
  });
});

export default router;
