import { create } from 'zustand';

/**
 * Global auth store (Zustand).
 *
 * Shape:
 *   user    — Firebase User object  | null
 *   role    — "admin" | "employee"  | null
 *   loading — true while onAuthStateChanged hasn't fired yet
 */
const useAuthStore = create((set) => ({
  user: null,
  role: null,
  loading: true,   // start true so protected routes don't flash before session resolves

  /** Called by AuthProvider once the Firebase session is known. */
  setAuth: (user, role) => set({ user, role, loading: false }),

  /** Called on sign-out or when no session exists. */
  clearAuth: () => set({ user: null, role: null, loading: false }),
}));

export default useAuthStore;
