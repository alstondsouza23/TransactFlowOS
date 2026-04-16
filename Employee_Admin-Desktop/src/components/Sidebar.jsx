import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  UserCheck, 
  History, 
  LogOut,
  User,
  Activity,
  BarChart3
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ activePage }) {
  const { user, role, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    clearAuth();
    navigate('/login');
  };

  const employeeNavItems = [
    { name: 'Ops Dashboard', icon: LayoutDashboard, path: '/employee/dashboard' },
    { name: 'KYC Approvals', icon: UserCheck, path: '/employee/kyc-approvals' },
    { name: 'Recovery', icon: History, path: '/employee/recovery' },
  ];

  const adminNavItems = [
    { name: 'System Overview', icon: BarChart3, path: '/admin/dashboard' },
    { name: 'Audit Trail', icon: Activity, path: '/admin/audit-trail' },
  ];

  const isAdmin = role === 'admin';
  const navItems = isAdmin ? adminNavItems : employeeNavItems;
  const displayName = user?.displayName || user?.email?.split('@')[0] || (isAdmin ? 'Admin' : 'Employee');

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-100 flex flex-col sticky top-0">
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-brand-blue p-1.5 rounded-lg text-white shadow-sm shadow-brand-blue/20">
          <ShieldCheck size={24} fill="white" stroke="#1a2f55" />
        </div>
        <span className="font-bold text-xl text-brand-blue tracking-tight">TransactFlowOS</span>
      </div>

      {/* Menu Section */}
      <div className="flex-1 px-4 mt-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">
          {isAdmin ? 'Admin Menu' : 'Employee Menu'}
        </h3>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activePage === item.name 
                  ? 'bg-blue-50 text-brand-blue' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={18} className={activePage === item.name ? 'text-brand-blue' : 'text-slate-400'} />
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-slate-50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
               <User className="text-slate-400" size={24} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-slate-700 truncate capitalize">{displayName}</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                {role || 'user'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-black text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all w-full cursor-pointer group mt-2"
          >
            <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
