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
 *   financialData — object containing user financial info | null
 */
const useAuthStore = create((set) => ({
  user:        null,
  displayName: null,
  uid:         null,
  email:       null,
  loading:     true,   // stays true until AuthProvider fires onAuthStateChanged
  error:       null,
  financialData: null,
  kycStatus:   null,   // 'Pending' | 'Approved' | 'Rejected' | null
  userType:    null,   // 'kyc_pending' | 'loan_eligible' | 'contributor' | null

  /** Called after a successful sign-in or session restore. */
  setSession: ({ user, displayName, uid, email, financialData, kycStatus, userType }) =>
    set({ user, displayName, uid, email, financialData, kycStatus, userType, loading: false, error: null }),


  /** Set loading state explicitly (e.g. while auth listener is booting). */
  setLoading: (loading) => set({ loading }),

  /** Set an inline error message. */
  setError: (error) => set({ error, loading: false }),

  /** Set financial data. */
  setFinancialData: (financialData) => set({ financialData }),

  /** Clear everything — called on sign-out or blocked session. */
  clear: () =>
    set({ user: null, displayName: null, uid: null, email: null, loading: false, error: null, financialData: null, kycStatus: null, userType: null }),
}));

export default useAuthStore;
