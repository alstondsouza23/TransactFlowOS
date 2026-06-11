import React, { useEffect } from 'react';
import useAuthStore        from '../store/authStore';
import { setupAuthListener } from '../lib/auth';

/**
 * AuthProvider
 *
 * Mounts once at app root. Subscribes to Firebase's onAuthStateChanged
 * via setupAuthListener() and keeps the Zustand store in sync.
 *
 * Renders a full-screen loading indicator while the initial auth
 * state is being resolved, preventing any page flash.
 */
const AuthProvider = ({ children }) => {
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    // Returns the Firebase unsubscribe function — called on unmount
    const unsubscribe = setupAuthListener();
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingShell}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return children;
};

const styles = {
  loadingShell: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    minHeight:       '100vh',
    backgroundColor: '#f8fafc',
  },
  spinner: {
    width:       '36px',
    height:      '36px',
    borderRadius:'50%',
    border:      '3px solid #e2e8f0',
    borderTop:   '3px solid #1b3664',
    animation:   'spin 0.75s linear infinite',
  },
};

// Inject keyframes once — no CSS file dependency
if (typeof document !== 'undefined' && !document.getElementById('auth-spinner-style')) {
  const style = document.createElement('style');
  style.id = 'auth-spinner-style';
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}

export default AuthProvider;
