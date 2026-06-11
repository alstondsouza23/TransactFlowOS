import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './providers/AuthProvider';
import WebSocketProvider from './providers/WebSocketProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard    from './pages/admin/Dashboard';
import AuditTrail        from './pages/admin/AuditTrail';
import EmployeeDashboard from './pages/employee/Dashboard';
import KYCApprovals      from './pages/employee/KYCApprovals';
import LoanInbox         from './pages/employee/LoanInbox';
import DefaultTracker    from './pages/employee/DefaultTracker';
import AuctionManagement from './pages/employee/AuctionManagement';
import RiskAnalysis      from './pages/shared/RiskAnalysis';


function App() {
  return (
    <Router>
      <AuthProvider>
        <WebSocketProvider>
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
            path="/employee/loan-inbox"
            element={
              <ProtectedRoute allowedRole="employee">
                <LoanInbox />
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

          <Route
            path="/admin/risk-analysis"
            element={
              <ProtectedRoute allowedRole="admin">
                <div className="flex h-screen bg-[#f6f8fb] overflow-hidden">
                  <RiskAnalysis groupId="GRP-001" />
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/risk-analysis"
            element={
              <ProtectedRoute allowedRole="employee">
                <div className="flex h-screen bg-[#f6f8fb] overflow-hidden">
                  <RiskAnalysis groupId="GRP-001" />
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/auction"
            element={
              <ProtectedRoute allowedRole="employee">
                <AuctionManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/auction"
            element={
              <ProtectedRoute allowedRole="admin">
                <AuctionManagement />
              </ProtectedRoute>
            }
          />


          {/* Legacy / catch-all — redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
