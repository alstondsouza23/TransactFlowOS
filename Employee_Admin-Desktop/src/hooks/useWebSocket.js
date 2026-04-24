/**
 * src/hooks/useWebSocket.js
 *
 * Custom hook that manages a single WebSocket connection to the
 * TransactFlowOS backend (ws://localhost:8080).
 *
 * Usage
 * ─────
 * Called once by WebSocketProvider. Individual pages read data
 * from wsStore and send actions via the context's sendAction().
 *
 * Protocol
 * ────────
 * On open   → sends { type:"auth", token:<Firebase ID token> }
 * On message → routes by channel to wsStore setters
 * sendAction → sends an action message to the server
 */

import { useEffect, useRef, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import useWsStore from '../store/wsStore';

// Local dev → ws://localhost:8080
// Production → set VITE_WS_URL=wss://transactflowos-ws.onrender.com in .env
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
const RECONNECT_DELAY_MS = 3000;

export function useWebSocket() {
  const { user } = useAuthStore();
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const isMounted = useRef(true);

  const {
    setConnected,
    setLoanApplications, upsertLoanApplication, removeLoanApplication,
    setAuditLog, prependAuditEntry,
    setRecoveryCases, upsertRecoveryCase, removeRecoveryCase,
    setKycQueue, upsertKycEntry, removeKycEntry,
    setKernelState,
  } = useWsStore();

  // ─── Message router ─────────────────────────────────────────
  const routeMessage = useCallback((msg) => {
    const { channel, event, payload } = msg;

    if (channel === 'system') {
      // auth ack, pong, errors — no store update needed
      return;
    }

    if (channel === 'loan_inbox') {
      if (event === 'snapshot') { setLoanApplications(payload); return; }
      if (event === 'update')   { upsertLoanApplication(payload); return; }
      if (event === 'delete')   { removeLoanApplication(payload.id); return; }
      // action_ack — the server also fires an onSnapshot, so the update
      // arrives via 'update' event automatically. Nothing to do here.
      return;
    }

    if (channel === 'audit_stream') {
      if (event === 'snapshot') {
        // Sort descending by timestamp so newest is first
        const sorted = [...payload].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setAuditLog(sorted);
        return;
      }
      if (event === 'update')   { prependAuditEntry(payload); return; }
      return;
    }

    if (channel === 'recovery_board') {
      if (event === 'snapshot') { setRecoveryCases(payload); return; }
      if (event === 'update')   { upsertRecoveryCase(payload); return; }
      if (event === 'delete')   { removeRecoveryCase(payload.id); return; }
      return;
    }

    if (channel === 'kyc_queue') {
      if (event === 'snapshot') { setKycQueue(payload); return; }
      if (event === 'update')   { upsertKycEntry(payload); return; }
      if (event === 'delete')   { removeKycEntry(payload.id); return; }
      return;
    }

    if (channel === 'kernel_state') {
      if (event === 'snapshot' || event === 'update') {
        setKernelState(payload);
        return;
      }
    }

    if (channel === 'error') {
      console.error('[WS] Server error:', payload);
    }
  }, [
    setLoanApplications, upsertLoanApplication, removeLoanApplication,
    setAuditLog, prependAuditEntry,
    setRecoveryCases, upsertRecoveryCase, removeRecoveryCase,
    setKycQueue, upsertKycEntry, removeKycEntry,
    setKernelState,
  ]);

  // ─── sendAction — exposed via context ─────────────────────────
  const sendAction = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WS] Cannot send — socket not open', message);
    }
  }, []);

  // ─── Connection lifecycle ─────────────────────────────────────
  const connect = useCallback(async () => {
    if (!user || !isMounted.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    let token;
    try {
      token = await user.getIdToken(/* forceRefresh */ false);
    } catch (err) {
      console.error('[WS] Failed to get ID token:', err);
      return;
    }

    console.log('[WS] Connecting to', WS_URL);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected — sending auth');
      ws.send(JSON.stringify({ type: 'auth', token }));
      setConnected(true);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        routeMessage(msg);
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };

    ws.onclose = (evt) => {
      console.log(`[WS] Closed (code=${evt.code})`);
      setConnected(false);
      wsRef.current = null;

      // Reconnect after delay unless intentionally unmounted
      if (isMounted.current) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };
  }, [user, setConnected, routeMessage]);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [connect, setConnected]);

  return { sendAction };
}
