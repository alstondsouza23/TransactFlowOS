import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  ShieldCheck, Users, FileBarChart2, Activity,
  LogOut, Bell, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, ChevronRight,
} from 'lucide-react';
import { auth } from '../../firebase/firebaseConfig';
import useAuthStore from '../../store/authStore';

const stats = [
  {
    label: 'Total Employees',
    value: '1,248',
    delta: '+12 this week',
    positive: true,
    icon: Users,
    color: '#1a2f55',
    bg: '#eef1f8',
  },
  {
    label: 'Pending Approvals',
    value: '34',
    delta: '8 urgent',
    positive: false,
    icon: AlertTriangle,
    color: '#b45309',
    bg: '#fef3c7',
  },
  {
    label: 'Reports Generated',
    value: '562',
    delta: '+24 today',
    positive: true,
    icon: FileBarChart2,
    color: '#065f46',
    bg: '#d1fae5',
  },
  {
    label: 'System Uptime',
    value: '99.98%',
    delta: '↑ Last 30 days',
    positive: true,
    icon: Activity,
    color: '#1d4ed8',
    bg: '#dbeafe',
  },
];

const auditRows = [
  { id: 'USR-0041', action: 'KYC Approved',     time: '2 min ago',  status: 'success' },
  { id: 'USR-0039', action: 'Loan Disbursed',    time: '14 min ago', status: 'success' },
  { id: 'USR-0037', action: 'Login Attempt',     time: '31 min ago', status: 'warning' },
  { id: 'USR-0035', action: 'Report Exported',   time: '1 hr ago',   status: 'success' },
  { id: 'USR-0032', action: 'Group Modified',    time: '3 hr ago',   status: 'warning' },
];

function StatusBadge({ status }) {
  const map = {
    success: { label: 'Success', bg: '#d1fae5', color: '#065f46' },
    warning: { label: 'Review',  bg: '#fef3c7', color: '#92400e' },
  };
  const s = map[status] || map.success;
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 700, padding: '2px 9px',
        borderRadius: 20, background: s.bg, color: s.color,
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}
    >
      {s.label}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate     = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleSignOut = async () => {
    await signOut(auth);
    clearAuth();
    navigate('/login', { replace: true });
  };

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
            background: '#e0e7ff', color: '#3730a3',
            padding: '2px 9px', borderRadius: 20, letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Admin
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', display: 'flex' }}>
            <Bell size={20} />
          </button>
          <div style={{ fontSize: 13, color: '#bfdbfe', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? 'Administrator'}
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
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2f55', margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Welcome back. Here's what's happening across the system today.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18, marginBottom: 30 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: '#fff', borderRadius: 14, padding: '22px 24px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}
            >
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
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{ fontSize: 12, marginTop: 4, color: s.positive ? '#059669' : '#b45309', fontWeight: 600 }}>
                  {s.delta}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Audit Trail */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2f55', margin: 0 }}>
              Recent Audit Trail (WAL)
            </h2>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
            }}>
              View all <ChevronRight size={14} />
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['User ID', 'Action', 'Time', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', fontSize: 11, fontWeight: 700,
                    color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em',
                    paddingBottom: 10,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < auditRows.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '13px 0', fontSize: 13, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>{row.id}</td>
                  <td style={{ padding: '13px 0', fontSize: 13, color: '#334155' }}>{row.action}</td>
                  <td style={{ padding: '13px 0', fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={12} /> {row.time}
                  </td>
                  <td style={{ padding: '13px 0' }}>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
