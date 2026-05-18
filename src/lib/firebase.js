// Firebase initialization. Reads config from Vite env vars so the same build
// works across dev/staging/prod by swapping .env files.
//
// If no config is supplied (e.g. first-run before the user has filled in
// .env.local), we fall back to a stub that lets the rest of the app render
// without auth — favorites become a no-op.

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'liamlaboratory.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'liamlaboratory',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MSG_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.appId);

let app = null;
let auth = null;
let db = null;
let provider = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  provider = new GoogleAuthProvider();
}

export { app, auth, db, provider };
