import React, { useState, useCallback } from 'react';
import useAuthStore   from '../store/authStore';
import useLoanDocs    from '../hooks/useLoanDocs';
import { useWsAction } from '../providers/WebSocketProvider';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Alert: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  History: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b3664" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4l3 3" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Loader: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
};

const PURPOSES = [
  'Select Purpose',
  'Home Renovation',
  'Education',
  'Medical Emergency',
  'Business Investment',
  'Vehicle Purchase',
  'Wedding',
  'Debt Consolidation',
  'Personal',
  'Other',
];

const TENURES = ['6 Months', '12 Months', '18 Months', '24 Months'];
const TENURE_VALUES = { '6 Months': 6, '12 Months': 12, '18 Months': 18, '24 Months': 24 };
const INTEREST_RATE = 12.0;

function calcEMI(principal, months) {
  if (!principal || months <= 0) return 0;
  const r = INTEREST_RATE / 12 / 100;
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

// ── Loan Application Form ─────────────────────────────────────────────────────
function LoanForm({ user, financialData, onSubmitSuccess, onAmountChange, onTenureChange }) {
  const { sendAction } = useWsAction();
  const [amount,    setAmount]    = useState('');
  const [purpose,   setPurpose]   = useState('Select Purpose');
  const [tenure,    setTenure]    = useState('12 Months');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]    = useState('');

  const amt        = parseFloat(amount.replace(/,/g, '')) || 0;
  const months     = TENURE_VALUES[tenure];
  const emi        = calcEMI(amt, months);
  const isValid    = amt >= 1_000 && amt <= 5_00_000 && purpose !== 'Select Purpose';

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmount(raw);
    const n = parseFloat(raw) || 0;
    onAmountChange?.(n);
    setError('');
  };

  const handleTenureChange = (t) => {
    setTenure(t);
    onTenureChange?.(t);
  };

  const handleSubmit = useCallback(async () => {
    if (!isValid) { setError('Please fill all fields correctly.'); return; }
    if (submitting) return;
    setSubmitting(true);
    setError('');

    // The WS hook sends and the useLoanDocs onSnapshot will pick up the new doc
    sendAction({
      channel: 'loan_inbox',
      action:  'create_loan',
      payload: {
        amount:        amt,
        purpose,
        tenureMonths:  months,
        groupId:       financialData?.profile?.group_id ?? 'GRP-001',
        applicantName: user?.displayName || user?.email?.split('@')[0] || 'Member',
      },
    });

    // Optimistic: show success immediately (Firestore onSnapshot will confirm)
    setTimeout(() => {
      setSubmitting(false);
      onSubmitSuccess({ amount: amt, purpose, tenure });
    }, 900);
  }, [isValid, submitting, sendAction, amt, purpose, months, tenure, financialData, user, onSubmitSuccess]);

  return (
    <div style={s.formLeft}>
      <h2 style={s.sectionTitle}>Apply for a New Loan</h2>

      {/* Amount */}
      <div style={s.inputGroup}>
        <div style={s.labelRow}>
          <label style={s.label}>Loan Amount</label>
          <span style={s.limitLabel}>LIMIT: ₹5,00,000</span>
        </div>
        <div style={s.amountInputWrapper}>
          <span style={s.currencyPrefix}>₹</span>
          <input
            id="loan-amount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amt > 0 ? amt.toLocaleString('en-IN') : amount}
            onChange={handleAmountChange}
            style={{
              ...s.input,
              borderColor: amt > 5_00_000 ? '#ef4444' : amt >= 1_000 ? '#10b981' : '#f1f5f9',
            }}
          />
        </div>
        {amt > 0 && (
          <p style={{ ...s.inputHint, color: amt > 5_00_000 ? '#ef4444' : '#10b981' }}>
            {amt > 5_00_000 ? '⚠ Exceeds maximum limit of ₹5,00,000' : `✓ ₹${amt.toLocaleString('en-IN')} within limit`}
          </p>
        )}
        {!amt && <p style={s.inputHint}>Enter the principal amount you wish to borrow from the group pool.</p>}
      </div>

      {/* Purpose */}
      <div style={s.inputGroup}>
        <label style={s.label}>Purpose of Loan</label>
        <div style={{ position: 'relative' }}>
          <select
            id="loan-purpose"
            value={purpose}
            onChange={(e) => { setPurpose(e.target.value); setError(''); }}
            style={{ ...s.select, color: purpose === 'Select Purpose' ? '#94a3b8' : '#1e293b' }}
          >
            {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>▾</span>
        </div>
      </div>

      {/* Tenure */}
      <div style={s.inputGroup}>
        <label style={s.label}>Repayment Tenure</label>
        <div style={s.tenureGrid}>
          {TENURES.map((t) => (
            <button
              key={t}
              id={`tenure-${t.replace(' ', '-')}`}
              onClick={() => handleTenureChange(t)}
              style={{
                ...s.tenureBtn,
                backgroundColor: t === tenure ? '#1b3664' : '#ffffff',
                color:           t === tenure ? '#ffffff' : '#64748b',
                borderColor:     t === tenure ? '#1b3664' : '#e2e8f0',
                transform:       t === tenure ? 'translateY(-2px)' : 'none',
                boxShadow:       t === tenure ? '0 4px 12px rgba(27,54,100,0.25)' : 'none',
                transition:      'all 0.2s ease',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          ⚠ {error}
        </div>
      )}

      <button
        id="submit-loan-btn"
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        style={{
          ...s.submitBtn,
          opacity:     !isValid || submitting ? 0.5 : 1,
          cursor:      !isValid || submitting ? 'not-allowed' : 'pointer',
          background:  isValid && !submitting
            ? 'linear-gradient(135deg, #1b3664 0%, #2563eb 100%)'
            : '#94a3b8',
          transform:   submitting ? 'scale(0.98)' : 'scale(1)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {submitting ? <Icons.Loader /> : <Icons.Send />}
          {submitting ? 'Submitting Application…' : 'Proceed to Bid & Apply'}
        </span>
      </button>

      <p style={s.termsText}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        TERMS AND CONDITIONS APPLY AS PER FOREMAN RULES
      </p>
    </div>
  );
}

// ── EMI Preview Card ──────────────────────────────────────────────────────────
function EmiPreview({ amt, months, tenure }) {
  const emi = calcEMI(amt, months);
  const total = emi * months;

  return (
    <div style={s.formRight}>
      <div style={s.previewCard}>
        <p style={s.previewLabel}>ACTIVE OFFER</p>
        <h3 style={s.previewTitle}>Loan Summary</h3>
        <p style={s.previewEligibility}>Eligibility: Up to ₹5,00,000</p>

        <div style={s.previewStats}>
          <div style={s.previewStat}>
            <p style={s.statLabel}>ESTIMATED EMI</p>
            <p style={s.statVal}>
              {amt >= 1000 ? `₹${emi.toLocaleString('en-IN')}` : '₹—'}
              <span style={s.statUnit}>/mo</span>
            </p>
          </div>
          <div style={s.previewStat}>
            <p style={s.statLabel}>INTEREST RATE</p>
            <p style={s.statVal}>{INTEREST_RATE}%<span style={s.statUnit}> p.a.</span></p>
          </div>
        </div>

        {amt >= 1000 && (
          <div style={s.previewBreakdown}>
            <div style={s.breakdownRow}>
              <span>Principal</span>
              <span style={{ fontWeight: 700 }}>₹{amt.toLocaleString('en-IN')}</span>
            </div>
            <div style={s.breakdownRow}>
              <span>Total Interest</span>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>₹{(total - amt).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ ...s.breakdownRow, borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 4 }}>
              <span style={{ fontWeight: 700 }}>Total Payable</span>
              <span style={{ fontWeight: 700, color: '#1b3664' }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ ...s.breakdownRow, marginTop: 8 }}>
              <span>Tenure</span>
              <span style={{ fontWeight: 700 }}>{tenure}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Success Banner ────────────────────────────────────────────────────────────
function SuccessBanner({ sub, onDismiss }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      border: '1px solid #6ee7b7',
      borderRadius: 20,
      padding: '40px 48px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      textAlign: 'center',
      boxShadow: '0 10px 30px rgba(16,185,129,0.15)',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        backgroundColor: '#10b981',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
      }}>
        <Icons.Check />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#065f46', margin: 0 }}>Application Submitted!</h2>
      <p style={{ fontSize: 14, color: '#047857', fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
        Your loan application for <strong>₹{sub.amount.toLocaleString('en-IN')}</strong> ({sub.purpose}, {sub.tenure}) has been submitted.<br />
        An employee will review it shortly. You'll receive a notification when a decision is made.
      </p>
      <button
        onClick={onDismiss}
        style={{
          marginTop: 8, padding: '12px 32px',
          backgroundColor: '#10b981', color: '#fff',
          border: 'none', borderRadius: 12, fontSize: 14,
          fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
        }}
      >
        View Application History ↓
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const Loans = () => {
  const financialData = useAuthStore((s) => s.financialData);
  const user          = useAuthStore((s) => s.user);
  const loans         = financialData?.loans_and_credit ?? {};
  const hasActiveLoan = financialData?.profile?.active_loan_status === 'Active';

  const { loans: liveLoanDocs, loading: liveLoading } = useLoanDocs();
  const [submitted, setSubmitted] = useState(null); // { amount, purpose, tenure }
  const [formTenure, setFormTenure] = useState('12 Months');
  const [formAmt, setFormAmt] = useState(0);

  const statusColor = (st) => st === 'Approved' ? '#059669' : st === 'Rejected' ? '#dc2626' : '#1d4ed8';
  const statusBg    = (st) => st === 'Approved' ? '#d1fae5'  : st === 'Rejected' ? '#fee2e2'  : '#eff6ff';

  const history = liveLoanDocs.length > 0
    ? liveLoanDocs.map((l) => ({
        loan_id:      l.id?.slice(0, 8).toUpperCase() ?? 'LOAN',
        principal:    l.requestedAmountINR
          ? `₹${Number(l.requestedAmountINR).toLocaleString('en-IN')}`
          : l.requested_amount_inr
          ? `₹${Number(l.requested_amount_inr).toLocaleString('en-IN')}`
          : '—',
        purpose:      l.purpose ?? '—',
        applied_date: l.submittedAt?.toDate
          ? l.submittedAt.toDate().toLocaleDateString('en-IN')
          : l.submittedAt
          ? new Date(l.submittedAt).toLocaleDateString('en-IN')
          : '—',
        status:       l.status ?? 'Pending',
        monthly_emi:  l.installments?.[0]?.emi
          ? `₹${Number(l.installments[0].emi).toLocaleString('en-IN')}`
          : '—',
        statusColor:  statusColor(l.status),
        statusBg:     statusBg(l.status),
      }))
    : (financialData?.loans_and_credit?.full_loan_history ?? []).map((l) => ({
        ...l,
        statusColor: l.status === 'Repaid'    ? '#ffffff'
                   : l.status === 'Disbursed' ? '#059669'
                   : '#1d4ed8',
        statusBg:   l.status === 'Repaid'    ? '#1e293b'
                   : l.status === 'Disbursed' ? '#d1fae5'
                   : '#eff6ff',
      }));

  return (
    <div style={s.page} className="animate-in">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div style={s.header}>
        <h1 style={s.title}>Loans</h1>
        <p style={s.subtitle}>Manage your loan applications and view repayment schedules with real-time tracking.</p>
      </div>

      {/* ── Active Loan Alert ──────────────────────────────────── */}
      {hasActiveLoan && (
        <div style={s.alertBox}>
          <div style={s.alertIcon}><Icons.Alert /></div>
          <div style={s.alertContent}>
            <p style={s.alertTitle}>Active Loan Detected</p>
            <p style={s.alertText}>
              Our policy allows only one active loan per member. You currently have an active balance of{' '}
              <span style={{ fontWeight: '700' }}>{loans.active_loan_balance_alert}</span>. Please complete your current repayments before applying for a new loan.
            </p>
          </div>
        </div>
      )}

      {/* ── Form / Success Banner ───────────────────────────────── */}
      {submitted ? (
        <SuccessBanner sub={submitted} onDismiss={() => setSubmitted(null)} />
      ) : hasActiveLoan ? (
        /* Locked overlay when active loan exists */
        <div style={s.formContainer}>
          <div style={s.formContent}>
            <div style={{ ...s.formLeft, opacity: 0.35, pointerEvents: 'none' }}>
              <h2 style={s.sectionTitle}>Apply for a New Loan</h2>
              <div style={s.inputGroup}>
                <div style={s.labelRow}><label style={s.label}>Loan Amount</label><span style={s.limitLabel}>LIMIT: ₹5,00,000</span></div>
                <div style={s.amountInputWrapper}><span style={s.currencyPrefix}>₹</span><input type="text" placeholder="0.00" style={s.input} disabled /></div>
              </div>
              <div style={s.inputGroup}><label style={s.label}>Purpose</label><select style={s.select} disabled><option>Select Purpose</option></select></div>
              <button style={{ ...s.submitBtn, cursor: 'not-allowed' }} disabled>Proceed to Bid & Apply</button>
            </div>
            <div style={s.formGhostOverlay}>
              <div style={s.ghostContent}>
                <div style={s.ghostIcon}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <p style={s.ghostText}>Application portal locked while current loan is active</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Interactive form */
        <div style={s.formContainer}>
          <div style={s.formContent}>
            <LoanForm
              user={user}
              financialData={financialData}
              onSubmitSuccess={(sub) => setSubmitted(sub)}
              onAmountChange={(n) => setFormAmt(n)}
              onTenureChange={(t) => setFormTenure(t)}
            />
            <EmiPreview
              amt={formAmt}
              months={TENURE_VALUES[formTenure]}
              tenure={formTenure}
            />
          </div>
        </div>
      )}

      {/* ── History Table ──────────────────────────────────────── */}
      <div style={s.historyHeader}>
        <div style={s.historyTitleRow}>
          <Icons.History />
          <h2 style={s.historyTitle}>Loan Application History</h2>
        </div>
        <div style={s.historyMeta}>
          <span style={s.recordCount}>{history.length} record{history.length !== 1 ? 's' : ''} found</span>
        </div>
      </div>

      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr style={s.thRow}>
              <th style={s.th}>Loan ID</th>
              <th style={s.th}>Principal</th>
              <th style={s.th}>Purpose</th>
              <th style={s.th}>Applied Date</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Monthly EMI</th>
              <th style={s.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', fontSize: 14 }}>
                  No loan applications yet. Apply above to get started.
                </td>
              </tr>
            ) : history.map((item, idx) => (
              <tr key={item.loan_id} style={{ ...s.tr, borderBottom: idx === history.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <td style={{ ...s.td, color: '#1b3664', fontWeight: '700' }}>{item.loan_id}</td>
                <td style={{ ...s.td, fontWeight: '700', fontSize: '15px' }}>{item.principal}</td>
                <td style={s.td}>{item.purpose}</td>
                <td style={{ ...s.td, color: '#64748b' }}>{item.applied_date}</td>
                <td style={s.td}>
                  <span style={{ ...s.statusBadge, color: item.statusColor, backgroundColor: item.statusBg }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ ...s.td, fontWeight: '600', color: '#1e293b' }}>{item.monthly_emi}</td>
                <td style={s.td}>
                  <button style={s.actionBtn} className="hover-action">
                    <Icons.Calendar />
                    <span>View Schedule</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── System Footer ───────────────────────────────────────── */}
      <div style={s.systemFooter}>
        <p style={s.copyright}>© 2024 TransactFlowOS • <span style={{ color: '#64748b' }}>Enterprise Financial Management</span></p>
        <div style={s.systemLinks}>
          <span className="footer-link">Privacy Policy</span>
          <span className="footer-link">Support</span>
          <span className="footer-link">System Status: <span style={{ color: '#10b981', fontWeight: '700' }}>Live</span></span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .animate-in { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hover-action:hover { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; transform: translateY(-1px); }
        .footer-link:hover { color: #1b3664; cursor: pointer; }
        #loan-amount:focus { outline: none; border-color: #1b3664 !important; box-shadow: 0 0 0 3px rgba(27,54,100,0.1); }
        #loan-purpose:focus { outline: none; border-color: #1b3664 !important; }
        @media (max-width: 768px) {
          h1 { font-size: 24px !important; }
          .formContent { flex-direction: column !important; gap: 24px !important; }
          .tenureGrid { grid-template-columns: repeat(2, 1fr) !important; }
          .tableCard { overflow-x: auto !important; }
          table { min-width: 800px !important; }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    display: 'flex', flexDirection: 'column', gap: '32px',
    maxWidth: '1200px', margin: '0 auto',
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: { marginBottom: '8px' },
  title:  { fontSize: '36px', fontWeight: '700', color: '#1b3664', margin: '0 0 10px 0', letterSpacing: '-1px' },
  subtitle: { fontSize: '16px', color: '#64748b', margin: 0, fontWeight: '450' },
  alertBox: {
    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: '1px solid #fde68a', borderRadius: '16px', padding: '24px 32px',
    display: 'flex', gap: '20px', alignItems: 'center',
    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.1)',
  },
  alertIcon: { backgroundColor: '#ffffff', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: '16px', fontWeight: '600', color: '#92400e', margin: '0 0 6px 0' },
  alertText:  { fontSize: '14px', lineHeight: '1.6', color: '#b45309', margin: 0, fontWeight: '500' },
  formContainer: { backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden', padding: '48px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' },
  formGhostOverlay: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: '42%',
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px) saturate(180%)',
    zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderLeft: '1px solid rgba(226,232,240,0.5)',
  },
  ghostContent: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '0 30px' },
  ghostIcon:    { backgroundColor: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' },
  ghostText:    { fontSize: '15px', color: '#475569', fontWeight: '600', lineHeight: '1.4' },
  formContent:  { display: 'flex', gap: '80px' },
  formLeft:     { flex: 1 },
  sectionTitle: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 36px 0', letterSpacing: '-0.5px' },
  inputGroup:   { marginBottom: '28px' },
  labelRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  label:        { fontSize: '14px', fontWeight: '600', color: '#334155' },
  limitLabel:   { fontSize: '11px', fontWeight: '700', color: '#1b3664', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.5px' },
  amountInputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  currencyPrefix: { position: 'absolute', left: '18px', fontSize: '20px', fontWeight: '600', color: '#94a3b8' },
  input:  { width: '100%', height: '56px', backgroundColor: '#f8fafc', border: '2px solid #f1f5f9', borderRadius: '12px', padding: '0 20px 0 44px', fontSize: '20px', fontWeight: '700', color: '#1e293b', transition: 'border-color 0.2s ease', boxSizing: 'border-box' },
  inputHint: { fontSize: '12px', color: '#94a3b8', marginTop: '10px', fontWeight: '500', transition: 'color 0.2s' },
  select: { width: '100%', height: '56px', backgroundColor: '#f8fafc', border: '2px solid #f1f5f9', borderRadius: '12px', padding: '0 44px 0 20px', fontSize: '15px', appearance: 'none', fontWeight: '600', transition: 'border-color 0.2s', cursor: 'pointer', boxSizing: 'border-box' },
  tenureGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '10px' },
  tenureBtn:  { height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: '1px solid #e2e8f0', cursor: 'pointer' },
  submitBtn:  { width: '100%', height: '60px', border: 'none', borderRadius: '14px', fontSize: '17px', fontWeight: '700', marginTop: '36px', boxShadow: '0 4px 12px rgba(27,54,100,0.15)', transition: 'all 0.2s ease', color: '#fff' },
  termsText:  { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginTop: '20px', letterSpacing: '0.3px' },
  // Preview card
  formRight: { width: 240, flexShrink: 0 },
  previewCard: { backgroundColor: '#f8fafc', borderRadius: 20, border: '1px solid #e2e8f0', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 8 },
  previewLabel: { fontSize: 10, fontWeight: 700, color: '#1b3664', backgroundColor: '#dbeafe', padding: '4px 10px', borderRadius: 100, display: 'inline-block', letterSpacing: 1, margin: 0, alignSelf: 'flex-start' },
  previewTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '8px 0 0 0' },
  previewEligibility: { fontSize: 12, color: '#94a3b8', margin: 0, fontWeight: 500 },
  previewStats: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 },
  previewStat:  {},
  statLabel:    { fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 4px 0' },
  statVal:      { fontSize: 26, fontWeight: 800, color: '#1b3664', margin: 0 },
  statUnit:     { fontSize: 14, fontWeight: 600, color: '#94a3b8' },
  previewBreakdown: { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', fontWeight: 500 },
  // History
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' },
  historyTitleRow: { display: 'flex', alignItems: 'center', gap: '14px' },
  historyTitle: { fontSize: '22px', fontWeight: '700', color: '#1b3664', margin: 0, letterSpacing: '-0.5px' },
  historyMeta:  { display: 'flex', alignItems: 'center', gap: '20px' },
  recordCount:  { fontSize: '14px', color: '#64748b', fontWeight: '600' },
  tableCard:    { backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  table:        { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow:        { backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' },
  th:           { padding: '18px 24px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' },
  tr:           { transition: 'all 0.2s ease' },
  td:           { padding: '22px 24px', fontSize: '14px', color: '#334155' },
  statusBadge:  { padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.5px' },
  actionBtn:    { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontWeight: '600', color: '#1b3664', cursor: 'pointer', transition: 'all 0.2s ease' },
  systemFooter: { borderTop: '1px solid #f1f5f9', marginTop: '40px', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  copyright:    { fontSize: '13px', color: '#94a3b8', margin: 0, fontWeight: '600' },
  systemLinks:  { display: 'flex', gap: '32px', fontSize: '13px', color: '#94a3b8', fontWeight: '600' },
};

export default Loans;