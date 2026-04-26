import { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

type User = { id: string; email: string; name: string };

type Session = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Manage auto-refresh based on app foreground/background state (Supabase RN recommendation)
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.access_token) {
        try {
          const me = await api.get<User>('/users/me');
          setUser(me);
        } catch {
          await supabase.auth.signOut();
          setUser(null);
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null);
    });

    return () => {
      appStateSub.remove();
      listener.subscription.unsubscribe();
    };
  }, []);

  async function register(name: string, email: string, password: string) {
    const data = await api.post<{ user: User; session: Session }>('/auth/register', {
      name,
      email,
      password,
    });
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    setUser(data.user);
  }

  async function login(email: string, password: string) {
    const data = await api.post<{ user: User; session: Session }>('/auth/login', {
      email,
      password,
    });
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    setUser(data.user);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
