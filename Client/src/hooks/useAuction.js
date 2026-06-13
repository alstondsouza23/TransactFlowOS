/**
 * src/hooks/useAuction.js — Client
 *
 * Central auction hook for the member (Client) app.
 * Combines five reactive effects:
 *   1. Firestore onSnapshot: auctions (active/scheduled for this group)
 *   2. Firestore onSnapshot: bids (live feed while auction is open)
 *   3. Firestore onSnapshot: users/{uid} (prizedInCycle + groupId)
 *   4. Countdown interval (MM:SS)
 *   5. WebSocket auction_room events (WS push supplements Firestore)
 *
 * All Firestore writes for auction actions go through the WS server.
 * This hook only reads from Firestore and sends via sendAction.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, query, where, onSnapshot, doc,
  addDoc, getDocs, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db }          from '../lib/firebase';
import useAuthStore    from '../store/authStore';
import useWsStore      from '../store/wsStore';
import { useWsAction } from '../providers/WebSocketProvider';
import toast           from './useToast';

export default function useAuction() {
  const uid         = useAuthStore((s) => s.uid);
  const displayName = useAuthStore((s) => s.displayName) || '';

  const { sendAction } = useWsAction();
  const auctionEvent   = useWsStore((s) => s.auctionEvent);
  const wsConnected    = useWsStore((s) => s.connected);

  const [auction,  setAuction]  = useState(undefined);  // undefined=loading, null=none
  const [bids,     setBids]     = useState([]);
  const [myBid,    setMyBid]    = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);           // milliseconds
  const [hasWon,   setHasWon]   = useState(false);
  const [groupId,  setGroupId]  = useState(null);

  const loading = auction === undefined;
  const timerRef = useRef(null);

  // ── Effect 3: users/{uid} → groupId + hasWon ──────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.groupId) setGroupId(d.groupId);
        setHasWon(d.prizedInCycle === true);
      }
    }, (err) => console.error('[useAuction] user doc error:', err));
    return () => unsub();
  }, [uid]);

  // ── Effect 1: auctions onSnapshot ───────────────────────────────
  // Fetch the FULL auctions collection client-side — no composite
  // Firestore index required (avoids silent query failures).
  useEffect(() => {
    if (!uid) return;

    const ACTIVE_STATUSES = new Set(['scheduled', 'open', 'closed', 'cancelled']);

    const unsub = onSnapshot(
      collection(db, 'auctions'),
      (snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => ACTIVE_STATUSES.has(a.status));

        console.log('[useAuction] auctions fetched:', all.length, 'groupId:', groupId);

        // Filter to this user's group if known; otherwise show all (avoids
        // blank screen while the users/{uid} doc is still loading).
        const mine = groupId
          ? all.filter((a) => a.groupId === groupId || a.group_id === groupId)
          : all;

        if (mine.length === 0) {
          setAuction(null);
          return;
        }

        // Priority: open > scheduled > most-recently-closed/cancelled
        const active =
          mine.find((a) => a.status === 'open') ||
          mine.find((a) => a.status === 'scheduled') ||
          mine
            .filter((a) => a.status === 'closed' || a.status === 'cancelled')
            .sort((a, b) => {
              const ta = a.closedAt?.toDate?.()?.getTime() ?? new Date(a.closedAt ?? 0).getTime();
              const tb = b.closedAt?.toDate?.()?.getTime() ?? new Date(b.closedAt ?? 0).getTime();
              return tb - ta;
            })[0] ||
          null;

        setAuction(active);
      },
      (err) => {
        console.error('[useAuction] auctions snapshot error:', err);
        setAuction(null);
      }
    );

    return () => unsub();
  }, [uid, groupId]); // re-runs when groupId resolves from users/{uid}

  // ── Effect 2: bids onSnapshot (only when open) ─────────────────
  useEffect(() => {
    if (!auction?.id || auction.status !== 'open') {
      setBids([]);
      setMyBid(null);
      return;
    }
    // No orderBy → Firestore single-field index on auctionId is auto-created.
    // We sort highest-bid-first in JS so no composite index needed.
    const q = query(
      collection(db, 'bids'),
      where('auctionId', '==', auction.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.bidAmountINR ?? 0) - (a.bidAmountINR ?? 0)); // highest first
      setBids(all);
      setMyBid(all.find((b) => b.bidderUid === uid) || null);
    }, (err) => console.error('[useAuction] bids error:', err));
    return () => unsub();
  }, [auction?.id, auction?.status, uid]);

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
        setAuction((prev) => prev
          ? { ...prev, status: 'open',   ...payload }
          : { status: 'open',   ...payload }
        );
        break;

      case 'auction_closed':
        setAuction((prev) => prev
          ? { ...prev, status: 'closed', ...payload }
          : { status: 'closed', ...payload }
        );
        setBids([]);
        break;

      case 'auction_cancelled':
        setAuction((prev) => prev
          ? { ...prev, status: 'cancelled' }
          : null
        );
        toast.info('The auction has been cancelled.');
        break;

      case 'auction_won':
        toast.success(payload?.message || '🎉 You won the auction!', 10_000);
        break;

      case 'bid_error':
        toast.error(payload?.message || 'Bid failed — please try again.');
        break;

      case 'auction_no_bids':
        toast.info('Auction ended with no bids — not closed yet.');
        break;

      default:
        break;
    }
  }, [auctionEvent]);

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── placeBid ────────────────────────────────────────────
  // Primary: write directly to Firestore (works without backend).
  // Secondary: fire-and-forget WS broadcast (real-time push when online).
  const placeBid = useCallback(async (bidAmountINR) => {
    if (!auction || auction.status !== 'open') {
      throw new Error('No active auction open for bidding');
    }
    if (hasWon) {
      throw new Error('You have already won a previous cycle');
    }
    const amount = parseInt(bidAmountINR, 10);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid bid amount');
    }

    // ── Upsert bid in Firestore ────────────────────────────────
    const bidsRef = collection(db, 'bids');
    const existing = await getDocs(
      query(bidsRef,
        where('auctionId', '==', auction.id),
        where('bidderUid', '==', uid)
      )
    );

    if (!existing.empty) {
      // Update existing bid
      await updateDoc(existing.docs[0].ref, {
        bidAmountINR: amount,
        placedAt:     serverTimestamp(),
      });
    } else {
      // Create new bid
      await addDoc(bidsRef, {
        auctionId:    auction.id,
        groupId:      auction.groupId ?? groupId,
        bidderUid:    uid,
        bidderName:   displayName,
        bidAmountINR: amount,
        placedAt:     serverTimestamp(),
        isWinning:    false,
      });
    }

    // ── Fire-and-forget WS broadcast (optional) ─────────────────
    try {
      sendAction({
        channel: 'auction_room',
        action:  'place_bid',
        payload: {
          auctionId:    auction.id,
          groupId:      auction.groupId ?? groupId,
          bidderUid:    uid,
          bidderName:   displayName,
          bidAmountINR: amount,
        },
      });
    } catch { /* WS offline — bid already written to Firestore */ }
  }, [auction, hasWon, uid, displayName, groupId, sendAction]);

  return {
    auction,
    bids,
    myBid,
    timeLeft,    // milliseconds remaining
    hasWon,
    loading,
    groupId,
    placeBid,
    wsConnected,
  };
}
