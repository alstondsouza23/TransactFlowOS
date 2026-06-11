/**
 * src/store/wsStore.js
 *
 * Zustand store for all live WebSocket / Firestore data.
 *
 * Shape
 * ─────
 *  connected          — boolean, WS connection status
 *  loanApplications   — loan_applications collection docs
 *  auditLog           — audit_log collection docs (up to 50, newest first)
 *  recoveryCases      — recovery_cases collection docs
 *  kycQueue           — kyc_queue collection docs
 *  kernelState        — kernel_state/live document
 */

import { create } from 'zustand';

const useWsStore = create((set, get) => ({
  // ─── Connection ───────────────────────────────────────────────
  connected: false,
  setConnected: (val) => set({ connected: val }),

  // ─── Loan Applications ───────────────────────────────────────
  loanApplications: [],
  setLoanApplications: (docs) => set({ loanApplications: docs }),
  upsertLoanApplication: (doc) =>
    set((state) => {
      const existing = state.loanApplications.findIndex((d) => d.id === doc.id);
      if (existing !== -1) {
        const updated = [...state.loanApplications];
        updated[existing] = doc;
        return { loanApplications: updated };
      }
      return { loanApplications: [doc, ...state.loanApplications] };
    }),
  removeLoanApplication: (id) =>
    set((state) => ({
      loanApplications: state.loanApplications.filter((d) => d.id !== id),
    })),

  // ─── Audit Log ───────────────────────────────────────────────
  auditLog: [],
  setAuditLog: (docs) => set({ auditLog: docs }),
  /** Prepend a single entry, keep only the newest 50 */
  prependAuditEntry: (doc) =>
    set((state) => {
      const existing = state.auditLog.findIndex((d) => d.id === doc.id);
      if (existing !== -1) {
        const updated = [...state.auditLog];
        updated[existing] = doc;
        return { auditLog: updated };
      }
      return { auditLog: [doc, ...state.auditLog].slice(0, 50) };
    }),

  // ─── Recovery Cases ──────────────────────────────────────────
  recoveryCases: [],
  setRecoveryCases: (docs) => set({ recoveryCases: docs }),
  upsertRecoveryCase: (doc) =>
    set((state) => {
      const existing = state.recoveryCases.findIndex((d) => d.id === doc.id);
      if (existing !== -1) {
        const updated = [...state.recoveryCases];
        updated[existing] = doc;
        return { recoveryCases: updated };
      }
      return { recoveryCases: [doc, ...state.recoveryCases] };
    }),
  removeRecoveryCase: (id) =>
    set((state) => ({
      recoveryCases: state.recoveryCases.filter((d) => d.id !== id),
    })),

  // ─── KYC Queue ───────────────────────────────────────────────
  kycQueue: [],
  setKycQueue: (docs) => set({ kycQueue: docs }),
  upsertKycEntry: (doc) =>
    set((state) => {
      const existing = state.kycQueue.findIndex((d) => d.id === doc.id);
      if (existing !== -1) {
        const updated = [...state.kycQueue];
        updated[existing] = doc;
        return { kycQueue: updated };
      }
      return { kycQueue: [doc, ...state.kycQueue] };
    }),
  removeKycEntry: (id) =>
    set((state) => ({
      kycQueue: state.kycQueue.filter((d) => d.id !== id),
    })),

  // ─── Kernel State ─────────────────────────────────────────────
  kernelState: null,
  setKernelState: (doc) => set({ kernelState: doc }),

  // ─── Auction Room ────────────────────────────────────────
  // Last received auction_room WS event — useAuction watches this.
  // ts changes every time so useEffect triggers even for same event.
  auctionEvent: null,  // { event: string, payload: object, ts: number }
  setAuctionEvent: (event, payload) =>
    set({ auctionEvent: { event, payload, ts: Date.now() } }),
}));

export default useWsStore;
