import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import useAuthStore from '../store/authStore';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Card: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  File: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Chart: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
};

// ── Dummy Data ────────────────────────────────────────────────────────────────
const user = { name: 'Rajesh', id: 'TF-8829' };

const paymentDue = { amount: '₹5,000', dueDate: 'Oct 10, 2024', daysLeft: 7 };

const secondaryCards = [
  { label: 'Total Contributed', value: '₹55,000' },
  { label: 'Active Loan', value: '₹1,06,800' },
];

const miniMetrics = [
  { label: 'Missed Payments', value: '0' },
  { label: 'Payment Streak', value: '7 Months' },
];

const quickActions = [
  { label: 'Pay Dues', icon: <Icons.Card />, path: '/contributions', primary: true },
  { label: 'Apply Loan', icon: <Icons.File />, path: '/loans', primary: false },
  { label: 'Contributions', icon: <Icons.Chart />, path: '/contributions', primary: false },
  { label: 'Group Info', icon: <Icons.Users />, path: '/group', primary: false },
];

const recentActivity = [
  { id: 1, label: 'Sep Contribution', date: 'Sep 10, 2024', amount: '₹5,000', status: 'Paid', statusColor: '#047857', statusBg: '#f0fdf4', statusBorder: '#bbf7d0' },
  { id: 2, label: 'Loan EMI Payment', date: 'Aug 15, 2024', amount: '₹2,450', status: 'EMI', statusColor: '#1d4ed8', statusBg: '#eff6ff', statusBorder: '#bfdbfe' },
  { id: 3, label: 'Jul Contribution', date: 'Jul 10, 2024', amount: '₹5,000', status: 'Overdue', statusColor: '#b91c1c', statusBg: '#fef2f2', statusBorder: '#fecaca' },
  { id: 4, label: 'Jun Contribution', date: 'Jun 10, 2024', amount: '₹5,000', status: 'Paid', statusColor: '#047857', statusBg: '#f0fdf4', statusBorder: '#bbf7d0' },
];

// ── Component ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const displayName = useAuthStore((s) => s.displayName) ?? 'Member';
  const uid         = useAuthStore((s) => s.uid) ?? '';

  // Show first 8 chars of UID as a short member identifier
  const memberId = uid ? uid.slice(0, 8).toUpperCase() : '—';

  return (
    <div style={s.page}>
      {/* Redundant header removed - now handled by Layout.jsx */}

      {/* ── Payment Due Hero Card ────────────────────────────────── */}
      <div style={s.dueCard}>
        <div style={s.dueTop}>
          <div>
            <p style={s.dueLabel}>Payment Due</p>
            <p style={s.dueAmount}>{paymentDue.amount}</p>
            <p style={s.dueDate}>Due on {paymentDue.dueDate}</p>
          </div>
          <div style={s.dueBadge}>{paymentDue.daysLeft} days left</div>
        </div>
        <button style={s.payNowBtn} onClick={() => navigate('/contributions')}>
          Pay Now
        </button>
      </div>

      {/* ── Secondary Cards (2-column) ───────────────────────────── */}
      <div style={s.secondaryGrid}>
        {secondaryCards.map((card) => (
          <div key={card.label} style={s.secondaryCard}>
            <p style={s.secondaryValue}>{card.value}</p>
            <p style={s.secondaryLabel}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── Mini Metrics ─────────────────────────────────────────── */}
      <div style={s.metricsRow}>
        {miniMetrics.map((m) => (
          <div key={m.label} style={s.metricCard}>
            <p style={s.metricValue}>{m.value}</p>
            <p style={s.metricLabel}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Quick Actions</p>
        <div style={s.actionsRow}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              style={{
                ...s.actionBtn,
                backgroundColor: action.primary ? '#f8fafc' : '#ffffff',
                borderColor: action.primary ? '#cbd5e1' : '#e2e8f0',
                color: '#0f172a',
              }}
              onClick={() => navigate(action.path)}
            >
              <span style={{ ...s.actionIcon, color: action.primary ? '#0f172a' : '#64748b' }}>{action.icon}</span>
              <span style={s.actionLabel}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Activity ───────────────────────────────────────── */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <p style={s.sectionTitle}>Recent Activity</p>
          <span style={s.viewAll} onClick={() => navigate('/contributions')}>View All</span>
        </div>
        <div style={s.activityCard}>
          {recentActivity.map((item, index) => (
            <div
              key={item.id}
              style={{
                ...s.activityItem,
                borderBottom: index < recentActivity.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}
            >
              <div style={s.activityLeft}>
                <p style={s.activityLabel}>{item.label}</p>
                <p style={s.activityDate}>{item.date}</p>
              </div>
              <div style={s.activityRight}>
                <p style={s.activityAmount}>{item.amount}</p>
                <span style={{
                  ...s.statusBadge,
                  color: item.statusColor,
                  backgroundColor: item.statusBg,
                  border: `1px solid ${item.statusBorder}`
                }}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    padding: '0 0 60px',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, -apple-system, sans-serif',
    boxSizing: 'border-box',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  greeting: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  memberId: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '400',
    margin: '4px 0 0 0',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    color: '#0f172a',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #cbd5e1',
  },
  // Due Card
  dueCard: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #1e293b',
  },
  dueTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  dueLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#94a3b8',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  dueAmount: {
    fontSize: '36px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 6px 0',
    letterSpacing: '-1px',
  },
  dueDate: {
    fontSize: '14px',
    color: '#cbd5e1',
    margin: 0,
    fontWeight: '400',
  },
  dueBadge: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontSize: '11px',
    fontWeight: '500',
    padding: '6px 12px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    border: '1px solid #334155',
  },
  payNowBtn: {
    width: '100%',
    height: '50px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Secondary Cards
  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '12px',
  },
  secondaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  secondaryValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  secondaryLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
    margin: 0,
  },
  // Mini Metrics
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '32px',
  },
  metricCard: {
    borderRadius: '10px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
  },
  metricLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
    margin: 0,
  },
  // Sections
  section: { marginBottom: '32px' },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
  },
  viewAll: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    cursor: 'pointer',
    margin: 0,
  },
  // Quick Actions
  actionsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  actionBtn: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  actionIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: '11px',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: '1.2',
  },
  // Activity
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
  },
  activityLeft: { flex: 1 },
  activityLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  activityDate: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
  },
  activityRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
  },
  activityAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
  },
  statusBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
};

export default Dashboard;