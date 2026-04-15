import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/**
 * ProtectedRoute
 *
 * Wraps a route element and enforces role-based access:
 *   • loading  → render nothing (AuthProvider already shows spinner above)
 *   • no user  → redirect to /login
 *   • role mismatch → redirect to /login (server role wins, not UI toggle)
 *   • match    → render children
 *
 * @param {{ allowedRole: "admin" | "employee", children: React.ReactNode }} props
 */
export default function ProtectedRoute({ allowedRole, children }) {
  const { user, role, loading } = useAuthStore();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    // User is authenticated but has the wrong role — redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
}
