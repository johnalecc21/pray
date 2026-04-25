import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { uploadAvatar, deleteAvatar } from '../../../lib/storage';
import type { UserProfile, ProfileUpdate } from '../types';

export function useProfile() {
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState<string | null>(null);

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

  async function update(changes: ProfileUpdate, newAvatarUri?: string) {
    setSaving(true);
    try {
      const finalChanges = { ...changes };

      if (newAvatarUri) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (userId) {
          if (profile?.avatar_url) await deleteAvatar(profile.avatar_url);
          finalChanges.avatar_url = await uploadAvatar(userId, newAvatarUri);
        }
      }

      await api.put('/users/profile', finalChanges);
      setProfile((prev) => (prev ? { ...prev, ...finalChanges } : prev));
    } finally {
      setSaving(false);
    }
  }

  return { profile, loading, saving, error, refetch: load, update };
}
