import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  ShieldCheck, CreditCard, Inbox, FileText,
  LogOut, Bell, CheckCircle2, Clock, ChevronRight,
  TrendingUp, UserCircle2, ArrowDownCircle,
} from 'lucide-react';
import { auth } from '../../firebase/firebaseConfig';
import useAuthStore from '../../store/authStore';

const stats = [
  {
    label: 'My Loan Applications',
    value: '3',
    delta: '1 pending review',
    positive: null,
    icon: FileText,
    color: '#1a2f55',
    bg: '#eef1f8',
  },
  {
    label: 'KYC Status',
    value: 'Verified',
    delta: 'Last updated 3 days ago',
    positive: true,
    icon: CheckCircle2,
    color: '#065f46',
    bg: '#d1fae5',
  },
  {
    label: 'Inbox Messages',
    value: '7',
    delta: '2 unread',
    positive: false,
    icon: Inbox,
    color: '#b45309',
    bg: '#fef3c7',
  },
  {
    label: 'Disbursements',
    value: '₹ 2.4L',
    delta: 'This quarter',
    positive: true,
    icon: ArrowDownCircle,
    color: '#1d4ed8',
    bg: '#dbeafe',
  },
];

const recentActivity = [
  { action: 'Loan application submitted',    time: '1 hr ago',   status: 'pending'  },
  { action: 'KYC document uploaded',         time: '2 hrs ago',  status: 'success'  },
  { action: 'Inbox message from Admin',      time: '5 hrs ago',  status: 'info'     },
  { action: 'EMI payment processed',         time: 'Yesterday',  status: 'success'  },
  { action: 'Default tracker entry updated', time: '2 days ago', status: 'pending'  },
];

const statusMap = {
  success: { label: 'Done',    bg: '#d1fae5', color: '#065f46' },
  pending: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  info:    { label: 'New',     bg: '#dbeafe', color: '#1e40af' },
};

function Badge({ status }) {
  const s = statusMap[status] || statusMap.info;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 9px',
      borderRadius: 20, background: s.bg, color: s.color,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {s.label}
    </span>
  );
}

export default function EmployeeDashboard() {
  const navigate           = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleSignOut = async () => {
    await signOut(auth);
    clearAuth();
    navigate('/login', { replace: true });
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Employee';

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top Nav ── */}
      <header style={{
        background: '#1a2f55', color: '#fff',
        padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(26,47,85,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={22} fill="white" stroke="#1a2f55" />
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
            TransactFlowOS
          </span>
          <span style={{
            marginLeft: 8, fontSize: 11, fontWeight: 700,
            background: '#d1fae5', color: '#065f46',
            padding: '2px 9px', borderRadius: 20,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Employee
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', display: 'flex' }}>
            <Bell size={20} />
          </button>
          <div style={{ fontSize: 13, color: '#bfdbfe', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? 'Employee'}
          </div>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', borderRadius: 8, padding: '6px 14px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <main style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{
          background: 'linear-gradient(130deg, #1a2f55 0%, #1d4ed8 100%)',
          borderRadius: 16, padding: '28px 30px',
          marginBottom: 28, display: 'flex', alignItems: 'center', gap: 18,
          boxShadow: '0 6px 24px rgba(26,47,85,0.18)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserCircle2 size={30} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
              Welcome back, {displayName}!
            </h1>
            <p style={{ fontSize: 13, color: '#bfdbfe', marginTop: 4 }}>
              Your workspace is active. Here's a summary of your account.
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 18, marginBottom: 30 }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 14, padding: '22px 24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{s.label}</span>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <s.icon size={18} color={s.color} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{
                  fontSize: 12, marginTop: 4, fontWeight: 600,
                  color: s.positive === true ? '#059669' : s.positive === false ? '#b45309' : '#64748b',
                }}>
                  {s.delta}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2f55', margin: 0 }}>
              Recent Activity
            </h2>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', color: '#3b82f6',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              View all <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentActivity.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 0',
                borderBottom: i < recentActivity.length - 1 ? '1px solid #f8fafc' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: item.status === 'success' ? '#10b981' : item.status === 'pending' ? '#f59e0b' : '#3b82f6',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, color: '#334155' }}>{item.action}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {item.time}
                  </span>
                  <Badge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
