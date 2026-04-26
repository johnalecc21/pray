import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getFreshToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;

  // Refresh proactively if token expires in less than 60 seconds
  const expiresAt = session.expires_at ?? 0; // Unix timestamp in seconds
  const nowSec    = Math.floor(Date.now() / 1000);
  if (expiresAt - nowSec < 60) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session) return null;
    return refreshed.session.access_token;
  }

  return session.access_token;
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = await getFreshToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });

  // On 401: force-refresh token and retry once
  if (res.status === 401 && !isRetry) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session) {
      return request<T>(path, options, true);
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export const api = {
  get:    <T>(path: string)                  => request<T>(path),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)   => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
};
