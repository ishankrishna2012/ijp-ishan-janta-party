import { supabase } from '../supabaseClient';
import { firebaseAuth, firebaseDb } from '../firebaseClient';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, setDoc, getDoc, collection, getDocs, addDoc, query, where, orderBy, updateDoc 
} from 'firebase/firestore';

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

// Security: Client-Side Rate Limiter & Protections
const RATE_LIMIT_MAX = 32767;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const enforceRateLimit = () => {
  try {
    const now = Date.now();
    let limitData = JSON.parse(localStorage.getItem('ijp_sec_limit') || '{"count":0,"windowStart":0}');
    
    if (now - limitData.windowStart > RATE_LIMIT_WINDOW_MS) {
      limitData = { count: 1, windowStart: now };
    } else {
      limitData.count += 1;
      if (limitData.count > RATE_LIMIT_MAX) {
        throw new Error(`SECURITY DIRECTIVE 429: Rate limit exceeded (${RATE_LIMIT_MAX} req / 5min). System locked.`);
      }
    }
    localStorage.setItem('ijp_sec_limit', JSON.stringify(limitData));
  } catch (e) {
    if (e.message.includes('SECURITY DIRECTIVE')) throw e;
  }
};

export const dbService = {
  async signUp({ email, password, profileData }) {
    enforceRateLimit();
    let uid = null;
    
    // 1. Try Supabase Auth
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: profileData }
      });
      if (error) throw error;
      uid = data.user.id;
    } catch (e) {
      console.warn("Supabase SignUp attempt 1 failed:", e);
    }

    // 2. Try Firebase Auth if Supabase failed
    let fbUid = null;
    if (!uid) {
      try {
        const fbCred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        fbUid = fbCred.user.uid;
        uid = fbUid;
      } catch (e) {
        console.warn("Firebase SignUp failed:", e);
        // 3. Try Supabase Auth AGAIN if Firebase failed
        try {
          const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: { data: profileData }
          });
          if (error) throw error;
          uid = data.user.id;
        } catch (retryError) {
          console.error("Supabase SignUp attempt 2 failed:", retryError);
          throw retryError; // Give the final Supabase error to the UI
        }
      }
    }

    const finalProfile = { ...profileData, id: uid };

    // Insert Profile to Firebase
    try {
      await setDoc(doc(firebaseDb, 'profiles', uid), finalProfile);
    } catch (e) {
      console.error("Firebase profile insert failed", e);
    }

    return { id: uid };
  },

  async signIn({ email, password }) {
    enforceRateLimit();
    // 1. Try Supabase first
    const sbRes1 = await trySupabase(supabase.auth.signInWithPassword({ email, password }));
    if (sbRes1.source === 'supabase') return sbRes1.data;

    // 2. Fallback to Firebase
    try {
      const fbCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { user: { id: fbCred.user.uid, email: fbCred.user.email } };
    } catch (e) {
      console.warn("Firebase SignIn failed:", e);
      // 3. Try Supabase again
      const sbRes2 = await trySupabase(supabase.auth.signInWithPassword({ email, password }));
      if (sbRes2.source === 'supabase') return sbRes2.data;
      throw sbRes2.error || e; // Throw the Supabase error (or fallback to firebase error)
    }
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
  },

  async fetchUsers() {
    const sbRes = await trySupabase(supabase.from('profiles').select('*').order('created_at', { ascending: false }));
    if (sbRes.source === 'supabase') return sbRes.data || [];
    const snap = await getDocs(query(collection(firebaseDb, 'profiles'), orderBy('created_at', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async updateProfileStatus(uid, updates) {
    try { await supabase.from('profiles').update(updates).eq('id', uid); } catch(e) {}
    try { await updateDoc(doc(firebaseDb, 'profiles', uid), updates); } catch(e) {}
  },

  async fetchMunitions(section) {
    const sbRes = await trySupabase(
      supabase.from('munitions').select('*').eq('section', section).order('created_at', { ascending: false })
    );
    if (sbRes.source === 'supabase') return sbRes.data || [];
    
    const snap = await getDocs(query(collection(firebaseDb, 'munitions'), where('section', '==', section), orderBy('created_at', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async insertMunition(data) {
    const payload = { ...data, created_at: new Date().toISOString() };
    let sbData = null;
    try {
      const res = await supabase.from('munitions').insert(payload).select().single();
      if (!res.error) sbData = res.data;
    } catch(e) {}
    try { await addDoc(collection(firebaseDb, 'munitions'), payload); } catch(e) {}
    return sbData || payload;
  },

  async fetchComplaints() {
    const sbRes = await trySupabase(supabase.from('complaints').select('*').order('created_at', { ascending: false }));
    if (sbRes.source === 'supabase') return sbRes.data || [];
    
    const snap = await getDocs(query(collection(firebaseDb, 'complaints'), orderBy('created_at', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async insertComplaint(data) {
    const payload = { ...data, created_at: new Date().toISOString(), status: 'PENDING' };
    try { await supabase.from('complaints').insert(payload); } catch(e) {}
    try { await addDoc(collection(firebaseDb, 'complaints'), payload); } catch(e) {}
  },

  async updateComplaintStatus(id, status) {
    try { await supabase.from('complaints').update({ status }).eq('id', id); } catch(e) {}
    try { await updateDoc(doc(firebaseDb, 'complaints', id.toString()), { status }); } catch(e) {}
  },

  async fetchChatMessages() {
    const sbRes = await trySupabase(supabase.from('chat_messages').select('*, profiles(codename)').order('created_at', { ascending: true }));
    if (sbRes.source === 'supabase') return sbRes.data || [];
    
    const snap = await getDocs(query(collection(firebaseDb, 'chat_messages'), orderBy('created_at', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async insertChatMessage(data) {
    const payload = { ...data, created_at: new Date().toISOString() };
    let sbData = null;
    try {
      const res = await supabase.from('chat_messages').insert(payload).select('*, profiles(codename)').single();
      if (!res.error) sbData = res.data;
    } catch(e) {}
    try { await addDoc(collection(firebaseDb, 'chat_messages'), payload); } catch(e) {}
    return sbData || payload;
  }
};
