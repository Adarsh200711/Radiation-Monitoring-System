import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import type { Profile, UserRole } from '@/types';

export interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole,
  ) => Promise<{ error: string | null }>;
  demoSignIn: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_USERS: Record<UserRole, { email: string; full_name: string; phone: string }> = {
  admin: {
    email: 'admin@nuclear.gov',
    full_name: 'James Carter (Admin)',
    phone: '555-0101',
  },
  safety_officer: {
    email: 'safety@nuclear.gov',
    full_name: 'Sarah Mitchell (Safety Officer)',
    phone: '555-0102',
  },
  employee: {
    email: 'operator@nuclear.gov',
    full_name: 'Maria Rodriguez (Operator)',
    phone: '555-0104',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string, currentSession?: Session | null) => {
    const cached = db.getSavedProfile(userId);
    if (cached) {
      setProfile(cached);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        const p = data as Profile;
        setProfile(p);
        db.saveProfile(p);
        return;
      }
    } catch {
      // Ignore RLS policy recursion errors
    }

    const meta = currentSession?.user?.user_metadata || session?.user?.user_metadata;
    if (meta) {
      const fallbackProfile: Profile = {
        id: userId,
        full_name: meta.full_name || meta.name || 'System User',
        phone: meta.phone || null,
        role: (meta.role as UserRole) || 'admin',
        created_at: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
      db.saveProfile(fallbackProfile);
    } else if (!cached) {
      const defaultProf: Profile = {
        id: userId,
        full_name: 'James Carter',
        phone: '555-0101',
        role: 'admin',
        created_at: new Date().toISOString(),
      };
      setProfile(defaultProf);
      db.saveProfile(defaultProf);
    }
  }, []);

  useEffect(() => {
    const demoRole = localStorage.getItem('radsafe_demo_role') as UserRole | null;
    if (demoRole && DEMO_USERS[demoRole]) {
      const demo = DEMO_USERS[demoRole];
      const demoProf: Profile = {
        id: 'demo-' + demoRole,
        full_name: demo.full_name,
        phone: demo.phone,
        role: demoRole,
        created_at: new Date().toISOString(),
      };
      const mockSession = {
        access_token: 'demo-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'demo-refresh',
        user: {
          id: 'demo-' + demoRole,
          app_metadata: {},
          user_metadata: { full_name: demo.full_name, role: demoRole },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: demo.email,
        },
      } as unknown as Session;

      setSession(mockSession);
      setProfile(demoProf);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id, data.session).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          loadProfile(newSession.user.id, newSession);
        } else {
          const currentDemo = localStorage.getItem('radsafe_demo_role') as UserRole | null;
          if (!currentDemo) {
            setProfile(null);
          }
        }
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, [loadProfile]);

  async function signIn(email: string, password: string) {
    localStorage.removeItem('radsafe_demo_role');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      const matchRole = (Object.keys(DEMO_USERS) as UserRole[]).find(
        (r) => DEMO_USERS[r].email.toLowerCase() === email.toLowerCase(),
      );
      if (matchRole) {
        await demoSignIn(matchRole);
        return { error: null };
      }
      return { error: error.message };
    }
    if (data.session) {
      setSession(data.session);
      await loadProfile(data.session.user.id, data.session);
    }
    return { error: null };
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'employee',
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) {
      return { error: error.message };
    }
    if (data.session) {
      setSession(data.session);
      const newProf: Profile = {
        id: data.session.user.id,
        full_name: fullName,
        phone: null,
        role,
        created_at: new Date().toISOString(),
      };
      setProfile(newProf);
      db.saveProfile(newProf);
    }
    return { error: null };
  }

  async function demoSignIn(role: UserRole) {
    const demo = DEMO_USERS[role];
    localStorage.setItem('radsafe_demo_role', role);
    const demoProf: Profile = {
      id: 'demo-' + role,
      full_name: demo.full_name,
      phone: demo.phone,
      role,
      created_at: new Date().toISOString(),
    };
    const mockSession = {
      access_token: 'demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'demo-refresh',
      user: {
        id: 'demo-' + role,
        app_metadata: {},
        user_metadata: { full_name: demo.full_name, role },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: demo.email,
      },
    } as unknown as Session;

    setSession(mockSession);
    setProfile(demoProf);
    db.saveProfile(demoProf);
  }

  async function signOut() {
    localStorage.removeItem('radsafe_demo_role');
    try {
      await supabase.auth.signOut();
    } catch {
      //
    }
    setProfile(null);
    setSession(null);
  }

  async function refreshProfile() {
    if (session) {
      await loadProfile(session.user.id, session);
    }
  }

  async function updateCurrentProfile(updates: Partial<Profile>) {
    if (!profile) return;
    const updated: Profile = { ...profile, ...updates };
    setProfile(updated);
    db.saveProfile(updated);
    try {
      await supabase.from('profiles').update(updates).eq('id', profile.id);
    } catch {
      //
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signIn,
        signUp,
        demoSignIn,
        signOut,
        refreshProfile,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
