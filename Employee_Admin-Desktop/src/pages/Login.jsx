import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Info, Shield } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('employee');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-5 bg-bg-base">
      <div className="bg-white w-full max-w-[380px] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        <div className="pt-8 px-6 pb-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-brand-blue rounded-lg w-9 h-9 flex items-center justify-center text-white">
              <ShieldCheck size={22} fill="white" stroke="#1a2f55" />
            </div>
            <div className="text-2xl font-bold text-brand-blue tracking-tight">TransactFlowOS</div>
          </div>

          <div className="flex flex-col items-center text-center mb-5">
            <h1 className="text-2xl font-semibold text-brand-blue mb-2">System Access</h1>
            <p className="text-sm text-slate-400 leading-snug">
              Enter your credentials to access the TransactFlowOS Kernel.
            </p>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1 mb-5">
            <button 
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${
                role === 'employee' 
                  ? 'bg-white text-brand-blue shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setRole('employee')}
            >
              Employee
            </button>
            <button 
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${
                role === 'admin' 
                  ? 'bg-white text-brand-blue shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setRole('admin')}
            >
              Admin
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); navigate(role === 'admin' ? '/admin' : '/employee'); }}>
            <div className="mb-4 flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 self-start">Registered Email</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 h-12 transition-colors duration-200 focus-within:border-brand-blue focus-within:bg-white">
                <Mail className="text-slate-400 mr-3" size={18} />
                <input 
                  type="email" 
                  className="flex-1 h-full text-[15px] text-slate-700 bg-transparent outline-none placeholder-slate-300" 
                  placeholder="employee@domain.com"
                />
              </div>
            </div>

            <div className="mb-4 flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 self-start">Access Key</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 h-12 transition-colors duration-200 focus-within:border-brand-blue focus-within:bg-white">
                <Lock className="text-slate-400 mr-3" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  className="flex-1 h-full text-[15px] text-slate-700 bg-transparent outline-none placeholder-slate-300" 
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  className="text-slate-400 p-1 ml-2 flex items-center justify-center hover:text-slate-500 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 mb-5">
              <Info className="text-slate-500 shrink-0 mt-0.5" size={18} />
              <p className="text-[13px] text-slate-500 leading-snug">
                By signing in, you acknowledge that all sessions are recorded in the system audit trail (WAL) for compliance.
              </p>
            </div>

            <button type="submit" className="bg-[#1f3763] hover:bg-[#142445] text-white h-12 rounded-lg text-[15px] font-semibold w-full transition-colors duration-200 cursor-pointer">
              Sign In to Workspace
            </button>
          </form>
        </div>

        <div className="bg-slate-50 p-4 flex items-center justify-center gap-2 border-t border-slate-100">
          <Shield className="text-slate-500" size={14} />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Secured by OS-level encryption</span>
        </div>
      </div>

      <div className="mt-8 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
        TransactFlowOS Kernel Node: 127.0.0.1 // Build: V2.4.0-Stable
      </div>
    </div>
  );
}
