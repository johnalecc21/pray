import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

const BUCKET = 'avatars';

export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg';
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const filePath = `${userId}/${Date.now()}.${ext}`;

  // Read file as base64 then convert to Uint8Array
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: 'base64' as any,
  });

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, bytes, {
    contentType: mime,
    upsert: true,
  });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return urlData.publicUrl;
}

export async function deleteAvatar(publicUrl: string): Promise<void> {
  try {
    const parts = publicUrl.split(`/object/public/${BUCKET}/`);
    if (parts.length < 2) return;
    await supabase.storage.from(BUCKET).remove([parts[1]]);
  } catch {}
}
