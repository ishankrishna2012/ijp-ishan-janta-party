import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Fetch user profile from public.profiles
  const fetchProfile = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching user profile:', err.message);
      return null;
    }
  };

  // Auth State Listener
  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile ? { ...session.user, ...profile } : session.user);
        }
      } catch (err) {
        console.error('Session fetching error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        if (mounted) {
          setUser(profile ? { ...session.user, ...profile } : session.user);
          setLoading(false);
        }
      } else {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 1. Sign Up Operative
  const signUpOperative = async ({ codename, email, password, sector }) => {
    try {
      // Collision-resistant Unique ID generation: IJP-2026-XXXX
      let uniqueId = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
        uniqueId = `IJP-2026-${randomNum}`;

        // Query profiles to check if unique_id exists
        const { data } = await supabase
          .from('profiles')
          .select('unique_id')
          .eq('unique_id', uniqueId)
          .maybeSingle();

        if (!data) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate a unique Operative ID. Please try again.');
      }

      // Check if username/codename is already taken
      const { data: nameCheck } = await supabase
        .from('profiles')
        .select('codename')
        .eq('codename', codename)
        .maybeSingle();

      if (nameCheck) {
        throw new Error(`Codename "${codename}" is already taken by another operative.`);
      }

      // Sign up in Supabase Auth
      // Role defaults to 'student'
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            codename,
            sector,
            unique_id: uniqueId,
            role: 'student',
          },
        },
      });

      if (authError) throw authError;
      return { success: true, uniqueId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 2. Sign In Operative (accepts email OR Unique ID e.g. IJP-2026-4829)
  const signInOperative = async ({ loginIdentifier, password }) => {
    try {
      let email = loginIdentifier.trim();

      // If it doesn't look like an email, treat as Unique Operative ID
      if (!email.includes('@')) {
        const uppercaseId = email.toUpperCase();
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('email')
          .eq('unique_id', uppercaseId)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profile) {
          throw new Error(`No registered operative found with ID: ${uppercaseId}`);
        }
        email = profile.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 3. Sign Out Operative
  const signOutOperative = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err.message);
    }
  };

  const value = {
    user,
    loading,
    signUpOperative,
    signInOperative,
    signOutOperative,
    refreshUser: async () => {
      if (user?.id) {
        const profile = await fetchProfile(user.id);
        setUser(prev => profile ? { ...prev, ...profile } : prev);
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
