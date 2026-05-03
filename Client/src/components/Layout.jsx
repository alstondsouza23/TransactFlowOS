import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

// ── Nav Items ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#0f172a' : '#94a3b8'} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Contributions',
    path: '/contributions',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#0f172a' : '#94a3b8'} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: 'Loans',
    path: '/loans',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#0f172a' : '#94a3b8'} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Group',
    path: '/group',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#0f172a' : '#94a3b8'} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

// ── Layout ────────────────────────────────────────────────────────────────────
const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={styles.shell}>
      <div style={styles.container}>

        {/* Page content — padded above the nav bar */}
        <div style={styles.content}>
          <Outlet />
        </div>

        {/* Fixed bottom navigation */}
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navItem,
                  color: active ? '#0f172a' : '#94a3b8',
                }}
              >
                {item.icon(active)}
                <span style={{
                  ...styles.navLabel,
                  color: active ? '#0f172a' : '#94a3b8',
                  fontWeight: active ? '700' : '500',
                }}>
                  {item.label}
                </span>
                {active && <span style={styles.activeDot} />}
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const NAV_HEIGHT = '64px';

const styles = {
  shell: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflowX: 'hidden',
  },
  container: {
    width: '100%',
    maxWidth: '480px',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    position: 'relative',
  },
  /* Page content scrolls freely, nav bar doesn't overlap it */
  content: {
    paddingBottom: NAV_HEIGHT,
    boxSizing: 'border-box',
  },
  /* Fixed nav anchored to the bottom of the container column */
  nav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    height: NAV_HEIGHT,
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    boxSizing: 'border-box',
    zIndex: 100,
  },
  navItem: {
    flex: 1,
    height: '100%',
    border: 'none',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: 'pointer',
    padding: '8px 4px',
    position: 'relative',
  },
  navLabel: {
    fontSize: '10px',
    letterSpacing: '0.2px',
  },
  /* Tiny active indicator dot below the label */
  activeDot: {
    position: 'absolute',
    bottom: '8px',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#0f172a',
  },
};

export default Layout;
