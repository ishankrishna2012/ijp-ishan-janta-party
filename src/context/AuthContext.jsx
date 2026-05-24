import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { dbService } from '../services/db';
import { firebaseAuth } from '../firebaseClient';
import { sendPasswordResetEmail } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth State Listener
  useEffect(() => {
    let mounted = true;
    let profileSubscription = null;

    const setupProfileSubscription = (uid) => {
      if (profileSubscription) supabase.removeChannel(profileSubscription);
      
      profileSubscription = supabase.channel(`public:profiles:${uid}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${uid}` 
        }, (payload) => {
          if (mounted) {
            setUser(prev => prev ? { ...prev, ...payload.new } : prev);
          }
        })
        .subscribe();
    };

    const getInitialSession = async () => {
      try {
        const sessionRes = await dbService.getSession();
        if (sessionRes?.user && mounted) {
          const profile = await dbService.fetchProfile(sessionRes.user.id);
          setUser(profile ? { ...sessionRes.user, ...profile } : sessionRes.user);
          setupProfileSubscription(sessionRes.user.id);
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
        const profile = await dbService.fetchProfile(session.user.id);
        if (mounted) {
          setUser(profile ? { ...session.user, ...profile } : session.user);
          setLoading(false);
          setupProfileSubscription(session.user.id);
        }
      } else {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        if (profileSubscription) supabase.removeChannel(profileSubscription);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (profileSubscription) supabase.removeChannel(profileSubscription);
    };
  }, []);

  const generateUniqueIdFromDNo = (dNo) => {
    const digitsOnly = dNo.replace(/\D/g, '');
    const last5 = digitsOnly.slice(-5).padStart(5, '0');
    const currentYear = new Date().getFullYear();
    return `IJP-${currentYear}-${last5}`;
  };

  const signUpOperative = async ({ codename, email, password, section, dNo, idCardFile }) => {
    try {
      const uniqueId = generateUniqueIdFromDNo(dNo);

      // Check collision on Supabase
      const { data: idCheck } = await supabase
        .from('profiles')
        .select('unique_id')
        .eq('unique_id', uniqueId)
        .maybeSingle();

      if (idCheck) throw new Error(`D-Number collision: ID ${uniqueId} already exists.`);

      const { data: nameCheck } = await supabase
        .from('profiles')
        .select('codename')
        .eq('codename', codename)
        .maybeSingle();

      if (nameCheck) throw new Error(`Codename "${codename}" is already taken.`);

      // Use unified dbService to dual-write auth and profile
      const { id: newUserId } = await dbService.signUp({
        email,
        password,
        profileData: {
          codename,
          sector: 'g9',
          section,
          d_no: dNo,
          unique_id: uniqueId,
          role: 'student',
          email // save email for easy sign-in
        }
      });

      // Upload ID card to Supabase storage if possible
      if (idCardFile && newUserId) {
        const fileExt = idCardFile.name.split('.').pop().toLowerCase();
        const filePath = `${newUserId}/id-card.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('id-cards')
          .upload(filePath, idCardFile, { cacheControl: '3600', upsert: true });

        if (!uploadError) {
          await supabase.from('profiles').update({ id_card_url: filePath }).eq('id', newUserId);
        }
      }

      return { success: true, uniqueId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const signInOperative = async ({ loginIdentifier, password }) => {
    try {
      let email = loginIdentifier.trim();

      if (!email.includes('@')) {
        const uppercaseId = email.toUpperCase();
        // Try getting email from supabase first
        let { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('unique_id', uppercaseId)
          .maybeSingle();

        if (!profile) {
            throw new Error(`No registered operative found with ID: ${uppercaseId}`);
        }
        email = profile.email;
      }

      const res = await dbService.signIn({ email, password });
      if (res.user) {
        return { success: true, user: res.user };
      }
      throw new Error("Invalid credentials");
    } catch (err) {
      return { success: false, error: err.message || err.code }; // firebase throws err.code
    }
  };

  const signOutOperative = async () => {
    try {
      await dbService.signOut();
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Error signing out:', err.message);
    }
  };

  const resetPasswordOperative = async (email) => {
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      // also send firebase reset
      try {
        await sendPasswordResetEmail(firebaseAuth, email);
      } catch (e) {
        console.warn("Firebase password reset failed", e);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    loading,
    signUpOperative,
    signInOperative,
    signOutOperative,
    resetPasswordOperative,
    refreshUser: async () => {
      if (user?.id) {
        const profile = await dbService.fetchProfile(user.id);
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
