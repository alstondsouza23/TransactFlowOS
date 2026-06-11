import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth }   from '../lib/firebase';
import useAuthStore from '../store/authStore';

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icons = {
  Overview: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Contributions: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  Loans: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-5.4a1.7 1.7 0 0 0-2.3-2.5L16 12" />
    </svg>
  ),
  Group: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  RiskAnalysis: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  Auction: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  SignOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Logo: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="#1b3664" stroke="none" />
      <path d="M6 12h3l2-5 2 10 2-5h3" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  )
};

const NAV_ITEMS = [
  { label: 'My Overview',   path: '/dashboard',     icon: Icons.Overview },
  { label: 'Contributions', path: '/contributions', icon: Icons.Contributions },
  { label: 'Loans',         path: '/loans',         icon: Icons.Loans },
  { label: 'Group Overview',path: '/group',         icon: Icons.Group },
  { label: 'Auction Room',  path: '/auction',       icon: Icons.Auction },
  { label: 'Risk Analysis', path: '/risk-analysis', icon: Icons.RiskAnalysis },
];


const Layout = () => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const displayName = useAuthStore((s) => s.displayName) || '';
  const uid         = useAuthStore((s) => s.uid) ?? 'TF-8829';
  const { clear }   = useAuthStore.getState();

  const memberId = uid.includes('-') ? uid : `TF-${uid.slice(0, 4).toUpperCase()}`;

  const handleSignOut = async () => {
    await signOut(auth);
    clear();
    navigate('/', { replace: true });
  };

  return (
    <div style={styles.shell}>
      {/* ── Left Sidebar (Desktop Only) ────────────────────────────── */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <Icons.Logo />
          <span style={styles.brandName}>TransactFlowOS</span>
        </div>

        <nav style={styles.sidebarNav}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            const iconColor = active ? '#ffffff' : '#64748b';
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`sidebar-item ${active ? 'active' : ''}`}
                style={{
                  ...styles.sidebarItem,
                  backgroundColor: active ? '#1b3664' : 'transparent',
                  color: active ? '#ffffff' : '#64748b',
                }}
              >
                {item.icon(iconColor)}
                <span style={{ ...styles.sidebarLabel, fontWeight: active ? '600' : '500' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <button onClick={handleSignOut} style={styles.signOutBtn}>
          <Icons.SignOut />
          <span style={styles.signOutLabel}>Sign Out</span>
        </button>
      </aside>

      <div style={styles.mainWrapper}>
        {/* ── Top Header ────────────────────────────────────────────── */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.mobileLogo}><Icons.Logo /></div>
            <span style={styles.headerTitle}>TransactFlowOS</span>
            <div style={styles.headerDivider} />
            <span style={styles.headerSubtitle}>MEMBER PORTAL</span>
          </div>

          <div style={styles.headerRight}>
            <button style={styles.iconBtn} aria-label="Notifications">
              <Icons.Bell />
            </button>
            <div style={styles.profileSection}>
              <div style={styles.profileInfo}>
                <p style={styles.profileName}>{displayName}</p>
                <p style={styles.profileId}>ID: {memberId}</p>
              </div>
              <div style={styles.avatar}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
                  alt="Profile"
                  style={styles.avatarImg}
                />
              </div>
            </div>
          </div>
        </header>

        {/* ── Page Content ──────────────────────────────────────────── */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Navigation (Hidden on Desktop) ───────────────────── */}
      <nav style={styles.mobileNav}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          const iconColor = active ? '#1b3664' : '#94a3b8';
          return (
            <button key={item.path} onClick={() => navigate(item.path)} style={styles.mobileNavItem}>
              {item.icon(iconColor)}
              {active && <div style={styles.activeDot} />}
            </button>
          );
        })}
      </nav>

      {/* Global CSS for responsiveness and layout switches */}
      <style>{`
        .sidebar-item:hover {
          background-color: #f1f5f9 !important;
          color: #1b3664 !important;
        }
        .sidebar-item:hover svg {
          stroke: #1b3664 !important;
        }
        .sidebar-item.active:hover {
          background-color: #1b3664 !important;
          color: #ffffff !important;
        }
        .sidebar-item.active:hover svg {
          stroke: #ffffff !important;
        }
        @media (max-width: 1023px) {
          aside { display: none !important; }
          div[style*="marginLeft"] { margin-left: 0 !important; }
          header { padding: 0 16px !important; }
          .headerSubtitle, .headerDivider, .profileInfo { display: none !important; }
          main { padding: 16px 16px 80px 16px !important; }
          nav[style*="mobileNav"] { display: flex !important; }
          .mobileLogo { display: flex !important; }
        }
        @media (min-width: 1024px) {
          nav[style*="mobileNav"] { display: none !important; }
          .mobileLogo { display: none !important; }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const SIDEBAR_WIDTH = '240px';
const HEADER_HEIGHT = '70px';

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  // Sidebar
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  sidebarBrand: {
    height: HEADER_HEIGHT,
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #f1f5f9',
  },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1b3664',
    letterSpacing: '-0.5px',
  },
  sidebarNav: {
    padding: '24px 12px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  sidebarLabel: {
    fontSize: '14px',
  },
  signOutBtn: {
    padding: '24px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#b91c1c',
  },
  signOutLabel: {
    fontSize: '14px',
    fontWeight: '600',
  },
  // Main Wrapper
  mainWrapper: {
    flex: 1,
    marginLeft: SIDEBAR_WIDTH,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1b3664',
  },
  headerDivider: {
    width: '1px',
    height: '20px',
    backgroundColor: '#e2e8f0',
  },
  headerSubtitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: '1px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  profileInfo: {
    textAlign: 'right',
  },
  profileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  profileId: {
    fontSize: '12px',
    color: '#64748b',
    margin: '2px 0 0 0',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid #f1f5f9',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  content: {
    flex: 1,
    padding: '40px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  // Mobile Nav
  mobileNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    display: 'none',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
  },
  mobileNavItem: {
    background: 'none',
    border: 'none',
    padding: '12px',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    bottom: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#1b3664',
  },
};

export default Layout;
