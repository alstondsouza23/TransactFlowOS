import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './providers/AuthProvider';
import Layout       from './components/Layout';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Contributions from './pages/Contributions';
import Loans        from './pages/Loans';
import GroupOverview from './pages/GroupOverview';
import Agreement    from './pages/Agreement';
import useAuthStore  from './store/authStore';

// ── Protected Route ───────────────────────────────────────────────
// Redirects to / (login) if the user is not authenticated.
// `loading` is always false by the time this renders (AuthProvider blocks until resolved).
const ProtectedRoute = ({ children }) => {
  const uid = useAuthStore((s) => s.uid);
  if (!uid) return <Navigate to="/" replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login — full-screen, no layout wrapper */}
          <Route path="/" element={<Login />} />

          {/* All authenticated pages share the Layout wrapper */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/contributions" element={<Contributions />} />
            <Route path="/loans"         element={<Loans />} />
            <Route path="/group"         element={<GroupOverview />} />
            <Route path="/agreement"     element={<Agreement />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
