import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

function extractHashtags(content: string): string[] {
  const matches = content.match(/#[\wÀ-ž]+/g) ?? [];
  return [...new Set(matches.map(h => h.slice(1).toLowerCase()))];
}

// Obtiene el ID del hashtag, creándolo si no existe.
// Usa select-then-insert para evitar el bug de .single() con upsert en conflict.
async function getOrCreateHashtag(name: string): Promise<string | null> {
  // 1. Buscar existente
  const { data: existing } = await supabase
    .from('hashtags')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (existing?.id) return existing.id;

  // 2. Insertar nuevo
  const { data: inserted, error } = await supabase
    .from('hashtags')
    .insert({ name })
    .select('id')
    .maybeSingle();
  if (error) {
    // Si fue un duplicate en una carrera de concurrencia, reintentar select
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('hashtags')
        .select('id')
        .eq('name', name)
        .maybeSingle();
      return retry?.id ?? null;
    }
    console.error(`getOrCreateHashtag("${name}"):`, error.message);
    return null;
  }
  return inserted?.id ?? null;
}

// POST /posts — crear post
router.post('/', async (req: AuthRequest, res) => {
  const { content, image_url, mood, mood_color } = req.body;
  const userId = req.userId!;

  if (!content?.trim()) {
    res.status(400).json({ error: 'El contenido es requerido' });
    return;
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      user_id:   userId,
      content:   content.trim(),
      image_url: image_url  ?? null,
      mood:      mood       ?? null,
      mood_color: mood_color ?? null,
    })
    .select('*, author:profiles!posts_user_id_fkey(id, name, avatar_url, username)')
    .single();

  if (error || !post) {
    res.status(500).json({ error: error?.message ?? 'Error al crear el post' });
    return;
  }

  const tagNames = extractHashtags(content);

  for (const name of tagNames) {
    const tagId = await getOrCreateHashtag(name);
    if (!tagId) continue;

    const { error: pivotError } = await supabase
      .from('post_hashtags')
      .insert({ post_id: post.id, hashtag_id: tagId });

    if (pivotError) {
      console.error(`post_hashtags insert ("${name}"):`, pivotError.message);
    }
  }

  res.status(201).json({ post: { ...post, hashtags: tagNames, is_liked_by_me: false } });
});

// GET /posts/feed — feed paginado
router.get('/feed', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const limit  = Math.min(Number(req.query.limit ?? 20), 50);
  const offset = Number(req.query.offset ?? 0);

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_user_id_fkey(id, name, avatar_url, username)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!posts?.length) {
    res.json({ posts: [] });
    return;
  }

  const postIds = posts.map(p => p.id);

  const [{ data: phRows }, { data: likeRows }] = await Promise.all([
    supabase
      .from('post_hashtags')
      .select('post_id, hashtag:hashtags!post_hashtags_hashtag_id_fkey(name)')
      .in('post_id', postIds),
    supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds),
  ]);

  const likedSet = new Set((likeRows ?? []).map(l => l.post_id));
  const tagsByPost: Record<string, string[]> = {};
  for (const row of phRows ?? []) {
    const name = (row.hashtag as any)?.name as string | undefined;
    if (name) (tagsByPost[row.post_id] ??= []).push(name);
  }

  res.json({
    posts: posts.map(p => ({
      ...p,
      hashtags:       tagsByPost[p.id] ?? [],
      is_liked_by_me: likedSet.has(p.id),
    })),
  });
});

// GET /posts/trends — hashtags más populares
router.get('/trends', async (_req, res) => {
  const { data, error } = await supabase
    .from('hashtags')
    .select('id, name, posts_count')
    .order('posts_count', { ascending: false })
    .limit(10);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ trends: data ?? [] });
});

// POST /posts/:id/like — toggle like
router.post('/:id/like', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const postId = req.params.id;

  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    res.json({ liked: false });
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    res.json({ liked: true });
  }
});

// GET /posts/:id/comments
router.get('/:id/comments', async (req, res) => {
  const postId = req.params.id;
  const limit  = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);

  const { data: comments, error } = await supabase
    .from('post_comments')
    .select('*, author:profiles!post_comments_user_id_fkey(id, name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ comments: comments ?? [] });
});

// POST /posts/:id/comments — agregar comentario
router.post('/:id/comments', async (req: AuthRequest, res) => {
  const userId  = req.userId!;
  const postId  = req.params.id;
  const { content } = req.body;

  if (!content?.trim()) {
    res.status(400).json({ error: 'El comentario no puede estar vacío' });
    return;
  }

  const { data: comment, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, content: content.trim() })
    .select('*, author:profiles!post_comments_user_id_fkey(id, name, avatar_url)')
    .single();

  if (error || !comment) {
    res.status(500).json({ error: error?.message ?? 'Error al comentar' });
    return;
  }

  res.status(201).json({ comment });
});

// DELETE /posts/:id/comments/:commentId
router.delete('/:id/comments/:commentId', async (req: AuthRequest, res) => {
  const userId     = req.userId!;
  const commentId  = req.params.commentId;

  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ ok: true });
});

// DELETE /posts/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { id } = req.params;

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ ok: true });
});

export default router;
