/**
 * src/pages/employee/KYCApprovals.jsx
 *
 * KYC Management — live Firestore data via onSnapshot on `kyc_queue`.
 * Clients submit KYC to kyc_queue via KYCSubmitModal.
 * Approve/Reject actions:
 *   1. Update kyc_queue/{docId}  → drives this queue view
 *   2. Update users/{userId}     → drives the Client's kycStatus badge
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, addDoc, serverTimestamp, getCountFromServer,
} from 'firebase/firestore';
import {
  Bell, Search, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, Download, Play,
  Eye, ExternalLink, ShieldCheck, AlertTriangle,
  Loader2, XCircle, CheckCircle2,
} from 'lucide-react';

import { db }         from '../../lib/firestore';
import Sidebar        from '../../components/Sidebar';
import KernelMonitor  from '../../components/KernelMonitor';
import useAuthStore   from '../../store/authStore';
import { useWsAction } from '../../providers/WebSocketProvider';
import { fmtName } from '../../lib/fmtName';
import { exportCsv } from '../../lib/exportCsv';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function todayMidnightUTC() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────
const MetricCard = ({ title, value, trend, isPositive, loading }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
    <div className="flex items-baseline gap-3">
      {loading ? (
        <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
      ) : (
        <span className="text-2xl font-extrabold text-slate-800">{value}</span>
      )}
      {trend && !loading && (
        <span className={`text-[11px] font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
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
      {reason && <span className="text-[10px] font-medium text-rose-400 italic max-w-[180px] leading-tight">{reason}</span>}
    </div>
  );
};

function RejectModal({ onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
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
          <button onClick={onClose}
            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}
            className="flex-1 py-2 bg-rose-500 text-white rounded-lg text-sm font-bold hover:bg-rose-600 transition-all disabled:opacity-40">
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
  const user = useAuthStore((s) => s.user);

  // ── Firestore live state ──────────────────────────────────────
  const [kycDocs,       setKycDocs]       = useState([]);
  const [dataLoading,   setDataLoading]   = useState(true);
  const [approvedToday, setApprovedToday] = useState(0);
  const [approvedTotal, setApprovedTotal] = useState(0);

  // ── UI state ──────────────────────────────────────────────────
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('All Statuses');
  const [page,      setPage]      = useState(0);
  const [rejectDoc, setRejectDoc] = useState(null); // { id, name }
  const [pendingId, setPendingId] = useState(null);
  const [toast,     setToast]     = useState(null);

  // ── Firestore onSnapshot — kyc_queue where status in Pending|Rejected ──
  useEffect(() => {
    const q = query(
      collection(db, 'kyc_queue'),
      where('status', 'in', ['Pending', 'Rejected'])
    );

    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setKycDocs(docs);
      setDataLoading(false);

      // ── Approved today count (from kyc_queue) ─────────────
      try {
        const todayQ = query(
          collection(db, 'kyc_queue'),
          where('approvedAt', '>=', todayMidnightUTC())
        );
        const todaySnap = await getCountFromServer(todayQ);
        setApprovedToday(todaySnap.data().count);

        const totalQ = query(
          collection(db, 'kyc_queue'),
          where('status', '==', 'Approved')
        );
        const totalSnap = await getCountFromServer(totalQ);
        setApprovedTotal(totalSnap.data().count);
      } catch (e) {
        console.warn('[KYC] count query failed:', e.message);
      }
    }, (err) => {
      console.error('[KYCApprovals] snapshot error:', err);
      setDataLoading(false);
    });

    return () => unsub();
  }, []);

  // ── Derived metrics ───────────────────────────────────────────
  const pendingCount  = kycDocs.filter((d) => d.status === 'Pending').length;
  const rejectedCount = kycDocs.filter((d) => d.status === 'Rejected').length;
  const totalProcessed = approvedTotal + rejectedCount;
  const approvalRate  = totalProcessed > 0
    ? Math.round((approvedTotal / totalProcessed) * 100)
    : 0;

  // ── Filtered + paginated list ─────────────────────────────────
  const filtered = kycDocs.filter((d) => {
    const matchFilter = filter === 'All Statuses' || d.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      fmtName(d.name).toLowerCase().includes(q) ||
      d.name?.toLowerCase().includes(q) ||
      d.panMasked?.toLowerCase().includes(q) ||
      d.phone?.includes(search);
    return matchFilter && matchSearch;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Show ephemeral toast ──────────────────────────────────────
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Approve ───────────────────────────────────────────────────
  const handleApprove = useCallback(async (docId, name, userUid) => {
    const actorUid  = user?.uid  ?? 'unknown';
    const actorName = user?.displayName || user?.email || 'Employee';

    setPendingId(docId);
    try {
      // 1. Update kyc_queue document
      await updateDoc(doc(db, 'kyc_queue', docId), {
        status:       'Approved',
        approvedBy:   actorUid,
        approvedAt:   serverTimestamp(),
      });

      // 2. Dual-write: update users/{uid} so Client badge reflects immediately
      if (userUid) {
        try {
          await updateDoc(doc(db, 'users', userUid), {
            kycStatus:     'Approved',
            userType:      'loan_eligible',
            kycApprovedAt: serverTimestamp(),
            kycApprovedBy: actorUid,
          });
        } catch (e) {
          console.warn('[KYC] users update failed (rules?):', e.message);
        }
      }

      // 3. Audit log
      await addDoc(collection(db, 'audit_log'), {
        action:      'KYC_APPROVED',
        action_code: 'KYC_APPROVE',
        actorUid,
        actorName,
        actor_name:  actorName,
        actor_uid:   actorUid,
        targetUid:   userUid || docId,
        targetName:  name,
        entity_type: 'KYC',
        entity_id:   docId,
        amount_inr:  0,
        details:     `KYC approved by ${actorName} for ${name}`,
        timestamp:   serverTimestamp(),
      });

      showToast(`KYC approved for ${name}`);
    } catch (err) {
      console.error('[KYC approve]', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setPendingId(null);
    }

    // 4. Fire-and-forget WS broadcast
    try {
      sendAction({
        channel: 'kyc_queue',
        action:  'approved',
        payload: { kyc_id: docId, uid: userUid, actor: actorName },
      });
    } catch { /* WS disconnected — ignore */ }
  }, [user, sendAction]);

  // ── Reject ────────────────────────────────────────────────────
  const handleRejectConfirm = useCallback(async (reason) => {
    if (!rejectDoc) return;
    const { id: docId, name, userId: userUid, user_uid } = rejectDoc;
    const resolvedUid = userUid || user_uid;
    const actorUid  = user?.uid  ?? 'unknown';
    const actorName = user?.displayName || user?.email || 'Employee';

    setRejectDoc(null);
    setPendingId(docId);
    try {
      // 1. Update kyc_queue document
      await updateDoc(doc(db, 'kyc_queue', docId), {
        status:           'Rejected',
        rejection_reason: reason,
        rejectedBy:       actorUid,
        rejectedAt:       serverTimestamp(),
      });

      // 2. Dual-write: update users/{uid}
      if (resolvedUid) {
        try {
          await updateDoc(doc(db, 'users', resolvedUid), {
            kycStatus:          'Rejected',
            kycRejectionReason: reason,
            kycRejectedAt:      serverTimestamp(),
            kycRejectedBy:      actorUid,
          });
        } catch (e) {
          console.warn('[KYC] users update failed (rules?):', e.message);
        }
      }

      // 3. Audit log
      await addDoc(collection(db, 'audit_log'), {
        action:      'KYC_REJECTED',
        action_code: 'KYC_REJECT',
        actorUid,
        actorName,
        actor_name:  actorName,
        actor_uid:   actorUid,
        targetUid:   resolvedUid || docId,
        targetName:  name,
        entity_type: 'KYC',
        entity_id:   docId,
        amount_inr:  0,
        details:     `KYC rejected by ${actorName}. Reason: ${reason}`,
        timestamp:   serverTimestamp(),
      });

      showToast(`KYC rejected for ${name}`);
    } catch (err) {
      console.error('[KYC reject]', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setPendingId(null);
    }

    // 3. Fire-and-forget WS
    try {
      sendAction({
        channel: 'kyc_queue',
        action:  'rejected',
        payload: { kyc_id: docId, uid: resolvedUid, reason, actor: actorName },
      });
    } catch { /* ignore */ }
  }, [rejectDoc, user, sendAction]);

  // ── Export CSV ─────────────────────────────────────────
  const handleExport = useCallback(() => {
    const COLS = [
      { header: 'Name',            key: (r) => fmtName(r.name) },
      { header: 'Status',          key: 'status' },
      { header: 'Phone',           key: 'phone' },
      { header: 'PAN (Masked)',    key: 'panMasked' },
      { header: 'Bank (Masked)',   key: 'bankMasked' },
      { header: 'Rejection Reason',key: 'rejection_reason' },
      { header: 'Submitted At',    key: (r) => {
        const ts = r.submittedAt;
        if (!ts) return '';
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return d.toISOString().slice(0, 16).replace('T', ' ');
      }},
      { header: 'Approved By',     key: 'approvedBy' },
      { header: 'Doc ID',          key: 'id' },
    ];
    const label = filter === 'All Statuses' ? 'all' : filter.toLowerCase();
    exportCsv(`kyc_queue_${label}`, COLS, filtered);
  }, [filtered, filter]);

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar activePage="KYC Approvals" />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50 w-full">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">KYC Management</h1>
            <div className="flex items-center gap-4">
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
                {pendingCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] group-hover:border-white animate-pulse" />
                )}
              </button>
            </div>
          </header>

          <main className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">

            {/* Inline toast */}
            {toast && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${
                toast.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                {toast.msg}
              </div>
            )}

            {/* Metric Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="Pending KYC"    value={pendingCount}       trend={pendingCount > 0 ? `${pendingCount} waiting` : 'None pending'} isPositive={pendingCount === 0}   loading={dataLoading} />
              <MetricCard title="Approved Today" value={approvedToday}      trend="today"                                                          isPositive={true}                 loading={dataLoading} />
              <MetricCard title="Approval Rate"  value={`${approvalRate}%`} trend={`${approvedTotal} total approved`}                              isPositive={approvalRate >= 80}   loading={dataLoading} />
              <MetricCard title="Rejected"       value={rejectedCount}      trend={rejectedCount > 0 ? 'Action needed' : 'None'}                   isPositive={rejectedCount === 0}  loading={dataLoading} />
            </section>

            {/* Controls */}
            <section className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or PAN…"
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
                  <option>Rejected</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <Download size={16} />Export CSV
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
                    {dataLoading ? (
                      // Skeleton rows
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-4"><div className="h-4 w-36 bg-slate-200 rounded" /></td>
                          <td className="p-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                          <td className="p-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                          <td className="p-4"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                          <td className="p-4"><div className="h-4 w-20 bg-slate-200 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium">
                          {kycDocs.length === 0
                            ? '✅ No pending KYC requests at this time.'
                            : 'No results match your filters.'}
                        </td>
                      </tr>
                    ) : paginated.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{fmtName(req.name)}</span>
                            <span className="text-[11px] font-medium text-slate-400">{req.phone || '—'}</span>
                            <span className="text-[10px] text-slate-300 mt-0.5 font-mono">{req.id.slice(0, 8)}…</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="grid grid-cols-[36px_1fr] gap-x-2 gap-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase self-center bg-slate-100 px-1 rounded inline-block w-fit">PAN</span>
                            <span className="text-[11px] font-bold text-slate-600 font-mono tracking-tight">{req.panMasked || '—'}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase self-center bg-slate-100 px-1 rounded inline-block w-fit">BANK</span>
                            <span className="text-[11px] font-bold text-slate-600 font-mono tracking-tight">{req.bankMasked || '—'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer">
                              <Eye size={14} />Identity
                            </button>
                            <span className="text-slate-200">|</span>
                            <button className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer">
                              <ExternalLink size={14} />Passbook
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <KYCStatusBadge status={req.status} reason={req.rejection_reason} />
                        </td>
                        <td className="p-4 text-right">
                          {pendingId === req.id ? (
                            <Loader2 size={16} className="animate-spin text-slate-400 ml-auto" />
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleApprove(req.id, req.name, req.userId || req.user_uid)}
                                title="Approve KYC"
                                className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button
                                onClick={() => setRejectDoc({ id: req.id, name: req.name, userId: req.userId, user_uid: req.user_uid })}
                                title="Reject KYC"
                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <XCircle size={18} />
                              </button>
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
                  {filtered.length === 0
                    ? 'No entries'
                    : <>Showing <span className="font-bold text-slate-700">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)}</span> of <span className="font-bold text-slate-700">{filtered.length}</span> requests</>
                  }
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                    className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)}
                      className={`w-8 h-8 rounded-lg text-[13px] font-bold border ${
                        page === i ? 'bg-blue-50 text-blue-600 border-blue-100' : 'text-slate-500 border-transparent hover:bg-slate-50'
                      }`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-all">
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

      {/* Reject Modal */}
      {rejectDoc && (
        <RejectModal
          onClose={() => setRejectDoc(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
}
