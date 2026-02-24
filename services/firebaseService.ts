import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User
} from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import type { UserStats, Flashcard } from '../types';

interface CloudPayload {
  stats?: UserStats;
  flashcards?: {
    items: Flashcard[];
    updatedAt: number;
  };
  updatedAt: number;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let appInitialized = false;

const ensureApp = () => {
  if (!isConfigured) return null;
  if (!appInitialized) {
    if (getApps().length === 0) {
      initializeApp(firebaseConfig);
    }
    appInitialized = true;
  }
  return getApps()[0] || null;
};

const getClients = () => {
  const app = ensureApp();
  if (!app) return null;
  return {
    auth: getAuth(app),
    db: getFirestore(app)
  };
};

export const isFirebaseEnabled = () => isConfigured;

export const observeAuth = (callback: (user: User | null) => void) => {
  const clients = getClients();
  if (!clients) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(clients.auth, callback);
};

export const signInWithGoogle = async () => {
  const clients = getClients();
  if (!clients) return null;
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(clients.auth, provider);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string })?.code || '';
    const popupRelated =
      code.includes('popup-blocked') ||
      code.includes('popup-closed-by-user') ||
      code.includes('cancelled-popup-request') ||
      code.includes('operation-not-supported-in-this-environment');

    if (popupRelated) {
      await signInWithRedirect(clients.auth, provider);
      return null;
    }

    throw error;
  }
};

export const consumeRedirectSignIn = async () => {
  const clients = getClients();
  if (!clients) return null;
  try {
    const result = await getRedirectResult(clients.auth);
    return result?.user ?? null;
  } catch {
    return null;
  }
};

export const signOutFirebase = async () => {
  const clients = getClients();
  if (!clients) return;
  await signOut(clients.auth);
};

export const fetchCloudPayload = async (uid: string): Promise<CloudPayload | null> => {
  const clients = getClients();
  if (!clients) return null;
  const ref = doc(clients.db, 'users', uid, 'app', 'maturaexpert');
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as CloudPayload;
  return data;
};

export const saveCloudPayload = async (uid: string, payload: CloudPayload) => {
  const clients = getClients();
  if (!clients) return;
  const ref = doc(clients.db, 'users', uid, 'app', 'maturaexpert');
  await setDoc(ref, { ...payload, updatedAt: Date.now() }, { merge: true });
};
