import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isDemo } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_USER: User = {
  id: 'demo-admin-00000000-0000-0000-0000-000000000000',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'admin@wablast.demo',
  app_metadata: { provider: 'email' },
  user_metadata: { full_name: 'Admin Demo' },
  created_at: new Date().toISOString(),
} as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap — check existing session or auto-login in demo mode
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (isDemo) {
        const demoAuth = localStorage.getItem('wablast_demo_auth');
        if (demoAuth === 'true') {
          setUser(DEMO_USER);
        } else {
          setUser(null);
        }
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }

    init();

    // Listen for auth changes (login / logout / token refresh)
    if (!isDemo) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!cancelled) setUser(session?.user ?? null);
      });

      return () => {
        cancelled = true;
        subscription.unsubscribe();
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isDemo) {
      localStorage.setItem('wablast_demo_auth', 'true');
      setUser(DEMO_USER);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (isDemo) {
      localStorage.removeItem('wablast_demo_auth');
      setUser(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
