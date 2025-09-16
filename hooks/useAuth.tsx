
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User as AppUser, UserRole } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (details: { name: string, email: string, password: string, phone: string, role: UserRole }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (session: Session | null): Promise<AppUser | null> => {
    if (!session?.user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error(`Profile fetch failed, which may be expected: ${error.message}`);
      return null;
    }
    
    if (profile) {
      // Defensive fallbacks to prevent crashes from incomplete data
      return {
        id: session.user.id,
        email: session.user.email || '',
        name: profile.name || 'No Name',
        phone: profile.phone || 'N/A',
        role: profile.role || UserRole.Engineer,
        avatarUrl: profile.avatar_url || '',
        status: profile.status || 'Inactive',
      };
    }
    
    return null;
  };

  useEffect(() => {
    setLoading(true); // Ensure loading is true at the start of any check.

    // onAuthStateChange is the single source of truth.
    // It fires once on initial load, and again whenever the auth state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const appUser = await fetchUserProfile(session);
        setUser(appUser);
        // This is the crucial part: after the first check is complete
        // (whether a user is found or not), we can consider the app loaded.
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const login = async (email: string, password = 'password') => {
    // FIX: Reverted to `signInWithPassword`, which is the correct method for Supabase JS v2.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error('Error logging in:', error);
        if (error.message.includes('Invalid login credentials')) {
          alert('Login failed: Invalid email or password. Please ensure the test users have been created in your Supabase dashboard with the password "password".');
        } else {
          alert(`Login failed: ${error.message}`);
        }
        throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
     if (error) {
        console.error('Error logging out:', error.message);
    }
  };

  const signUp = async (details: { name: string, email: string, password: string, phone: string, role: UserRole }) => {
    const { name, email, password, phone, role } = details;
    
    // A clean, default SVG placeholder for new users.
    const defaultAvatarSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"/></svg>';
    const defaultAvatarUrl = `data:image/svg+xml;base64,${btoa(defaultAvatarSvg)}`;

    // FIX: Corrected `signUp` call to use the `options` object for metadata, per Supabase JS v2 docs.
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
              name,
              phone,
              role,
              avatar_url: defaultAvatarUrl
            }
        }
    });

    if (error) {
      console.error('Error signing up:', error);
      alert(`Signup failed: ${error.message}`);
      throw error;
    }

    if (!data.session) {
      alert('Sign up successful! Please check your email to confirm your account before logging in.');
    }
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const appUser = await fetchUserProfile(session);
    setUser(appUser);
  };

  const value = useMemo(() => ({ user, loading, login, logout, signUp, refreshUser }), [user, loading]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
