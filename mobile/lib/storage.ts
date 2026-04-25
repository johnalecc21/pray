import { supabase } from './supabase';

const BUCKET = 'avatars';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

/**
 * Uploads a local image URI to Supabase Storage.
 * Uses FormData + direct REST call — the only reliable method in React Native
 * for file:// URIs (fetch().blob() no funciona correctamente en RN).
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg';
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const filePath = `${userId}/${Date.now()}.${ext}`;

  // Get current user access token
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('No active session');

  // FormData with file URI — works natively in React Native
  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: `avatar.${ext}`,
    type: mime,
  } as unknown as Blob);

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filePath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-upsert': 'true',
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? `Upload failed (${response.status})`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function deleteAvatar(publicUrl: string): Promise<void> {
  try {
    const parts = publicUrl.split(`/object/public/${BUCKET}/`);
    if (parts.length < 2) return;
    await supabase.storage.from(BUCKET).remove([parts[1]]);
  } catch {
    // best-effort
  }
}
