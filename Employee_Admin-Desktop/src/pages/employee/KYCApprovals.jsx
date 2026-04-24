/**
 * src/pages/employee/KYCApprovals.jsx
 *
 * KYC Management — live data from wsStore.kycQueue.
 * Approve / Reject actions sent to WS backend → Firestore updated → broadcast back.
 */

import React, { useState, useCallback } from 'react';
import {
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Eye,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import KernelMonitor from '../../components/KernelMonitor';
import useWsStore from '../../store/wsStore';
import { useWsAction } from '../../providers/WebSocketProvider';

// ─────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

const MetricCard = ({ title, value, subtext, isPositive, trend }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
    <div className="flex items-baseline gap-3">
      <span className="text-2xl font-extrabold text-slate-800">{value}</span>
      {trend && (
        <span className={`text-[11px] font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </span>
      )}
      {subtext && !trend && (
        <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
          {subtext}
        </span>
      )}
    </div>
  </div>
);

const KYCStatusBadge = ({ status, reason }) => {
  const styles = {
    Approved: 'bg-emerald-50 text-emerald-600',
    Pending:  'bg-slate-100 text-slate-500',
    Rejected: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${styles[status] ?? styles.Pending}`}>
        {status}
      </span>
      {reason && <span className="text-[10px] font-medium text-rose-400 italic">{reason}</span>}
    </div>
  );
};

/** Inline reject modal — small popover with a reason input */
function RejectModal({ docId, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-black text-slate-800">Reject KYC</h3>
        <p className="text-xs text-slate-500 font-medium">Provide a brief rejection reason (shown to the member).</p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-rose-300 resize-none"
          rows={3}
          placeholder="e.g. Blurred PAN card image"
        />
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="flex-1 py-2 bg-rose-500 text-white rounded-lg text-sm font-bold hover:bg-rose-600 transition-all disabled:opacity-40"
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

export default function KYCApprovals() {
  const { sendAction } = useWsAction();
  const connected      = useWsStore((s) => s.connected);
  const kycQueue       = useWsStore((s) => s.kycQueue);

  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('All Statuses');
  const [page,       setPage]       = useState(0);
  const [rejectId,   setRejectId]   = useState(null); // doc id open in reject modal
  const [pendingId,  setPendingId]  = useState(null); // doc id with spinner

  // ── Derived metric cards ──────────────────────────────────────
  const pendingCount  = kycQueue.filter((d) => d.status === 'Pending').length;
  const approvedCount = kycQueue.filter((d) => d.status === 'Approved').length;
  const rejectedCount = kycQueue.filter((d) => d.status === 'Rejected').length;
  const total         = kycQueue.length;
  const approvalRate  = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  // ── Filtered + paginated list ─────────────────────────────────
  const filtered = kycQueue.filter((d) => {
    const matchFilter = filter === 'All Statuses' || d.status === filter;
    const matchSearch = !search ||
      d.member_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.pan_masked?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Actions ──────────────────────────────────────────────────
  const handleApprove = useCallback((id) => {
    setPendingId(id);
    sendAction({ channel: 'kyc_queue', action: 'approve', payload: { id } });
    setTimeout(() => setPendingId(null), 2000);
  }, [sendAction]);

  const handleRejectConfirm = useCallback((reason) => {
    if (!rejectId) return;
    setPendingId(rejectId);
    sendAction({ channel: 'kyc_queue', action: 'reject', payload: { id: rejectId, reason } });
    setRejectId(null);
    setTimeout(() => setPendingId(null), 2000);
  }, [rejectId, sendAction]);

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar activePage="KYC Approvals" />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50 w-full">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">KYC Management</h1>
            <div className="flex items-center gap-4">
              {/* Connection pill */}
              {!connected && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                  <Loader2 size={11} className="animate-spin" /> Reconnecting…
                </div>
              )}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none w-64 shadow-sm focus:border-brand-blue/30 transition-all"
                />
              </div>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all cursor-pointer relative group border border-transparent hover:border-slate-100 shadow-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] group-hover:border-white animate-pulse" />
              </button>
            </div>
          </header>

          <main className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">

            {/* Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="Pending KYC"       value={pendingCount}         trend={pendingCount > 0 ? `${pendingCount} waiting` : 'None pending'} isPositive={pendingCount === 0} />
              <MetricCard title="Approval Rate"      value={`${approvalRate}%`}   trend={`${approvedCount} approved`}  isPositive={approvalRate >= 80} />
              <MetricCard title="Rejected"           value={rejectedCount}        trend={rejectedCount > 0 ? 'Action needed' : 'None'} isPositive={rejectedCount === 0} />
              <MetricCard title="Total in Queue"     value={total}                trend="Real-time" isPositive={true} />
            </section>

            {/* Controls */}
            <section className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name or PAN..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-brand-blue/20 transition-all"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => { setFilter(e.target.value); setPage(0); }}
                  className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-sm text-slate-600 outline-none hover:bg-white transition-all cursor-pointer min-w-[160px]"
                >
                  <option>All Statuses</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                  <Download size={16} />
                  Export CSV
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-[#1a2f55] text-white rounded-lg text-sm font-bold hover:bg-[#142445] transition-all shadow-lg shadow-brand-blue/20 cursor-pointer group">
                  <Play size={16} fill="white" className="group-hover:scale-110 transition-transform" />
                  Run Auto-Check
                </button>
              </div>
            </section>

            {/* Table */}
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Applicant Details</th>
                      <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identifiers</th>
                      <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verification Docs</th>
                      <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium">
                          {kycQueue.length === 0 ? 'Waiting for data from backend…' : 'No results match your filters'}
                        </td>
                      </tr>
                    ) : paginated.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{req.member_name}</span>
                            <span className="text-[11px] font-medium text-slate-400">{req.phone}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="grid grid-cols-[36px_1fr] gap-x-2 gap-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase self-center bg-slate-100 px-1 rounded inline-block w-fit">PAN</span>
                            <span className="text-[11px] font-bold text-slate-600 font-mono tracking-tight">{req.pan_masked}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase self-center bg-slate-100 px-1 rounded inline-block w-fit">BANK</span>
                            <span className="text-[11px] font-bold text-slate-600 font-mono tracking-tight">{req.bank_masked}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer">
                              <Eye size={14} /> Identity
                            </button>
                            <span className="text-slate-200">|</span>
                            <button className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer">
                              <ExternalLink size={14} /> Passbook
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <KYCStatusBadge status={req.status} reason={req.rejection_reason} />
                        </td>
                        <td className="p-4 text-right">
                          {req.status === 'Pending' && (
                            <div className="flex items-center gap-2 justify-end">
                              {pendingId === req.id ? (
                                <Loader2 size={16} className="animate-spin text-slate-400" />
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleApprove(req.id)}
                                    title="Approve"
                                    className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  >
                                    <CheckCircle2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => setRejectId(req.id)}
                                    title="Reject"
                                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[13px] text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-700">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)}</span> of <span className="font-bold text-slate-700">{filtered.length}</span> requests
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`w-8 h-8 rounded-lg text-[13px] font-bold border ${
                          page === i
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'text-slate-500 border-transparent hover:bg-slate-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </section>

            <div className="flex items-center justify-center gap-3 py-4 opacity-70">
              <div className="bg-slate-100 p-1.5 rounded-full border border-slate-200 flex flex-shrink-0">
                <ShieldCheck size={14} className="text-slate-400" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                All verification actions are cryptographically signed and recorded to the audit trail
              </p>
            </div>
          </main>
        </div>

        <KernelMonitor />
      </div>

      {/* Reject modal */}
      {rejectId && (
        <RejectModal
          docId={rejectId}
          onClose={() => setRejectId(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
}
