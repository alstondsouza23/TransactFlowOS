import { create } from 'zustand';

/**
 * Global auth store — Client app
 *
 * Shape:
 *   user        — Firebase User object | null
 *   displayName — resolved from users.json or email prefix | null
 *   uid         — Firebase UID string | null
 *   email       — Firebase email string | null
 *   loading     — true while onAuthStateChanged hasn't resolved yet
 *   error       — inline error string | null
 */
const useAuthStore = create((set) => ({
  user:        null,
  displayName: null,
  uid:         null,
  email:       null,
  loading:     true,   // stays true until AuthProvider fires onAuthStateChanged
  error:       null,

  /** Called after a successful sign-in or session restore. */
  setSession: ({ user, displayName, uid, email }) =>
    set({ user, displayName, uid, email, loading: false, error: null }),

  /** Set loading state explicitly (e.g. while auth listener is booting). */
  setLoading: (loading) => set({ loading }),

  /** Set an inline error message. */
  setError: (error) => set({ error, loading: false }),

  /** Clear everything — called on sign-out or blocked session. */
  clear: () =>
    set({ user: null, displayName: null, uid: null, email: null, loading: false, error: null }),
}));

export default useAuthStore;
