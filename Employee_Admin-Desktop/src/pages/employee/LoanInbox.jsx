/**
 * src/pages/employee/LoanInbox.jsx
 *
 * Loan Inbox — live Firestore data via onSnapshot on `loan_applications`
 * where status == "Pending" and groupId == "GRP-001".
 *
 * Cross-references users/{applicantUid} for eligibility gate.
 * Approve action generates EMI schedule and writes installments array.
 * All writes are Firestore-primary; WebSocket broadcast is fire-and-forget.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, onSnapshot,
  doc, getDoc, updateDoc, addDoc, serverTimestamp,
} from 'firebase/firestore';
import {
  Bell, Search, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, IndianRupee,
  Loader2, CheckCircle2, XCircle, AlertTriangle,
  FileText, User, Calendar, ShieldCheck,
} from 'lucide-react';

import { db }          from '../../lib/firestore';
import Sidebar         from '../../components/Sidebar';
import KernelMonitor   from '../../components/KernelMonitor';
import useAuthStore    from '../../store/authStore';
import { useWsAction } from '../../providers/WebSocketProvider';
import { fmtName, fmtInitials } from '../../lib/fmtName';

// ─────────────────────────────────────────────────────────────────
// EMI calculator — standard reducing balance formula
// ─────────────────────────────────────────────────────────────────
function calcEMI(principal, annualRatePct, tenureMonths) {
  const P = principal;
  const r = annualRatePct / 12 / 100;
  const n = tenureMonths;
  if (r === 0) return P / n;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function buildInstallments(principal, annualRatePct = 12, tenureMonths = 12) {
  const emi = calcEMI(principal, annualRatePct, tenureMonths);
  let balance = principal;
  const installments = [];
  const now = new Date();

  for (let i = 1; i <= tenureMonths; i++) {
    const interest  = balance * (annualRatePct / 12 / 100);
    const principal_ = emi - interest;
    balance -= principal_;
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() + i);

    installments.push({
      installmentNo:   i,
      dueDate:         dueDate.toISOString().split('T')[0],
      emi:             Math.round(emi),
      principal:       Math.round(principal_),
      interest:        Math.round(interest),
      closingBalance:  Math.max(0, Math.round(balance)),
      status:          'Pending',
    });
  }
  return installments;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function fmtInr(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function fmtDate(val) {
  if (!val) return '—';
  if (val?.toDate) return val.toDate().toLocaleDateString('en-IN');
  return new Date(val).toLocaleDateString('en-IN');
}

function sevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
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
        <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
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

const StatusBadge = ({ status }) => {
  const map = {
    Pending:  'bg-amber-50 text-amber-600 border-amber-200',
    Approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Rejected: 'bg-rose-50 text-rose-600 border-rose-200',
    Verified: 'bg-blue-50 text-blue-600 border-blue-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${map[status] ?? map.Pending}`}>
      {status}
    </span>
  );
};

const EligibilityBadge = ({ userType }) => {
  if (userType === 'loan_eligible') return null; // buttons shown instead
  if (userType === 'kyc_pending')
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">KYC not completed</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">Active member</span>;
};

function RejectModal({ onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-black text-slate-800">Reject Loan Application</h3>
        <p className="text-xs text-slate-500 font-medium">Provide a reason (shown to the member).</p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-rose-300 resize-none"
          rows={3}
          placeholder="e.g. Insufficient creditworthiness"
        />
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
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
const PAGE_SIZE = 6;

export default function LoanInbox() {
  const { sendAction } = useWsAction();
  const user = useAuthStore((s) => s.user);

  // ── Firestore live state ──────────────────────────────────────
  const [loans,       setLoans]       = useState([]);
  const [userTypes,   setUserTypes]   = useState({}); // { uid: userType }
  const [dataLoading, setDataLoading] = useState(true);
  const [stats,       setStats]       = useState({ active: 0, disbursed: 0, rejectedWeek: 0 });

  // ── UI state ──────────────────────────────────────────────────
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page,       setPage]       = useState(0);
  const [rejectItem, setRejectItem] = useState(null); // { id, applicantName }
  const [pendingId,  setPendingId]  = useState(null);
  const [toast,      setToast]      = useState(null);

  // ── Firestore onSnapshot — fetches ALL loan_applications ─────────────────
  useEffect(() => {
    // No where() or orderBy() — fetch everything, filter/sort client-side
    // to avoid Firestore composite index requirements
    const q = collection(db, 'loan_applications');

    const unsub = onSnapshot(q, async (snap) => {
      // Sort newest-first client-side
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.submittedAt?.toDate?.() ?? new Date(a.submittedAt ?? 0);
          const tb = b.submittedAt?.toDate?.() ?? new Date(b.submittedAt ?? 0);
          return tb - ta;
        });

      setLoans(docs);
      setDataLoading(false);

      // ── Stats from in-memory docs (no extra Firestore queries needed) ──
      const cutoff = sevenDaysAgo();
      setStats({
        active:       docs.filter((d) => d.status === 'Pending').length,
        disbursed:    docs.filter((d) => d.status === 'Approved').length,
        rejectedWeek: docs.filter((d) => {
          if (d.status !== 'Rejected') return false;
          const ra = d.reviewedAt?.toDate?.() ?? (d.reviewedAt ? new Date(d.reviewedAt) : null);
          return ra && ra >= cutoff;
        }).length,
      });

      // Cross-reference userType for eligibility gate (Pending only)
      const uids = [...new Set(
        docs.filter((d) => d.status === 'Pending')
            .map((d) => d.applicantUid)
            .filter(Boolean)
      )];
      const freshTypes = {};
      await Promise.all(uids.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) freshTypes[uid] = snap.data().userType ?? 'unknown';
        } catch { freshTypes[uid] = 'unknown'; }
      }));
      setUserTypes(freshTypes);
    }, (err) => {
      console.error('[LoanInbox] snapshot error:', err);
      setDataLoading(false);
    });

    return () => unsub();
  }, []);

  // ── Toast helper ──────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Approve ───────────────────────────────────────────────────
  const handleApprove = useCallback(async (loan) => {
    const actorUid  = user?.uid ?? 'unknown';
    const actorName = user?.displayName || user?.email || 'Employee';
    const appId     = loan.id;
    const uid       = loan.applicantUid  ?? loan.applicant_uid  ?? '';
    const loanName  = fmtName(loan.applicantName ?? loan.applicant_name);
    const amount    = loan.requestedAmountINR ?? loan.requested_amount_inr ?? 0;
    const tenure    = loan.tenureMonths   ?? loan.tenure_months   ?? 12;

    setPendingId(appId);
    try {
      const installments = buildInstallments(amount, 12, tenure);

      // 1. Update loan application
      await updateDoc(doc(db, 'loan_applications', appId), {
        status:       'Approved',
        reviewedBy:   actorUid,
        reviewedAt:   serverTimestamp(),
        installments,
      });

      // 2. Update applicant's user document
      await updateDoc(doc(db, 'users', uid), {
        userType:     'contributor',
        activeLoanId: appId,
      });

      // 3. Audit log
      await addDoc(collection(db, 'audit_log'), {
        action:      'LOAN_APPROVED',
        action_code: 'LOAN_APPROVED',
        actorUid,
        actorName,
        actor_name:  actorName,
        actor_uid:   actorUid,
        targetUid:   uid,
        targetName:  loanName,
        entity_type: 'LOAN_APP',
        entity_id:   appId,
        amount_inr:  amount,
        details:     `Loan of ${fmtInr(amount)} approved by ${actorName} for ${loanName}`,
        timestamp:   serverTimestamp(),
      });

      showToast(`Loan approved for ${loanName} — ₹${Number(amount).toLocaleString('en-IN')}`);
    } catch (err) {
      console.error('[Loan approve]', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setPendingId(null);
    }

    // Fire-and-forget WS
    try {
      sendAction({ channel: 'loan_inbox', action: 'approved', payload: { application_id: appId, actor: actorName } });
    } catch { /* ignore */ }
  }, [user, sendAction]);

  // ── Reject ────────────────────────────────────────────────────
  const handleRejectConfirm = useCallback(async (reason) => {
    if (!rejectItem) return;
    const { id: appId, applicantName, applicantUid } = rejectItem;
    const actorUid  = user?.uid ?? 'unknown';
    const actorName = user?.displayName || user?.email || 'Employee';

    setRejectItem(null);
    setPendingId(appId);
    try {
      await updateDoc(doc(db, 'loan_applications', appId), {
        status:          'Rejected',
        rejectionReason: reason,
        reviewedBy:      actorUid,
        reviewedAt:      serverTimestamp(),
      });

      await addDoc(collection(db, 'audit_log'), {
        action:      'LOAN_REJECTED',
        action_code: 'LOAN_REJECTED',
        actorUid,
        actorName,
        actor_name:  actorName,
        actor_uid:   actorUid,
        targetUid:   applicantUid,
        targetName:  applicantName,
        entity_type: 'LOAN_APP',
        entity_id:   appId,
        amount_inr:  0,
        details:     `Loan rejected by ${actorName}. Reason: ${reason}`,
        timestamp:   serverTimestamp(),
      });

      showToast(`Loan rejected for ${applicantName}`);
    } catch (err) {
      console.error('[Loan reject]', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setPendingId(null);
    }

    try {
      sendAction({ channel: 'loan_inbox', action: 'rejected', payload: { application_id: appId, reason, actor: actorName } });
    } catch { /* ignore */ }
  }, [rejectItem, user, sendAction]);

  // ── Filter + paginate ─────────────────────────────────────────
  const filtered = loans.filter((l) => {
    const matchStatus = statusFilter === 'All' || l.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      fmtName(l.applicantName ?? l.applicant_name).toLowerCase().includes(q) ||
      l.purpose?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const STATUS_TABS = [
    { key: 'All',      label: 'All',      count: loans.length },
    { key: 'Pending',  label: 'Pending',  count: loans.filter((l) => l.status === 'Pending').length },
    { key: 'Approved', label: 'Approved', count: loans.filter((l) => l.status === 'Approved').length },
    { key: 'Rejected', label: 'Rejected', count: loans.filter((l) => l.status === 'Rejected').length },
  ];

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar activePage="Loan Inbox" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">Loan Inbox</h1>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text" placeholder="Search applicant or purpose…"
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none w-72 shadow-sm"
                />
              </div>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-100 shadow-sm relative">
                <Bell size={20} />
                {stats.active > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] animate-pulse" />}
              </button>
            </div>
          </header>

          <main className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">

            {/* Inline toast */}
            {toast && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${
                toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                {toast.msg}
              </div>
            )}

            {/* Metric Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard title="Active Applications" value={stats.active}       trend="Pending review"  isPositive={false} loading={dataLoading} />
              <MetricCard title="Approved Loans"      value={stats.disbursed}    trend="All time"        isPositive={true}  loading={dataLoading} />
              <MetricCard title="Rejected This Week"  value={stats.rejectedWeek} trend="Last 7 days"     isPositive={stats.rejectedWeek === 0} loading={dataLoading} />
            </section>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setStatusFilter(tab.key); setPage(0); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    statusFilter === tab.key
                      ? 'bg-[#1a2f55] text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-400 font-medium">
                {filtered.length} application{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Loan Cards */}
            <section className="space-y-4">
              {dataLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 animate-pulse space-y-3">
                    <div className="h-5 w-48 bg-slate-200 rounded" />
                    <div className="h-4 w-80 bg-slate-200 rounded" />
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                  </div>
                ))
              ) : paginated.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
                  <FileText size={40} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">
                    {statusFilter === 'All' ? 'No loan applications yet' : `No ${statusFilter.toLowerCase()} applications`}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">New applications will appear here automatically.</p>
                </div>
              ) : paginated.map((loan) => {
                // ── Resolve both camelCase (new) and snake_case (legacy) fields ──
                const name       = fmtName(loan.applicantName ?? loan.applicant_name);
                const amount     = loan.requestedAmountINR   ?? loan.requested_amount_inr ?? 0;
                const applicantUid = loan.applicantUid       ?? loan.applicant_uid        ?? '';
                const riskScore  = loan.riskScore            ?? loan.risk_score           ?? null;
                const tenure     = loan.tenureMonths         ?? loan.tenure_months        ?? 12;
                const purpose    = loan.purpose              ?? '—';
                const userType   = userTypes[applicantUid]   ?? 'unknown';
                const eligible   = userType === 'loan_eligible';
                const isPending  = pendingId === loan.id;
                const emiAmt     = Math.round(calcEMI(amount, 12, tenure));

                return (
                  <div key={loan.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-6 flex-wrap">

                      {/* Left — Applicant */}
                      <div className="flex items-start gap-4 flex-1 min-w-[200px]">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-[#1a2f55] flex-shrink-0">
                          {fmtInitials(loan.applicantName ?? loan.applicant_name)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{name}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{purpose}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <StatusBadge status={loan.status} />
                            {!eligible && <EligibilityBadge userType={userType} />}
                          </div>
                        </div>
                      </div>

                      {/* Middle — Financials */}
                      <div className="grid grid-cols-3 gap-6 text-center flex-shrink-0">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                          <p className="text-lg font-black text-[#1a2f55]">{fmtInr(amount)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EMI (est.)</p>
                          <p className="text-lg font-black text-slate-700">{fmtInr(emiAmt)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tenure</p>
                          <p className="text-lg font-black text-slate-700">{tenure}mo</p>
                        </div>
                      </div>

                      {/* Right — Meta + Actions */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                          <Calendar size={12} />
                          {fmtDate(loan.submittedAt)}
                        </div>
                        {riskScore != null && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold"
                            style={{ color: riskScore < 40 ? '#10b981' : riskScore < 70 ? '#f59e0b' : '#ef4444' }}>
                            <ShieldCheck size={12} />
                            Risk score: {riskScore}
                          </div>
                        )}

                        {isPending ? (
                          <Loader2 size={18} className="animate-spin text-slate-400" />
                        ) : eligible ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(loan)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all"
                            >
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectItem({ id: loan.id, applicantName: name, applicantUid: applicantUid })}
                              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button disabled className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed">
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button disabled className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed">
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-700">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)}</span> of <span className="font-bold text-slate-700">{filtered.length}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                    className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30 cursor-pointer">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)}
                      className={`w-8 h-8 rounded-lg text-[13px] font-bold border ${page === i ? 'bg-blue-50 text-blue-600 border-blue-100' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

          </main>
        </div>
        <KernelMonitor />
      </div>

      {rejectItem && (
        <RejectModal
          onClose={() => setRejectItem(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
}
