import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Mail, Lock, Eye, EyeOff, Info,
  Shield, AlertCircle, Loader2,
} from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { resolveRole } from '../firebase/roleResolver';
import useAuthStore from '../store/authStore';

/** Map Firebase error codes to user-friendly messages. */
function getFriendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('employee');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState(null);       // general / firebase error
  const [roleError, setRoleError]       = useState(false);      // role mismatch flag

  const navigate   = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setRoleError(false);
    setIsLoading(true);

    try {
      // 1. Authenticate with Firebase
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      // 2. Resolve the actual role from Firebase data (email + UID check)
      const actualRole = resolveRole(firebaseUser.email, firebaseUser.uid);

      // 3. Compare with the UI-selected role
      if (selectedRole !== actualRole) {
        // Role mismatch — sign the user out immediately and block access
        await signOut(auth);
        setRoleError(true);
        setIsLoading(false);
        return;
      }

      // 4. Roles match — persist in global store and redirect
      setAuth(firebaseUser, actualRole);
      navigate(actualRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard', { replace: true });

    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-5 bg-bg-base">
      <div className="bg-white w-full max-w-[380px] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
        <div className="pt-8 px-6 pb-6">

          {/* Brand */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-brand-blue rounded-lg w-9 h-9 flex items-center justify-center text-white">
              <ShieldCheck size={22} fill="white" stroke="#1a2f55" />
            </div>
            <div className="text-2xl font-bold text-brand-blue tracking-tight">TransactFlowOS</div>
          </div>

          {/* Heading */}
          <div className="flex flex-col items-center text-center mb-5">
            <h1 className="text-2xl font-semibold text-brand-blue mb-2">System Access</h1>
            <p className="text-sm text-slate-400 leading-snug">
              Enter your credentials to access the TransactFlowOS Kernel.
            </p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-5">
            {['employee', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer capitalize ${
                  selectedRole === r
                    ? 'bg-white text-brand-blue shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => { setSelectedRole(r); setError(null); setRoleError(false); }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Role Mismatch Error Banner */}
          {roleError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-[13px] font-semibold text-red-700">Unauthorized Role</p>
                <p className="text-[12px] text-red-500 mt-0.5 leading-snug">
                  This account does not have <strong>{selectedRole}</strong> privileges.
                  Please select the correct role or contact your administrator.
                </p>
              </div>
            </div>
          )}

          {/* General Firebase Error Banner */}
          {error && !roleError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <p className="text-[13px] text-red-600 leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-4 flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 self-start">
                Registered Email
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 h-12 transition-colors duration-200 focus-within:border-brand-blue focus-within:bg-white">
                <Mail className="text-slate-400 mr-3 shrink-0" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-full text-[15px] text-slate-700 bg-transparent outline-none placeholder-slate-300"
                  placeholder="you@domain.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-4 flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 self-start">
                Access Key
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 h-12 transition-colors duration-200 focus-within:border-brand-blue focus-within:bg-white">
                <Lock className="text-slate-400 mr-3 shrink-0" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 h-full text-[15px] text-slate-700 bg-transparent outline-none placeholder-slate-300"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="text-slate-400 p-1 ml-2 flex items-center justify-center hover:text-slate-600 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Audit notice */}
            <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 mb-5">
              <Info className="text-slate-500 shrink-0 mt-0.5" size={18} />
              <p className="text-[13px] text-slate-500 leading-snug">
                By signing in, you acknowledge that all sessions are recorded in the
                system audit trail (WAL) for compliance.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#1f3763] hover:bg-[#142445] disabled:bg-[#1f3763]/60 disabled:cursor-not-allowed text-white h-12 rounded-lg text-[15px] font-semibold w-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating…
                </>
              ) : (
                'Sign In to Workspace'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 flex items-center justify-center gap-2 border-t border-slate-100">
          <Shield className="text-slate-500" size={14} />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Secured by OS-level encryption
          </span>
        </div>
      </div>

      <div className="mt-8 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
        TransactFlowOS Kernel Node: 127.0.0.1 // Build: V2.4.0-Stable
      </div>
    </div>
  );
}
