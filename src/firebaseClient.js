import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "ijp-directorate-2026",
  appId: "1:455480890977:web:2fb4a38a185fc206d13c20",
  storageBucket: "ijp-directorate-2026.firebasestorage.app",
  apiKey: "AIzaSyDH3KLcBH8Y0QNLJWiIegnq9f2Hjt-CIkM",
  authDomain: "ijp-directorate-2026.firebaseapp.com",
  messagingSenderId: "455480890977",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const firebaseDb = getFirestore(app);
export const firebaseStorage = getStorage(app);
