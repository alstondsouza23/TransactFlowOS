/**
 * src/providers/WebSocketProvider.jsx
 *
 * Mounts once inside AuthProvider.
 * Instantiates the single WS connection via useWebSocket() and
 * exposes sendAction via WsContext so any child component can
 * send actions to the backend without prop drilling.
 *
 * Only connects when a user is logged in.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import useAuthStore from '../store/authStore';

const WsContext = createContext({ sendAction: () => {} });

/**
 * useWsAction — consume in any component that needs to send an action.
 *
 * @example
 *   const { sendAction } = useWsAction();
 *   sendAction({ channel: 'kyc_queue', action: 'approve', payload: { id } });
 */
export function useWsAction() {
  return useContext(WsContext);
}

export default function WebSocketProvider({ children }) {
  const { user } = useAuthStore();

  // Only mount the hook (and therefore the WS connection) when logged in
  if (!user) {
    // Provide a no-op context so children never crash on sendAction
    return (
      <WsContext.Provider value={{ sendAction: () => {} }}>
        {children}
      </WsContext.Provider>
    );
  }

  return <InnerProvider>{children}</InnerProvider>;
}

/** Separated so useWebSocket only runs when user exists */
function InnerProvider({ children }) {
  const { sendAction } = useWebSocket();
  const ctx = useMemo(() => ({ sendAction }), [sendAction]);

  return (
    <WsContext.Provider value={ctx}>
      {children}
    </WsContext.Provider>
  );
}
