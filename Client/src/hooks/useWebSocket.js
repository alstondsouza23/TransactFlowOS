/**
 * src/hooks/useWebSocket.js — Client
 *
 * Manages the single WebSocket connection to the TransactFlowOS
 * backend for Client (member) users.
 *
 * Protocol
 * ────────
 * On open   → sends { type:"auth", token:<Firebase ID token> }
 * On message → routes auction_room messages to wsStore.setAuctionEvent
 * sendAction → sends an action message to the server (used by useAuction.placeBid)
 */

import { useEffect, useRef, useCallback } from 'react';
import { auth } from '../lib/firebase';
import useAuthStore from '../store/authStore';
import useWsStore   from '../store/wsStore';

const WS_URL            = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
const RECONNECT_DELAY_MS = 3_000;

export function useWebSocket() {
  const uid        = useAuthStore((s) => s.uid);
  const wsRef      = useRef(null);
  const retryTimer = useRef(null);
  const mounted    = useRef(true);

  const { setConnected, setAuctionEvent } = useWsStore();

  // ─── Message router ─────────────────────────────────────────────
  const routeMessage = useCallback((msg) => {
    const { channel, event, payload } = msg;

    if (channel === 'auction_room') {
      // All auction_room events are piped into wsStore so useAuction can react
      setAuctionEvent(event, payload ?? {});
      return;
    }

    if (channel === 'loan_inbox') {
      if (event === 'create_loan_ack') {
        console.log('[WS Client] Loan created:', payload);
      } else if (event === 'create_loan_error') {
        console.warn('[WS Client] Loan error:', payload?.error);
      }
      return;
    }

    if (channel === 'system') return;   // auth ack, pong — ignore
    if (channel === 'error') {
      console.error('[WS Client] Server error:', payload);
    }
  }, [setAuctionEvent]);

  // ─── sendAction — exposed via WsContext ─────────────────────────
  const sendAction = useCallback((message) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (err) {
        console.error('[WS Client] send failed:', err);
      }
    } else {
      console.warn('[WS Client] Socket not open — message dropped', message);
    }
  }, []);

  // ─── Connection lifecycle ─────────────────────────────────────
  const connect = useCallback(async () => {
    if (!uid || !mounted.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    // Get Firebase ID token via the live auth instance
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    let token;
    try {
      token = await firebaseUser.getIdToken(false);
    } catch (err) {
      console.error('[WS Client] getIdToken failed:', err);
      return;
    }

    console.log('[WS Client] Connecting to', WS_URL);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS Client] Connected — authenticating');
      ws.send(JSON.stringify({ type: 'auth', token }));
      setConnected(true);
    };

    ws.onmessage = (evt) => {
      try {
        routeMessage(JSON.parse(evt.data));
      } catch (err) {
        console.error('[WS Client] Parse error:', err);
      }
    };

    ws.onerror = (err) => console.error('[WS Client] Error:', err);

    ws.onclose = (evt) => {
      console.log(`[WS Client] Closed (code=${evt.code})`);
      setConnected(false);
      wsRef.current = null;
      if (mounted.current) {
        retryTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };
  }, [uid, setConnected, routeMessage]);

  useEffect(() => {
    mounted.current = true;
    connect();
    return () => {
      mounted.current = false;
      clearTimeout(retryTimer.current);
      const ws = wsRef.current;
      if (ws) {
        ws.close(1000, 'Client unmounted');
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [connect, setConnected]);

  return { sendAction };
}
