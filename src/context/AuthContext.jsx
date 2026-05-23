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

  // Generate Unique ID from D-Number: IJP-2026-XXXXX (last 5 digits, zero-padded)
  const generateUniqueIdFromDNo = (dNo) => {
    // Extract only digits from the D-Number
    const digitsOnly = dNo.replace(/\D/g, '');
    // Take last 5 digits, pad with leading zeros if fewer than 5
    const last5 = digitsOnly.slice(-5).padStart(5, '0');
    const currentYear = new Date().getFullYear();
    return `IJP-${currentYear}-${last5}`;
  };

  // 1. Sign Up Operative (PRODUCTION)
  const signUpOperative = async ({ codename, email, password, section, dNo, idCardFile }) => {
    try {
      // Generate unique ID from D-Number
      const uniqueId = generateUniqueIdFromDNo(dNo);

      // Check if unique_id already exists (D-Number collision)
      const { data: idCheck } = await supabase
        .from('profiles')
        .select('unique_id')
        .eq('unique_id', uniqueId)
        .maybeSingle();

      if (idCheck) {
        throw new Error(`D-Number collision: An operative with ID ${uniqueId} already exists. Contact the Directorate.`);
      }

      // Check if codename is already taken
      const { data: nameCheck } = await supabase
        .from('profiles')
        .select('codename')
        .eq('codename', codename)
        .maybeSingle();

      if (nameCheck) {
        throw new Error(`Codename "${codename}" is already taken by another operative.`);
      }

      // Sign up in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            codename,
            sector: 'g9',
            section,
            d_no: dNo,
            unique_id: uniqueId,
            role: 'student',
          },
        },
      });

      if (authError) throw authError;

      // Upload ID card if provided
      let idCardUrl = null;
      if (idCardFile && authData.user) {
        const fileExt = idCardFile.name.split('.').pop().toLowerCase();
        const filePath = `${authData.user.id}/id-card.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('id-cards')
          .upload(filePath, idCardFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.warn('ID card upload failed:', uploadError.message);
          // Don't block signup if upload fails
        } else {
          // Store the path (not signed URL) — admin will generate signed URLs to view
          idCardUrl = filePath;

          // Update the profile with the id_card_url
          // (the trigger already created the profile, so we update it)
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ id_card_url: idCardUrl })
            .eq('id', authData.user.id);

          if (updateError) {
            console.warn('Failed to update profile with ID card URL:', updateError.message);
          }
        }
      }

      return { success: true, uniqueId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 2. Sign In Operative (accepts email OR Unique ID e.g. IJP-2026-48290)
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
