/**
 * src/providers/WebSocketProvider.jsx — Client
 *
 * Provides sendAction via WsContext so any child can send WS actions
 * without prop drilling. Mirrors the same pattern as Employee Desktop.
 *
 * Only opens a WS connection when uid is present (user is logged in).
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import useAuthStore     from '../store/authStore';

const WsContext = createContext({ sendAction: () => {} });

/**
 * useWsAction — consume in any component or hook that needs to send
 * an action to the WebSocket server.
 *
 * @example
 *   const { sendAction } = useWsAction();
 *   sendAction({ channel: 'auction_room', action: 'place_bid', payload: {...} });
 */
export function useWsAction() {
  return useContext(WsContext);
}

export default function WebSocketProvider({ children }) {
  const uid = useAuthStore((s) => s.uid);

  if (!uid) {
    // No-op context — children never crash on sendAction when logged out
    return (
      <WsContext.Provider value={{ sendAction: () => {} }}>
        {children}
      </WsContext.Provider>
    );
  }

  return <InnerProvider>{children}</InnerProvider>;
}

/** Separated so useWebSocket only runs when user is logged in. */
function InnerProvider({ children }) {
  const { sendAction } = useWebSocket();
  const ctx = useMemo(() => ({ sendAction }), [sendAction]);
  return <WsContext.Provider value={ctx}>{children}</WsContext.Provider>;
}
