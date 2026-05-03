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
import usersData       from '../../data/user.json';

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
 * Resolve a human-readable display name for a given email address.
 * 1. Search the local users.json for a matching entry.
 * 2. Fall back to the email prefix (everything before @).
 */
function resolveDisplayName(email) {
  const match = usersData.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  return match ? match.name : email.split('@')[0];
}

/**
 * Write (or merge-update) the user record in Firestore.
 * Uses merge:true so we never overwrite fields we don't own.
 */
async function persistSession(uid, name, email) {
  await setDoc(
    doc(db, 'users', uid),
    { name, email, lastLogin: new Date().toISOString() },
    { merge: true }
  );
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

  // 3. Resolve display name
  const displayName = resolveDisplayName(firebaseUser.email);

  // 4. Persist to Firestore (merge — never overwrites existing fields)
  await persistSession(firebaseUser.uid, displayName, firebaseUser.email);

  // 5. Update Zustand store
  const session = {
    user:        firebaseUser,
    displayName,
    uid:         firebaseUser.uid,
    email:       firebaseUser.email,
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
      // No persisted session
      clear();
      return;
    }

    // Blocklist check on persisted sessions (tab refresh, etc.)
    if (BLOCKED_UIDS.has(firebaseUser.uid)) {
      await signOut(auth);
      clear();
      return;
    }

    // Rehydrate display name from Firestore (don't re-read users.json on every refresh)
    let displayName;
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      displayName = snap.exists() ? snap.data().name : resolveDisplayName(firebaseUser.email);
    } catch {
      // Firestore unreachable — fall back to local resolution
      displayName = resolveDisplayName(firebaseUser.email);
    }

    setSession({
      user:        firebaseUser,
      displayName,
      uid:         firebaseUser.uid,
      email:       firebaseUser.email,
    });
  });
}
