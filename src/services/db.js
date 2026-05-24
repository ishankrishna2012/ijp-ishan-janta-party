import { supabase } from '../supabaseClient';
import { firebaseAuth, firebaseDb } from '../firebaseClient';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';

// Helper to determine if we should fallback
const trySupabase = async (supabasePromise) => {
  try {
    const res = await Promise.race([
      supabasePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('SUPABASE_TIMEOUT')), 5000))
    ]);
    if (res && res.error) throw res.error;
    return { data: res?.data, error: null, source: 'supabase' };
  } catch (error) {
    console.warn("Supabase failed, failing over to Firebase:", error);
    return { data: null, error, source: 'firebase_fallback' };
  }
};

export const dbService = {
  async signUp({ email, password, profileData }) {
    let uid = null;
    let authError = null;
    
    // 1. Try Supabase Auth
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: profileData // This triggers Supabase backend to insert the profile
        }
      });
      if (error) throw error;
      uid = data.user.id;
    } catch (e) {
      authError = e;
    }

    // 2. Try Firebase Auth
    let fbUid = null;
    try {
      const fbCred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      fbUid = fbCred.user.uid;
      // If Supabase failed, we'll use Firebase UID
      if (!uid) uid = fbUid;
    } catch (e) {
      if (!uid) throw e; // Both failed
    }

    const finalProfile = { ...profileData, id: uid };

    // 3. Insert Profile to Firebase
    try {
      await setDoc(doc(firebaseDb, 'profiles', uid), finalProfile);
    } catch (e) {
      console.error("Firebase profile insert failed", e);
    }

    if (authError && !fbUid) throw authError;
    return { id: uid };
  },

  async signIn({ email, password }) {
    // Try Supabase first
    const sbRes = await trySupabase(supabase.auth.signInWithPassword({ email, password }));
    if (sbRes.source === 'supabase') return sbRes.data;

    // Fallback to Firebase
    const fbCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return { user: { id: fbCred.user.uid, email: fbCred.user.email } };
  },

  async signOut() {
    await supabase.auth.signOut();
    await fbSignOut(firebaseAuth);
    // Clear local cache
    localStorage.removeItem('cached_profile');
  },

  async getSession() {
    // Try Supabase
    const { data, error } = await supabase.auth.getSession();
    if (data?.session) return { user: data.session.user };

    // Fallback to Firebase (it might take a moment to initialize)
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        unsubscribe();
        if (user) resolve({ user: { id: user.uid, email: user.email } });
        else resolve({ user: null });
      });
    });
  },

  async fetchProfile(uid) {
    // Check Cache for blazing fast load
    const cached = localStorage.getItem(`cached_profile_${uid}`);
    if (cached) return JSON.parse(cached);

    const sbRes = await trySupabase(supabase.from('profiles').select('*').eq('id', uid).single());
    if (sbRes.source === 'supabase' && sbRes.data) {
      localStorage.setItem(`cached_profile_${uid}`, JSON.stringify(sbRes.data));
      return sbRes.data;
    }

    // Fallback to Firebase
    const fbDoc = await getDoc(doc(firebaseDb, 'profiles', uid));
    if (fbDoc.exists()) {
      const data = fbDoc.data();
      localStorage.setItem(`cached_profile_${uid}`, JSON.stringify(data));
      return data;
    }
    return null;
  }
};
