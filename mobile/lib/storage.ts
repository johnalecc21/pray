import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

const BUCKET = 'avatars';

async function uploadFile(path: string, localUri: string): Promise<string> {
  const ext  = localUri.split('.').pop()?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg';
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' as any });
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: mime,
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const ext  = localUri.split('.').pop()?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg';
  return uploadFile(`${userId}/avatar/${Date.now()}.${ext}`, localUri);
}

export async function uploadCover(userId: string, localUri: string): Promise<string> {
  const ext  = localUri.split('.').pop()?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg';
  return uploadFile(`${userId}/cover/${Date.now()}.${ext}`, localUri);
}

export async function uploadPhoto(userId: string, localUri: string): Promise<string> {
  const ext  = localUri.split('.').pop()?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg';
  return uploadFile(`${userId}/photos/${Date.now()}.${ext}`, localUri);
}

export async function deleteByUrl(publicUrl: string): Promise<void> {
  try {
    const marker = `/object/public/${BUCKET}/`;
    const parts  = publicUrl.split(marker);
    if (parts.length < 2) return;
    await supabase.storage.from(BUCKET).remove([parts[1]]);
  } catch {}
}

/** @deprecated use deleteByUrl */
export const deleteAvatar = deleteByUrl;
