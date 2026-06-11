import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthProvider from './providers/AuthProvider';
import Layout       from './components/Layout';
import useAuthStore  from './store/authStore';
import Toast         from './components/Toast';

// ── Lazy Loaded Pages ──────────────────────────────────────────────
const Login         = lazy(() => import('./pages/Login'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const Contributions = lazy(() => import('./pages/Contributions'));
const Loans         = lazy(() => import('./pages/Loans'));
const GroupOverview = lazy(() => import('./pages/GroupOverview'));
const Agreement     = lazy(() => import('./pages/Agreement'));
const RiskAnalysis  = lazy(() => import('./pages/shared/RiskAnalysis'));
const AuctionRoom   = lazy(() => import('./pages/AuctionRoom'));
import WebSocketProvider from './providers/WebSocketProvider';

// ── Page Loading Spinner (shown inside Layout while a page chunk loads) ──
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    color: '#1b3664',
    fontFamily: '"Inter", sans-serif',
    fontWeight: '700',
    fontSize: 15,
    gap: 12,
  }}>
    <span style={{
      width: 20, height: 20,
      border: '3px solid #e2e8f0',
      borderTop: '3px solid #1b3664',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'appSpin 0.75s linear infinite',
    }} />
    Loading…
    <style>{`@keyframes appSpin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Auth Loading Spinner (full-screen, before Layout mounts) ─────
const AuthLoader = () => (
  <div style={{
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  }}>
    <span style={{
      width: 32, height: 32,
      border: '3px solid #e2e8f0',
      borderTop: '3px solid #1b3664',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'appSpin 0.75s linear infinite',
    }} />
    <style>{`@keyframes appSpin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Protected Layout wrapper ──────────────────────────────────────
// Layout is rendered eagerly (not lazy) so it never suspends.
// Only the child pages inside <Outlet> are lazy-loaded.
const ProtectedLayout = () => {
  const uid = useAuthStore((s) => s.uid);
  if (!uid) return <Navigate to="/" replace />;
  return (
    <Layout />   // Layout renders <Outlet /> internally
  );
};

// ── App ───────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Toast />
        <Router>
          <Routes>
            {/* Public */}
            <Route
              path="/"
              element={
                <Suspense fallback={<AuthLoader />}>
                  <Login />
                </Suspense>
              }
            />

            {/* Protected — Layout is eager; only the Outlet content is lazy */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard"     element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
              <Route path="/contributions" element={<Suspense fallback={<PageLoader />}><Contributions /></Suspense>} />
              <Route path="/loans"         element={<Suspense fallback={<PageLoader />}><Loans /></Suspense>} />
              <Route path="/group"         element={<Suspense fallback={<PageLoader />}><GroupOverview /></Suspense>} />
              <Route path="/agreement"     element={<Suspense fallback={<PageLoader />}><Agreement /></Suspense>} />
              <Route path="/risk-analysis" element={<Suspense fallback={<PageLoader />}><RiskAnalysis /></Suspense>} />
              <Route path="/auction"       element={<Suspense fallback={<PageLoader />}><AuctionRoom /></Suspense>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
