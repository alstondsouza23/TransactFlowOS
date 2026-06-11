/**
 * src/hooks/useAuction.js — Employee_Admin-Desktop
 *
 * Mirror of Client/src/hooks/useAuction.js.
 * Only differences from the Client version:
 *   - db imported from '../lib/firestore' (not '../lib/firebase')
 *   - toast: uses inline showToast from a passed callback, or console
 *   - useWsAction from '../providers/WebSocketProvider'
 *
 * In the Employee view, auction admin actions (force_close, cancel,
 * create, open) are sent via the Sidebar's sendAction — this hook
 * is used primarily to read live state (auction doc + bids).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, query, where, onSnapshot,
  orderBy, limit, doc,
} from 'firebase/firestore';
import { db }          from '../lib/firestore';
import useAuthStore    from '../store/authStore';
import useWsStore      from '../store/wsStore';
import { useWsAction } from '../providers/WebSocketProvider';

export default function useAuction(groupId = 'GRP-001') {
  const { user }    = useAuthStore();
  const uid         = user?.uid || '';
  const displayName = user?.displayName || user?.email || 'Employee';

  const { sendAction } = useWsAction();
  const auctionEvent   = useWsStore((s) => s.auctionEvent);
  const wsConnected    = useWsStore((s) => s.connected);

  const [auction,  setAuction]  = useState(undefined);
  const [bids,     setBids]     = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);

  const loading  = auction === undefined;
  const timerRef = useRef(null);

  // ── Effect 1: auctions onSnapshot ─────────────────────────────
  // Use status-only query (single-field index, auto-created).
  // Filter by groupId in JS — avoids composite index that doesn't exist.
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'auctions'),
      where('status', 'in', ['scheduled', 'open'])
    );

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const mine = groupId ? all.filter((a) => a.groupId === groupId) : all;
      const active =
        mine.find((a) => a.status === 'open') ||
        mine.find((a) => a.status === 'scheduled') ||
        null;
      setAuction(active);
    }, (err) => {
      console.error('[useAuction/employee] auctions error:', err);
      setAuction(null);
    });

    return () => unsub();
  }, [uid, groupId]);

  // ── Effect 2: bids onSnapshot (all bids — admin sees real names) ──
  useEffect(() => {
    if (!auction?.id) { setBids([]); return; }
    // Filter only — sort highest-first in JS to avoid composite index
    const q = query(
      collection(db, 'bids'),
      where('auctionId', '==', auction.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.bidAmountINR ?? 0) - (a.bidAmountINR ?? 0)); // highest first
      setBids(all);
    });
    return () => unsub();
  }, [auction?.id]);

  // ── Effect 4: countdown timer ─────────────────────────────────
  useEffect(() => {
    clearInterval(timerRef.current);
    if (auction?.status !== 'open' || !auction?.openedAt) return;

    const openedMs = auction.openedAt?.toDate
      ? auction.openedAt.toDate().getTime()
      : new Date(auction.openedAt).getTime();
    const endTime = openedMs + (auction.durationMinutes || 60) * 60 * 1_000;

    const tick = () => {
      const rem = Math.max(0, endTime - Date.now());
      setTimeLeft(rem);
      if (rem === 0) clearInterval(timerRef.current);
    };
    tick();
    timerRef.current = setInterval(tick, 1_000);
    return () => clearInterval(timerRef.current);
  }, [auction?.id, auction?.status, auction?.openedAt, auction?.durationMinutes]);

  // ── Effect 5: WS events ───────────────────────────────────────
  useEffect(() => {
    if (!auctionEvent) return;
    const { event, payload } = auctionEvent;
    switch (event) {
      case 'auction_snapshot':
      case 'auction_scheduled':
        setAuction(payload);
        break;
      case 'auction_opened':
        setAuction((p) => p ? { ...p, status: 'open',   ...payload } : { status: 'open',   ...payload });
        break;
      case 'auction_closed':
        setAuction((p) => p ? { ...p, status: 'closed', ...payload } : { status: 'closed', ...payload });
        setBids([]);
        break;
      case 'auction_cancelled':
        setAuction((p) => p ? { ...p, status: 'cancelled' } : null);
        break;
    }
  }, [auctionEvent]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Employee auction actions (sent via WS) ─────────────────────
  const openAuction = useCallback(() => {
    if (!auction?.id) return;
    sendAction({
      channel: 'auction_room',
      action:  'open_auction',
      payload: { auctionId: auction.id, groupId },
    });
  }, [auction, groupId, sendAction]);

  const forceClose = useCallback((reason = '') => {
    if (!auction?.id) return;
    sendAction({
      channel: 'auction_room',
      action:  'force_close',
      payload: { auctionId: auction.id, groupId, reason },
    });
  }, [auction, groupId, sendAction]);

  const cancelAuction = useCallback((reason = '') => {
    if (!auction?.id) return;
    sendAction({
      channel: 'auction_room',
      action:  'cancel_auction',
      payload: { auctionId: auction.id, groupId, reason },
    });
  }, [auction, groupId, sendAction]);

  return {
    auction, bids, timeLeft, loading, wsConnected,
    openAuction, forceClose, cancelAuction,
  };
}
