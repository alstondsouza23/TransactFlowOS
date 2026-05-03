// ─────────────────────────────────────────────────────────────────
//  Firebase initialisation — Client web app
//
//  Same Firebase project as Employee_Admin-Desktop.
//  Keys are read from VITE_* environment variables (.env).
// ─────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth }       from 'firebase/auth';
import { getFirestore }  from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.warn(
    '🔥 Firebase API Key is missing!\n' +
    'Make sure Client/.env has all VITE_FIREBASE_* variables set.'
  );
}

const app = initializeApp(firebaseConfig);

/** Firebase Auth instance */
export const auth = getAuth(app);

/** Firestore instance */
export const db = getFirestore(app);

export default app;
