import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabase';
import { api } from './api';

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google' | 'facebook';

type AuthResponse = {
  user: { id: string; email: string; name: string };
  session: { access_token: string; refresh_token: string; expires_at: number };
};

export async function signInWithProvider(provider: OAuthProvider): Promise<AuthResponse> {
  const redirectTo = AuthSession.makeRedirectUri({ scheme: 'charco', path: 'auth-callback' });

  // Get OAuth URL from backend
  const { url } = await api.get<{ url: string }>(`/auth/oauth/url/${provider}`);

  const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
  if (result.type !== 'success') throw new Error('OAuth cancelled');

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('No code returned from OAuth');

  // Exchange code via backend
  const data = await api.post<AuthResponse>('/auth/oauth/exchange', { code });

  // Store session in Supabase client
  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  return data;
}

export async function signInWithApple(): Promise<AuthResponse> {
  const AppleAuth = await import('expo-apple-authentication');

  const credential = await AppleAuth.signInAsync({
    requestedScopes: [
      AppleAuth.AppleAuthenticationScope.FULL_NAME,
      AppleAuth.AppleAuthenticationScope.EMAIL,
    ],
  });

  const name = credential.fullName
    ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim()
    : undefined;

  const data = await api.post<AuthResponse>('/auth/oauth/apple', {
    identity_token: credential.identityToken,
    name,
  });

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  return data;
}
