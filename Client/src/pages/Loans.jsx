import React from 'react';
import useAuthStore  from '../store/authStore';
import useLoanDocs   from '../hooks/useLoanDocs';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Alert: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  History: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b3664" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4l3 3" />
      <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
};

const Loans = () => {
  const financialData = useAuthStore((s) => s.financialData);
  const loans         = financialData?.loans_and_credit ?? {};
  const hasActiveLoan = financialData?.profile?.active_loan_status === 'Active';

  // — Live Firestore loan applications (fires toast on status change)
  const { loans: liveLoanDocs, loading: liveLoading } = useLoanDocs();

  // Map live Firestore docs to the display format the table expects
  const statusColor = (st) => st === 'Approved' ? '#059669' : st === 'Rejected' ? '#dc2626' : '#1d4ed8';
  const statusBg    = (st) => st === 'Approved' ? '#d1fae5'  : st === 'Rejected' ? '#fee2e2'  : '#eff6ff';

  // Merge live data with legacy financialData.loans history (live takes priority)
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
            <span style={{fontWeight:'700'}}>{loans.active_loan_balance_alert}</span>. Please complete your current repayments before applying for a new loan.
          </p>
        </div>
      </div>
      )}

      {/* ── Application Form (Ghosted/Disabled) ────────────────── */}
      <div className="formContainer" style={s.formContainer}>
        <div className="formGhostOverlay" style={s.formGhostOverlay}>
          <div style={s.ghostContent}>
             <div style={s.ghostIcon}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                   <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
             </div>
             <p style={s.ghostText}>Application portal locked while current loan is active</p>
             <div style={s.ghostStats}>
                <div style={s.ghostStatItem}><div style={s.ghostStatLabel}>EMI</div><div style={s.ghostStatVal}>₹ --</div></div>
                <div style={s.ghostStatItem}><div style={s.ghostStatLabel}>INTEREST</div><div style={s.ghostStatVal}>-- %</div></div>
             </div>
          </div>
        </div>
        
        <div className="formContent" style={s.formContent}>
          <div style={s.formLeft}>
            <h2 style={s.sectionTitle}>Apply for a New Loan</h2>
            
            <div style={s.inputGroup}>
              <div style={s.labelRow}>
                <label style={s.label}>Loan Amount</label>
                <span style={s.limitLabel}>LIMIT: ₹5,00,000</span>
              </div>
              <div style={s.amountInputWrapper}>
                <span style={s.currencyPrefix}>₹</span>
                <input type="text" placeholder="0.00" style={s.input} disabled />
              </div>
              <p style={s.inputHint}>Enter the principal amount you wish to borrow from the group pool.</p>
            </div>

            <div style={s.inputGroup}>
              <label style={s.label}>Purpose of Loan</label>
              <select style={s.select} disabled>
                <option>Select Purpose</option>
              </select>
            </div>

            <div style={s.inputGroup}>
              <label style={s.label}>Repayment Tenure</label>
              <div className="tenureGrid" style={s.tenureGrid}>
                {['6 Months', '12 Months', '18 Months', '24 Months'].map((t) => (
                  <div key={t} style={{...s.tenureBtn, backgroundColor: t === '12 Months' ? '#1b3664' : '#ffffff', color: t === '12 Months' ? '#ffffff' : '#64748b'}}>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <button style={s.submitBtn} disabled>Submit Loan Application</button>
            <p style={s.termsText}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
               TERMS AND CONDITIONS APPLY AS PER FOREMAN RULES
            </p>
          </div>
          
          <div style={s.formRight}>
             {/* Dynamic preview mock area */}
          </div>
        </div>
      </div>

      {/* ── History Table ──────────────────────────────────────── */}
      <div className="historyHeader" style={s.historyHeader}>
        <div style={s.historyTitleRow}>
          <Icons.History />
          <h2 style={s.historyTitle}>Loan Application History</h2>
        </div>
        <div style={s.historyMeta}>
          <span style={s.recordCount}>{history.length} record{history.length !== 1 ? 's' : ''} found</span>
          <button style={s.filterBtn}>Filter By Status</button>
        </div>
      </div>

      <div className="tableCard" style={s.tableCard}>
        <table className="table" style={s.table}>
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
            {history.map((item, idx) => (
              <tr key={item.loan_id} style={{...s.tr, borderBottom: idx === history.length - 1 ? 'none' : '1px solid #f1f5f9'}}>
                <td style={{...s.td, color: '#1b3664', fontWeight: '700'}}>{item.loan_id}</td>
                <td style={{...s.td, fontWeight: '700', fontSize: '15px'}}>{item.principal}</td>
                <td style={s.td}>{item.purpose}</td>
                <td style={{...s.td, color: '#64748b'}}>{item.applied_date}</td>
                <td style={s.td}>
                  <span style={{
                    ...s.statusBadge,
                    color: item.statusColor,
                    backgroundColor: item.statusBg,
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{...s.td, fontWeight: '600', color: '#1e293b'}}>{item.monthly_emi}</td>
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

      {/* ── Table Footer ───────────────────────────────────────── */}
      <div style={s.footer}>
        <span style={s.footerText}>Showing 1 to 3 of 3 applications</span>
        <div style={s.pagination}>
          <button style={{...s.pageItem, backgroundColor: '#1b3664', color: '#ffffff', border: 'none', borderRadius: '4px'}}>1</button>
          <button style={s.pageItem}>2</button>
          <button style={s.pageItem}>3</button>
        </div>
      </div>

      {/* ── System Footer ──────────────────────────────────────── */}
      <div className="systemFooter" style={s.systemFooter}>
        <p style={s.copyright}>© 2024 TransactFlowOS • <span style={{color:'#64748b'}}>Enterprise Financial Management</span></p>
        <div className="systemLinks" style={s.systemLinks}>
          <span className="footer-link">Privacy Policy</span>
          <span className="footer-link">Support</span>
          <span className="footer-link">System Status: <span style={{color: '#10b981', fontWeight: '700'}}>Live</span></span>
        </div>
      </div>

      <style>{`
        .animate-in {
          animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hover-action:hover {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          transform: translateY(-1px);
        }
        .tr:hover {
          background-color: #f8fafc;
        }
        .footer-link:hover {
          color: #1b3664;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          h1 { font-size: 24px !important; }
          .formContainer { padding: 24px !important; }
          .formContent { flex-direction: column !important; gap: 24px !important; }
          .formGhostOverlay { width: 100% !important; height: 100% !important; border-left: none !important; }
          .tenureGrid { grid-template-columns: repeat(2, 1fr) !important; }
          .tableCard { overflow-x: auto !important; }
          .table { min-width: 800px !important; }
          .historyHeader { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .systemFooter { flex-direction: column !important; gap: 16px !important; text-align: center !important; }
          .systemLinks { justify-content: center !important; width: 100% !important; flex-wrap: wrap !important; }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '8px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1b3664',
    margin: '0 0 10px 0',
    letterSpacing: '-1px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
    fontWeight: '450',
  },
  // Alert
  alertBox: {
    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: '1px solid #fde68a',
    borderRadius: '16px',
    padding: '24px 32px',
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.1)',
  },
  alertIcon: {
    backgroundColor: '#ffffff',
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#92400e',
    margin: '0 0 6px 0',
  },
  alertText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#b45309',
    margin: 0,
    fontWeight: '500',
  },
  // Form
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    position: 'relative',
    overflow: 'hidden',
    padding: '48px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
  },
  formGhostOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '42%',
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(10px) saturate(180%)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeft: '1px solid rgba(226, 232, 240, 0.5)',
  },
  ghostContent: {
     textAlign: 'center',
     display: 'flex',
     flexDirection: 'column',
     alignItems: 'center',
     gap: '20px',
     padding: '0 30px',
  },
  ghostIcon: {
     backgroundColor: '#f1f5f9',
     width: '80px',
     height: '80px',
     borderRadius: '50%',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: '8px',
  },
  ghostText: {
     fontSize: '15px',
     color: '#475569',
     fontWeight: '600',
     lineHeight: '1.4',
  },
  ghostStats: {
     display: 'flex',
     gap: '24px',
     marginTop: '10px',
  },
  ghostStatItem: { textAlign: 'center' },
  ghostStatLabel: { fontSize: '10px', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px' },
  ghostStatVal: { fontSize: '18px', color: '#cbd5e1', fontWeight: '700' },
  
  formContent: {
    display: 'flex',
    gap: '80px',
  },
  formLeft: {
    flex: 1,
    opacity: 0.35,
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 36px 0',
    letterSpacing: '-0.5px',
  },
  inputGroup: {
    marginBottom: '28px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
  },
  limitLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#1b3664',
    backgroundColor: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  amountInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  currencyPrefix: {
    position: 'absolute',
    left: '18px',
    fontSize: '20px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    height: '56px',
    backgroundColor: '#f8fafc',
    border: '2px solid #f1f5f9',
    borderRadius: '12px',
    padding: '0 20px 0 44px',
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
  },
  inputHint: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '10px',
    fontWeight: '500',
  },
  select: {
    width: '100%',
    height: '56px',
    backgroundColor: '#f8fafc',
    border: '2px solid #f1f5f9',
    borderRadius: '12px',
    padding: '0 20px',
    fontSize: '15px',
    color: '#94a3b8',
    appearance: 'none',
    fontWeight: '600',
  },
  tenureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '14px',
    marginTop: '10px',
  },
  tenureBtn: {
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid #e2e8f0',
  },
  submitBtn: {
    width: '100%',
    height: '60px',
    backgroundColor: '#1b3664',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '17px',
    fontWeight: '700',
    marginTop: '36px',
    cursor: 'not-allowed',
    boxShadow: '0 4px 12px rgba(27, 54, 100, 0.15)',
  },
  termsText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: '20px',
    letterSpacing: '0.3px',
  },
  // History
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: '20px',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '16px',
  },
  historyTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  historyTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1b3664',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  historyMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  recordCount: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '600',
  },
  filterBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
  },
  th: {
    padding: '18px 24px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  tr: {
    transition: 'all 0.2s ease',
  },
  td: {
    padding: '22px 24px',
    fontSize: '14px',
    color: '#334155',
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1b3664',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  // Table Footer
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '-8px',
  },
  footerText: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  pagination: {
    display: 'flex',
    gap: '8px',
  },
  pageItem: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    background: 'none',
    border: '1px solid transparent',
  },
  // System Footer
  systemFooter: {
    borderTop: '1px solid #f1f5f9',
    marginTop: '40px',
    paddingTop: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyright: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
    fontWeight: '600',
  },
  systemLinks: {
    display: 'flex',
    gap: '32px',
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '600',
  }
};

export default Loans;