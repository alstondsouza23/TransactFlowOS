/**
 * src/pages/employee/Dashboard.jsx
 *
 * Employee Ops Dashboard — all data is live from wsStore (Firestore via WS).
 *
 * Stat Cards     → derived from loanApplications + recoveryCases
 * Loan Inbox     → loanApplications (real-time)
 * Live Activity  → auditLog (real-time, newest first)
 */

import React, { useState } from 'react';
import {
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  User,
  ArrowUpRight,
  Filter,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import KernelMonitor from '../../components/KernelMonitor';
import useAuthStore from '../../store/authStore';
import useWsStore from '../../store/wsStore';
import { useWsAction } from '../../providers/WebSocketProvider';

// ─────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────

/** Format a number in Indian locale (₹1,00,000) */
function fmtInr(amount) {
  if (amount == null) return '—';
  return Number(amount).toLocaleString('en-IN');
}

/** Risk score → tailwind colour class */
function riskColor(score) {
  if (score >= 800) return 'text-emerald-500';
  if (score >= 700) return 'text-amber-500';
  return 'text-rose-500';
}

/** ISO timestamp → relative display ("2 hrs ago", "HH:MM") */
function fmtRelative(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffH = diffMs / 1000 / 3600;
  if (diffH < 1)   return `${Math.round(diffMs / 60000)} min ago`;
  if (diffH < 24)  return `${Math.round(diffH)} hrs ago`;
  if (diffH < 48)  return 'Yesterday';
  return `${Math.round(diffH / 24)} days ago`;
}

/** ISO → "HH:MM" */
function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

const StatusStyles = {
  Pending:   'bg-slate-100 text-slate-500',
  Verified:  'bg-emerald-50 text-emerald-600',
  Reviewing: 'bg-blue-50 text-blue-600',
  Rejected:  'bg-rose-50 text-rose-500',
};

function LoanApplicationCard({ doc }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { sendAction } = useWsAction();

  const {
    id,
    applicant_name,
    requested_amount_inr,
    submitted_at,
    status,
    risk_score,
  } = doc;

  const handleFastTrack = (e) => {
    e.stopPropagation();
    sendAction({ channel: 'loan_inbox', action: 'fast_track', payload: { id } });
  };

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${isExpanded ? 'ring-2 ring-brand-blue/20 bg-blue-50/10' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-brand-blue transition-colors">
            <User size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-700 text-sm">{applicant_name}</h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {fmtRelative(submitted_at)}
            </span>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${StatusStyles[status] ?? 'bg-slate-100 text-slate-500'}`}>
          {status}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Requested Amount</span>
          <span className="text-lg font-black text-[#1a2f55]">₹ {fmtInr(requested_amount_inr)}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Risk Score</span>
          <span className={`text-sm font-black ${riskColor(risk_score)}`}>{risk_score ?? '—'}</span>
        </div>
      </div>

      {isExpanded && status !== 'Verified' && status !== 'Rejected' && (
        <div className="mt-6 pt-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <button
              onClick={handleFastTrack}
              className="flex-1 py-2 bg-[#1a2f55] text-white text-[11px] font-black rounded-lg hover:bg-[#142445] transition-all"
            >
              Fast-Track Approve
            </button>
            <button className="px-3 py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-all">
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ title, value, trend, isUp, icon: Icon }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-1 min-w-[220px] group hover:border-brand-blue/30 transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
        <Icon size={20} className="text-slate-500 group-hover:text-brand-blue" />
      </div>
      <div className={`flex items-center gap-1 text-[11px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isUp ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
        {trend}
      </div>
    </div>
    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">{title}</span>
    <span className="text-3xl font-black text-[#1a2f55]">{value}</span>
  </div>
);

function ActivityItem({ entry }) {
  const time   = fmtTime(entry.timestamp);
  const actor  = entry.actor_name || 'System';
  const action = entry.action_code?.replace(/_/g, ' ') ?? '—';
  const amount = entry.amount_inr ? `₹ ${fmtInr(entry.amount_inr)}` : entry.entity_type ?? '';

  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-slate-200 mt-2 group-hover:bg-brand-blue transition-colors" />
        <div className="flex-1 w-[1px] bg-slate-100 my-1" />
      </div>
      <div className="flex-1 pb-6">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold text-slate-400">{time}</span>
          <span className="text-[11px] font-black text-slate-700">{amount}</span>
        </div>
        <p className="text-[13px] font-bold text-slate-600 mt-1 capitalize">{action.toLowerCase()}</p>
        <span className="text-[10px] text-slate-400 font-medium">Actor: {actor}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Connection status banner
// ─────────────────────────────────────────────────────────────────
function ConnectionBanner() {
  const connected = useWsStore((s) => s.connected);
  const hasData   = useWsStore((s) => s.loanApplications.length > 0 || s.auditLog.length > 0);

  if (connected) return null;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${
      hasData
        ? 'bg-amber-50 text-amber-600 border border-amber-200'
        : 'bg-rose-50 text-rose-600 border border-rose-200'
    }`}>
      {hasData
        ? <><Loader2 size={14} className="animate-spin" /> Reconnecting — showing last known data</>
        : <><AlertTriangle size={14} /> Backend offline — start with: cd Backend &amp;&amp; python main.py</>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const loanApplications = useWsStore((s) => s.loanApplications);
  const auditLog         = useWsStore((s) => s.auditLog);
  const recoveryCases    = useWsStore((s) => s.recoveryCases);

  // ── Derived stat card values ──────────────────────────────────
  const activeApps   = loanApplications.filter((a) => a.status !== 'Rejected').length;
  const disbursed    = loanApplications
    .filter((a) => a.status === 'Verified')
    .reduce((sum, a) => sum + (a.requested_amount_inr || 0), 0);
  const riskWarnings = loanApplications.filter((a) => (a.risk_score ?? 999) < 700).length;

  // ── Filtered loan list ────────────────────────────────────────
  const filteredLoans = loanApplications.filter((a) =>
    !search || a.applicant_name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Activity feed (20 newest) ─────────────────────────────────
  const activityFeed = auditLog.slice(0, 20);

  // ── Disbursed display ─────────────────────────────────────────
  const disbursedDisplay =
    disbursed >= 100000
      ? `₹ ${(disbursed / 100000).toFixed(1)} L`
      : `₹ ${fmtInr(disbursed)}`;

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar activePage="Ops Dashboard" />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50 w-full shrink-0">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">Ops Center Overview</h1>
            <div className="flex items-center gap-4">
              <ConnectionBanner />
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue" size={16} />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none w-64 shadow-sm focus:border-brand-blue/20 transition-all"
                />
              </div>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all cursor-pointer relative group border border-slate-100/50 shadow-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] group-hover:border-white animate-pulse" />
              </button>
            </div>
          </header>

          <main className="p-8 space-y-10 max-w-[1400px] mx-auto w-full pb-12">

            {/* Stat Cards */}
            <div className="flex flex-wrap gap-6">
              <StatCard
                title="Active Applications"
                value={activeApps}
                trend={`${activeApps} total`}
                isUp={true}
                icon={ShieldCheck}
              />
              <StatCard
                title="Total Disbursed"
                value={disbursedDisplay}
                trend="Verified loans"
                isUp={true}
                icon={TrendingUp}
              />
              <StatCard
                title="Risk Warnings"
                value={riskWarnings}
                trend={riskWarnings > 0 ? 'Score < 700' : 'All clear'}
                isUp={riskWarnings === 0}
                icon={AlertTriangle}
              />
            </div>

            <div className="grid grid-cols-12 gap-8 items-start">
              {/* Left: Loan Applications */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="flex items-end justify-between px-1">
                  <div>
                    <h3 className="text-lg font-black text-[#1a2f55] tracking-tight">Loan Application Inbox</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                      {filteredLoans.length} application{filteredLoans.length !== 1 ? 's' : ''} — real-time
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <Filter size={14} /> Filter
                  </button>
                </div>

                {filteredLoans.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm font-medium">
                    {loanApplications.length === 0
                      ? 'Waiting for data from backend…'
                      : 'No applications match your search'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLoans.map((doc) => (
                      <LoanApplicationCard key={doc.id} doc={doc} />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Live Activity */}
              <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-700 tracking-tight">Live Activity</h3>
                  <span className="text-[10px] font-black bg-brand-blue/10 text-brand-blue px-2 py-1 rounded-lg uppercase tracking-widest">
                    Real-time
                  </span>
                </div>

                <div className="space-y-6">
                  {activityFeed.length === 0
                    ? <p className="text-xs text-slate-400 font-medium">No activity yet…</p>
                    : activityFeed.map((entry) => (
                        <ActivityItem key={entry.id} entry={entry} />
                      ))
                  }
                </div>

                <button className="w-full py-3 bg-slate-50 text-slate-400 text-xs font-black rounded-xl hover:bg-slate-100 transition-all uppercase tracking-widest">
                  View All Logs
                </button>
              </div>
            </div>
          </main>
        </div>

        <KernelMonitor />
      </div>
    </div>
  );
}
