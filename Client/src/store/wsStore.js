/**
 * src/store/wsStore.js — Client
 *
 * Minimal Zustand store for WebSocket state.
 * The Client only needs:
 *   - connected (boolean) — WS health indicator
 *   - auctionEvent — last auction_room message {event, payload, ts}
 *     useAuction watches this to react to real-time WS pushes.
 */

import { create } from 'zustand';

const useWsStore = create((set) => ({
  // ─── Connection ───────────────────────────────────────────────
  connected: false,
  setConnected: (val) => set({ connected: val }),

  // ─── Auction room — last received WS event ────────────────────
  // ts is Date.now() — changing ts even with same event triggers re-render
  auctionEvent: null,   // { event: string, payload: object, ts: number }
  setAuctionEvent: (event, payload) =>
    set({ auctionEvent: { event, payload, ts: Date.now() } }),
}));

export default useWsStore;
