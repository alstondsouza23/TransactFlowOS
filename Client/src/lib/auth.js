// ─────────────────────────────────────────────────────────────────
//  auth.js — Client authentication logic
//
//  Exports:
//    loginWithEmail(email, password)  — sign in + blocklist check + Firestore write
//    setupAuthListener()              — call once from AuthProvider on mount
// ─────────────────────────────────────────────────────────────────
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db }    from './firebase';
import useAuthStore    from '../store/authStore';

// ── UID blocklist ────────────────────────────────────────────────
// These two UIDs belong exclusively to the Employee/Admin desktop app.
// Anyone authenticating with them on the web client is immediately
// signed out and shown an access-denied error.
const BLOCKED_UIDS = new Set([
  't5NfFm9NfOhgWpDHQg7C5LlYe4q1',   // admin@ac.in
  'LSGBwob5COY39I7wuQZSJUHlWaY2',    // employee@ac.in
]);

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Derive a fallback display name from an email address.
 * e.g. john.doe@gmail.com → "john.doe"
 */
function emailPrefix(email) {
  const prefix = email.split('@')[0];
  return prefix
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
    .join(' ');
}

/**
 * Write (or merge-update) the user record in Firestore.
 * For BRAND NEW users (first ever login), also seeds kycStatus, userType,
 * and groupId so they appear in the employee KYC queue immediately.
 * Uses merge:true so we never overwrite fields we don't own on subsequent logins.
 */
async function persistSession(uid, name, email) {
  const docRef = doc(db, 'users', uid);

  // Check if the document already exists before writing
  let isNewUser = false;
  try {
    const existing = await getDoc(docRef);
    isNewUser = !existing.exists();
  } catch { /* if the read fails, default to merge-only write */ }

  const payload = {
    name,
    email,
    lastLogin: new Date().toISOString(),
  };

  // Only set KYC seed fields for brand-new accounts
  if (isNewUser) {
    payload.kycStatus  = 'Pending';
    payload.userType   = 'kyc_pending';
    payload.groupId    = 'GRP-001';
    payload.createdAt  = new Date().toISOString();
  }

  await setDoc(docRef, payload, { merge: true });
}


// ── loginWithEmail ───────────────────────────────────────────────

/**
 * Sign the user in via Firebase Auth, enforce the UID blocklist,
 * resolve their display name, persist the session in Firestore,
 * and update the Zustand auth store.
 *
 * @throws {string} Human-readable error message for inline display.
 */
export async function loginWithEmail(email, password) {
  // 1. Firebase sign-in
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    // Map Firebase error codes to friendly messages
    const map = {
      'auth/invalid-credential':     'Incorrect email or password.',
      'auth/user-not-found':         'No account found for this email.',
      'auth/wrong-password':         'Incorrect password.',
      'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    throw map[err.code] ?? 'Sign-in failed. Please try again.';
  }

  const firebaseUser = credential.user;

  // 2. UID blocklist check
  if (BLOCKED_UIDS.has(firebaseUser.uid)) {
    await signOut(auth);
    throw 'Access denied. Please use the Employee portal.';
  }

  // 3. Persist lastLogin to Firestore first (merge — never overwrites financial fields)
  await persistSession(firebaseUser.uid, firebaseUser.displayName || emailPrefix(email), email);

  // 4. Read the full Firestore doc (after write, so we always get fresh data)
  let displayName = emailPrefix(email);
  let financialData = null;
  let kycStatus = null;
  let userType  = null;
  try {
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (snap.exists()) {
      const data = snap.data();
      displayName   = data.name || emailPrefix(email);
      kycStatus     = data.kycStatus  ?? null;
      userType      = data.userType   ?? null;
      financialData = {
        profile:            data.profile            ?? null,
        financial_snapshot: data.financial_snapshot ?? null,
        loans_and_credit:   data.loans_and_credit   ?? null,
        contributions:      data.contributions      ?? null,
      };
    }
  } catch (err) {
    console.error('[loginWithEmail] Firestore read error:', err);
  }

  // 5. Update Zustand store
  const session = {
    user:          firebaseUser,
    displayName,
    uid:           firebaseUser.uid,
    email:         firebaseUser.email,
    financialData,
    kycStatus,
    userType,
  };
  useAuthStore.getState().setSession(session);

  return session;
}


// ── setupAuthListener ────────────────────────────────────────────

/**
 * Subscribe to Firebase's onAuthStateChanged.
 * Call this ONCE from AuthProvider on mount.
 * Returns the unsubscribe function.
 */
export function setupAuthListener() {
  const { setSession, setLoading, clear } = useAuthStore.getState();

  setLoading(true);

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      clear();
      return;
    }

    // Blocklist check on persisted sessions (tab refresh, etc.)
    if (BLOCKED_UIDS.has(firebaseUser.uid)) {
      await signOut(auth);
      clear();
      return;
    }

    // Rehydrate display name + financial data from Firestore
    let displayName;
    let financialData = null;
    let kycStatus = null;
    let userType  = null;
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      console.log('[auth] snap.exists():', snap.exists());
      if (snap.exists()) {
        const data = snap.data();
        console.log('[auth] Firestore doc keys:', Object.keys(data));
        displayName   = data.name || emailPrefix(firebaseUser.email);
        kycStatus     = data.kycStatus  ?? null;
        userType      = data.userType   ?? null;
        financialData = {
          profile:            data.profile            ?? null,
          financial_snapshot: data.financial_snapshot ?? null,
          loans_and_credit:   data.loans_and_credit   ?? null,
          contributions:      data.contributions      ?? null,
        };
      } else {
        displayName = emailPrefix(firebaseUser.email);
      }
    } catch (err) {
      console.error('[auth] Firestore fetch error:', err);
      displayName = emailPrefix(firebaseUser.email);
    }


    setSession({
      user:          firebaseUser,
      displayName,
      uid:           firebaseUser.uid,
      email:         firebaseUser.email,
      financialData,
      kycStatus,
      userType,
    });
  });
}
