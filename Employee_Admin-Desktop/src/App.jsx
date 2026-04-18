import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './providers/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AuditTrail from './pages/admin/AuditTrail';
import EmployeeDashboard from './pages/employee/Dashboard';
import KYCApprovals from './pages/employee/KYCApprovals';
import DefaultTracker from './pages/employee/DefaultTracker';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin — role-gated */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit-trail"
            element={
              <ProtectedRoute allowedRole="admin">
                <AuditTrail />
              </ProtectedRoute>
            }
          />

          {/* Employee — role-gated */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRole="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/kyc-approvals"
            element={
              <ProtectedRoute allowedRole="employee">
                <KYCApprovals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/recovery"
            element={
              <ProtectedRoute allowedRole="employee">
                <DefaultTracker />
              </ProtectedRoute>
            }
          />

          {/* Legacy / catch-all — redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
