import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';
import { supabase, ensureSession } from './supabaseClient';
import { User as AppUser, UserRole } from '../../types';
import { Session } from '@supabase/supabase-js';
import SplashScreen from '../../components/SplashScreen';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (details: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthGate: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [booted, setBooted] = useState(false);

  // --- Profile fetcher ---
  const fetchUserProfile = async (session: Session | null): Promise<AppUser | null> => {
    if (!session?.user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('[Auth] Failed to fetch profile:', error.message);
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: profile.name || 'No Name',
      phone: profile.phone || 'N/A',
      role: profile.role || UserRole.Engineer,
      avatarUrl: profile.avatar_url || '',
      status: profile.status || 'Inactive',
    };
  };

  // --- Session bootstrap + listeners ---
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        const session = await ensureSession();
        if (mounted) {
          const appUser = await fetchUserProfile(session);
          setUser(appUser);
        }
      } catch (err) {
        console.error('[Auth] Init session failed:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setBooted(true); // mark first load complete
        }
      }
    };

    init();

    // Listen for auth changes (login/logout/refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const appUser = await fetchUserProfile(session);
          if (mounted) setUser(appUser);
        } catch (err) {
          console.error('[Auth] Auth state change error:', err);
          if (mounted) setUser(null);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    // Cross-tab sync
    const channel = new BroadcastChannel('auth');
    channel.onmessage = (msg) => {
      if (msg.data === 'refresh') {
        init();
      }
    };

    // Force session refresh on resume
    const handleResume = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Auth] Session refresh failed:', error.message);
          setUser(null);
          return;
        }
        if (data.session) {
          const appUser = await fetchUserProfile(data.session);
          setUser(appUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('[Auth] Resume check error:', err);
        setUser(null);
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleResume();
      }
    });
    window.addEventListener('focus', handleResume);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      channel.close();
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, []);

  // --- Auth actions ---
  const login = async (email: string, password = 'password') => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[Auth] Login error:', error.message);
      alert(`Login failed: ${error.message}`);
      throw error;
    }
    new BroadcastChannel('auth').postMessage('refresh');
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Auth] Logout error:', error.message);
    }
    new BroadcastChannel('auth').postMessage('refresh');
  };

  const signUp = async (details: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
  }) => {
    const { name, email, password, phone, role } = details;

    const defaultAvatarSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"/></svg>';
    const defaultAvatarUrl = `data:image/svg+xml;base64,${btoa(defaultAvatarSvg)}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role, avatar_url: defaultAvatarUrl },
      },
    });

    if (error) {
      console.error('[Auth] Signup error:', error.message);
      alert(`Signup failed: ${error.message}`);
      throw error;
    }

    if (!data.session) {
      alert('Sign up successful! Please check your email to confirm your account before logging in.');
    }

    new BroadcastChannel('auth').postMessage('refresh');
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const appUser = await fetchUserProfile(session);
    setUser(appUser);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, signUp, refreshUser }),
    [user, loading]
  );

  // --- Boot splash logic ---
  if (!booted) {
    return <SplashScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthGate');
  }
  return context;
};