import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { resolveRole } from '../firebase/roleResolver';
import useAuthStore from '../store/authStore';

/**
 * AuthProvider — wraps the entire app.
 *
 * Subscribes to Firebase's onAuthStateChanged listener once on mount.
 * When the listener fires:
 *   • user exists  → resolve role, write to Zustand store
 *   • user is null → clear the store
 *
 * Renders a full-screen loading state until the first auth event fires,
 * preventing a flash-redirect to /login on page refresh.
 */
export default function AuthProvider({ children }) {
  const { setAuth, clearAuth, loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const role = resolveRole(firebaseUser.email, firebaseUser.uid);
        setAuth(firebaseUser, role);
      } else {
        clearAuth();
      }
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [setAuth, clearAuth]);

  // Block render until Firebase has resolved the session
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f6f8fb',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #1a2f55',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return children;
}
