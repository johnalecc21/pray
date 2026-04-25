import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

const BUCKET = 'avatars';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

/**
 * Uploads a local image URI to Supabase Storage using FileSystem.uploadAsync —
 * the only method that works reliably with file:// URIs in Expo/React Native.
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg';
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const filePath = `${userId}/${Date.now()}.${ext}`;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('Sin sesión activa');

  const endpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filePath}`;

  const result = await FileSystem.uploadAsync(endpoint, localUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: mime,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-upsert': 'true',
    },
  });

  if (result.status !== 200 && result.status !== 201) {
    const body = JSON.parse(result.body || '{}');
    throw new Error(body.message ?? `Upload falló (${result.status})`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
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
