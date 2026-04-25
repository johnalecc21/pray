-- ============================================================
-- SCHEMA CHARCO 2.0
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- -----------------------------------------------
-- PROFILES (extiende auth.users de Supabase)
-- -----------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  avatar_url  text,
  username    text unique,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Índices
create index profiles_name_idx     on public.profiles (name);
create index profiles_username_idx on public.profiles (username);

-- -----------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------
alter table public.profiles enable row level security;

-- Cada usuario solo puede ver y editar su propio perfil
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- El backend (service role) puede hacer todo sin restricción
-- (service role bypasses RLS por defecto)

-- -----------------------------------------------
-- TRIGGER: crear perfil automáticamente al registrarse
-- -----------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------
-- TRIGGER: updated_at automático
-- -----------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------
-- STORAGE: avatars
-- -----------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

create policy "Anyone can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- POSTS
-- ============================================================

-- -----------------------------------------------
-- POSTS
-- -----------------------------------------------
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  content        text not null,
  image_url      text,
  mood           text,
  mood_color     text,
  likes_count    int not null default 0,
  comments_count int not null default 0,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

create index posts_user_id_idx    on public.posts (user_id);
create index posts_created_at_idx on public.posts (created_at desc);

create trigger posts_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------
-- HASHTAGS
-- -----------------------------------------------
create table public.hashtags (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  posts_count int not null default 0,
  created_at  timestamptz default now() not null
);

create index hashtags_name_idx        on public.hashtags (name);
create index hashtags_posts_count_idx on public.hashtags (posts_count desc);

-- -----------------------------------------------
-- POST_HASHTAGS (junction)
-- -----------------------------------------------
create table public.post_hashtags (
  post_id    uuid not null references public.posts(id)    on delete cascade,
  hashtag_id uuid not null references public.hashtags(id) on delete cascade,
  primary key (post_id, hashtag_id)
);

-- -----------------------------------------------
-- POST_LIKES
-- -----------------------------------------------
create table public.post_likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (post_id, user_id)
);

create index post_likes_user_id_idx on public.post_likes (user_id);

-- -----------------------------------------------
-- POST_COMMENTS
-- -----------------------------------------------
create table public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id)    on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index post_comments_post_id_idx on public.post_comments (post_id);

create trigger post_comments_updated_at
  before update on public.post_comments
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------
-- TRIGGERS: mantener contadores automáticamente
-- -----------------------------------------------
create or replace function public.update_post_likes_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = OLD.post_id;
  end if;
  return null;
end;
$$;

create trigger post_likes_count_trigger
  after insert or delete on public.post_likes
  for each row execute function public.update_post_likes_count();

create or replace function public.update_post_comments_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = OLD.post_id;
  end if;
  return null;
end;
$$;

create trigger post_comments_count_trigger
  after insert or delete on public.post_comments
  for each row execute function public.update_post_comments_count();

create or replace function public.update_hashtag_posts_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.hashtags set posts_count = posts_count + 1 where id = NEW.hashtag_id;
  elsif TG_OP = 'DELETE' then
    update public.hashtags set posts_count = greatest(posts_count - 1, 0) where id = OLD.hashtag_id;
  end if;
  return null;
end;
$$;

create trigger post_hashtags_count_trigger
  after insert or delete on public.post_hashtags
  for each row execute function public.update_hashtag_posts_count();

-- -----------------------------------------------
-- ROW LEVEL SECURITY — posts
-- -----------------------------------------------
alter table public.posts         enable row level security;
alter table public.hashtags      enable row level security;
alter table public.post_hashtags enable row level security;
alter table public.post_likes    enable row level security;
alter table public.post_comments enable row level security;

create policy "Anyone can read posts"           on public.posts for select using (true);
create policy "Users can create posts"          on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own posts"      on public.posts for delete using (auth.uid() = user_id);

create policy "Anyone can read hashtags"        on public.hashtags      for select using (true);
create policy "Anyone can read post_hashtags"   on public.post_hashtags for select using (true);

create policy "Anyone can read likes"           on public.post_likes for select using (true);
create policy "Users can like posts"            on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike posts"          on public.post_likes for delete using (auth.uid() = user_id);

create policy "Anyone can read comments"        on public.post_comments for select using (true);
create policy "Users can comment"               on public.post_comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments"   on public.post_comments for delete using (auth.uid() = user_id);

-- -----------------------------------------------
-- STORAGE: imágenes de posts
-- -----------------------------------------------
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict do nothing;

create policy "Anyone can read post images"
  on storage.objects for select
  using (bucket_id = 'posts');

create policy "Users can upload post images"
  on storage.objects for insert
  with check (bucket_id = 'posts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own post images"
  on storage.objects for delete
  using (bucket_id = 'posts' and auth.uid()::text = (storage.foldername(name))[1]);

-- -----------------------------------------------
-- MIGRACIÓN: agregar username a profiles existentes
-- (ejecutar si la tabla ya existe sin la columna)
-- -----------------------------------------------
alter table public.profiles add column if not exists username text unique;
create index if not exists profiles_username_idx on public.profiles (username);
