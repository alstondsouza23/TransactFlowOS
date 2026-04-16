// ─────────────────────────────────────────────────────────────────
//  Firebase configuration — reads from environment variables.
//
//  Keys are stored in .env (gitignored — never committed to GitHub).
//  See .env.example for the required variable names.
//
//  Vite exposes only variables prefixed with VITE_ to the browser.
// ─────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
    "🔥 Firebase API Key is missing! \n" +
    "If you're seeing a blank screen on Vercel, please add your environment variables " +
    "in the Vercel Dashboard -> Settings -> Environment Variables."
  );
}

const app = initializeApp(firebaseConfig);

/** Firebase Auth instance — import this wherever you need auth methods. */
export const auth = getAuth(app);

export default app;
