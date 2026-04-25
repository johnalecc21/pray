import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import {
  uploadAvatar, uploadCover, uploadPhoto, deleteByUrl,
} from '../../../lib/storage';
import type { UserProfile, ProfileUpdate } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<UserProfile>('/users/me');
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function getUserId() {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  }

  async function update(changes: ProfileUpdate, newAvatarUri?: string) {
    setSaving(true);
    try {
      const final = { ...changes };
      if (newAvatarUri) {
        const userId = await getUserId();
        if (userId) {
          if (profile?.avatar_url) await deleteByUrl(profile.avatar_url);
          final.avatar_url = await uploadAvatar(userId, newAvatarUri);
        }
      }
      await api.put('/users/profile', final);
      setProfile((prev) => (prev ? { ...prev, ...final } : prev));
    } finally {
      setSaving(false);
    }
  }

  async function changeAvatar(localUri: string) {
    setSaving(true);
    try {
      const userId = await getUserId();
      if (!userId) return;
      if (profile?.avatar_url) await deleteByUrl(profile.avatar_url);
      const avatar_url = await uploadAvatar(userId, localUri);
      await api.put('/users/profile', { avatar_url });
      setProfile((prev) => (prev ? { ...prev, avatar_url } : prev));
    } finally {
      setSaving(false);
    }
  }

  async function changeCover(localUri: string) {
    setSaving(true);
    try {
      const userId = await getUserId();
      if (!userId) return;
      if (profile?.cover_url) await deleteByUrl(profile.cover_url);
      const cover_url = await uploadCover(userId, localUri);
      await api.put('/users/profile', { cover_url });
      setProfile((prev) => (prev ? { ...prev, cover_url } : prev));
    } finally {
      setSaving(false);
    }
  }

  async function addPhoto(localUri: string) {
    setSaving(true);
    try {
      const userId = await getUserId();
      if (!userId) return;
      const url    = await uploadPhoto(userId, localUri);
      const photos = [...(profile?.photos ?? []), url];
      await api.put('/users/profile', { photos });
      setProfile((prev) => (prev ? { ...prev, photos } : prev));
    } finally {
      setSaving(false);
    }
  }

  async function removeAvatar() {
    setSaving(true);
    try {
      if (profile?.avatar_url) await deleteByUrl(profile.avatar_url);
      await api.put('/users/profile', { avatar_url: null });
      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev));
    } finally {
      setSaving(false);
    }
  }

  async function removeCover() {
    setSaving(true);
    try {
      if (profile?.cover_url) await deleteByUrl(profile.cover_url);
      await api.put('/users/profile', { cover_url: null });
      setProfile((prev) => (prev ? { ...prev, cover_url: null } : prev));
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto(url: string) {
    setSaving(true);
    try {
      await deleteByUrl(url);
      const photos = (profile?.photos ?? []).filter((p) => p !== url);
      await api.put('/users/profile', { photos });
      setProfile((prev) => (prev ? { ...prev, photos } : prev));
    } finally {
      setSaving(false);
    }
  }

  return {
    profile, loading, saving, error,
    refetch: load,
    update, changeAvatar, changeCover,
    removeAvatar, removeCover,
    addPhoto, removePhoto,
  };
}
