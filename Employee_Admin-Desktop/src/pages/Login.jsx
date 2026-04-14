import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Info, Shield } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [role, setRole] = useState('employee');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-card-content">
          <div className="login-header">
            <div className="logo-box">
              <ShieldCheck size={22} fill="white" stroke="#1a2f55" />
            </div>
            <div className="logo-text">TransactFlowOS</div>
          </div>

          <div className="login-titles">
            <h1 className="login-title">System Access</h1>
            <p className="login-subtitle">
              Enter your credentials to access the TransactFlowOS Kernel.
            </p>
          </div>

          <div className="role-toggle">
            <button 
              className={`role-toggle-btn ${role === 'employee' ? 'active' : ''}`}
              onClick={() => setRole('employee')}
            >
              Employee
            </button>
            <button 
              className={`role-toggle-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              Admin
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="employee@domain.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Access Key</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  className="input-field" 
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  className="input-action"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="info-box">
              <Info className="info-icon" size={18} />
              <p className="info-text">
                By signing in, you acknowledge that all sessions are recorded in the system audit trail (WAL) for compliance.
              </p>
            </div>

            <button type="submit" className="submit-button">
              Sign In to Workspace
            </button>
          </form>
        </div>

        <div className="login-card-footer">
          <Shield className="footer-icon" size={14} />
          <span className="footer-text">Secured by OS-level encryption</span>
        </div>
      </div>

      <div className="global-footer">
        TransactFlowOS Kernel Node: 127.0.0.1 // Build: V2.4.0-Stable
      </div>
    </div>
  );
}
