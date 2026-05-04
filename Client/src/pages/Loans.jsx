import React from 'react';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  History: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3664" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
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
  const history = [
    { id: 'LN-9921', principal: '₹50,000', purpose: 'Medical', date: 'Oct 12, 2023', status: 'Repaid', emi: '₹8,750', statusColor: '#ffffff', statusBg: '#1e293b' },
    { id: 'LN-1024', principal: '₹1,20,000', purpose: 'Business Expansion', date: 'Jan 15, 2024', status: 'Disbursed', emi: '₹11,200', statusColor: '#047857', statusBg: '#dcfce7' },
    { id: 'LN-1055', principal: '₹25,000', purpose: 'Home Repair', date: 'Feb 28, 2024', status: 'Approved', emi: '₹4,500', statusColor: '#1d4ed8', statusBg: '#eff6ff' },
  ];

  return (
    <div style={s.page}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div style={s.header}>
        <h1 style={s.title}>Loans</h1>
        <p style={s.subtitle}>Manage your loan applications and view repayment schedules.</p>
      </div>

      {/* ── Active Loan Alert ──────────────────────────────────── */}
      <div style={s.alertBox}>
        <div style={s.alertIcon}><Icons.Alert /></div>
        <div style={s.alertContent}>
          <p style={s.alertTitle}>Active Loan Detected</p>
          <p style={s.alertText}>
            Our policy allows only one active loan per member. You currently have an active balance of ₹1,06,800. Please complete your current repayments before applying for a new loan.
          </p>
        </div>
      </div>

      {/* ── Application Form (Ghosted/Disabled) ────────────────── */}
      <div style={s.formContainer}>
        <div style={s.formGhostOverlay}>
          <div style={s.ghostContent}>
             <div style={s.ghostIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                   <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
             </div>
             <p style={s.ghostText}>Enter amount to see live preview</p>
          </div>
        </div>
        
        <div style={s.formContent}>
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
                <option>Purpose of Loan</option>
              </select>
            </div>

            <div style={s.inputGroup}>
              <label style={s.label}>Repayment Tenure</label>
              <div style={s.tenureGrid}>
                {['6 Months', '12 Months', '18 Months', '24 Months'].map((t) => (
                  <div key={t} style={{...s.tenureBtn, backgroundColor: t === '12 Months' ? '#1b3664' : '#ffffff', color: t === '12 Months' ? '#ffffff' : '#64748b'}}>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <button style={s.submitBtn} disabled>Submit Loan Application</button>
            <p style={s.termsText}>
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
               TERMS AND CONDITIONS APPLY AS PER FOREMAN RULES
            </p>
          </div>
          
          <div style={s.formRight}>
             {/* Preview area handled by ghost overlay in this implementation */}
          </div>
        </div>
      </div>

      {/* ── History Table ──────────────────────────────────────── */}
      <div style={s.historyHeader}>
        <div style={s.historyTitleRow}>
          <Icons.History />
          <h2 style={s.historyTitle}>Loan Application History</h2>
        </div>
        <span style={s.recordCount}>Showing 3 records</span>
      </div>

      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr style={s.thRow}>
              <th style={s.th}>ID</th>
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
              <tr key={item.id} style={{...s.tr, borderBottom: idx === history.length - 1 ? 'none' : '1px solid #f1f5f9'}}>
                <td style={{...s.td, color: '#1d4ed8', fontWeight: '600'}}>{item.id}</td>
                <td style={{...s.td, fontWeight: '700'}}>{item.principal}</td>
                <td style={s.td}>{item.purpose}</td>
                <td style={{...s.td, color: '#64748b'}}>{item.date}</td>
                <td style={s.td}>
                  <span style={{
                    ...s.statusBadge,
                    color: item.statusColor,
                    backgroundColor: item.statusBg,
                    border: item.status === 'Repaid' ? 'none' : `1px solid transparent`
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{...s.td, fontWeight: '600'}}>{item.emi}</td>
                <td style={s.td}>
                  <button style={s.actionBtn}>
                    <Icons.Calendar />
                    <span>View Schedule</span>
                    <Icons.ChevronDown />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Table Footer ───────────────────────────────────────── */}
      <div style={s.footer}>
        <span style={s.footerText}>Showing 1-3 of 3 Loan Applications</span>
        <div style={s.pagination}>
          <div style={{...s.pageItem, color: '#1b3664', fontWeight: '700'}}>1</div>
          <div style={s.pageItem}>2</div>
          <div style={s.pageItem}>3</div>
        </div>
      </div>

      {/* ── System Footer ──────────────────────────────────────── */}
      <div style={s.systemFooter}>
        <p style={s.copyright}>© 2024 TransactFlowOS • Secured by Firebase</p>
        <div style={s.systemLinks}>
          <span>Privacy Policy</span>
          <span>Support</span>
          <span>System Status: <span style={{color: '#10b981', fontWeight: '700'}}>Online</span></span>
        </div>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  header: {
    marginBottom: '8px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1b3664',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    margin: 0,
  },
  // Alert
  alertBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '20px 24px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginTop: '2px',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#92400e',
    margin: '0 0 4px 0',
  },
  alertText: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#b45309',
    margin: 0,
    fontWeight: '500',
  },
  // Form
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    position: 'relative',
    overflow: 'hidden',
    padding: '40px',
  },
  formGhostOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeft: '1px solid #f1f5f9',
  },
  ghostContent: {
     textAlign: 'center',
     display: 'flex',
     flexDirection: 'column',
     alignItems: 'center',
     gap: '16px',
  },
  ghostText: {
     fontSize: '14px',
     color: '#94a3b8',
     fontWeight: '500',
     maxWidth: '160px',
  },
  formContent: {
    display: 'flex',
    gap: '60px',
  },
  formLeft: {
    flex: 1,
    opacity: 0.4, // Visual ghosting
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 32px 0',
  },
  inputGroup: {
    marginBottom: '24px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
  },
  limitLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#3b82f6',
    letterSpacing: '0.5px',
  },
  amountInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  currencyPrefix: {
    position: 'absolute',
    left: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    height: '52px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0 16px 0 36px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
  },
  inputHint: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '8px',
    fontStyle: 'italic',
  },
  select: {
    width: '100%',
    height: '52px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0 16px',
    fontSize: '15px',
    color: '#94a3b8',
    appearance: 'none',
  },
  tenureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginTop: '8px',
  },
  tenureBtn: {
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid #e2e8f0',
  },
  submitBtn: {
    width: '100%',
    height: '56px',
    backgroundColor: '#1b3664',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    marginTop: '32px',
    cursor: 'not-allowed',
  },
  termsText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: '16px',
    letterSpacing: '0.5px',
  },
  // History
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
  },
  historyTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  historyTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1b3664',
    margin: 0,
  },
  recordCount: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '16px 24px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '20px 24px',
    fontSize: '14px',
    color: '#1e293b',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-block',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  // Table Footer
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '-8px',
  },
  footerText: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  pagination: {
    display: 'flex',
    gap: '8px',
  },
  pageItem: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  // System Footer
  systemFooter: {
    borderTop: '1px solid #e2e8f0',
    marginTop: '40px',
    paddingTop: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyright: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
    fontWeight: '500',
  },
  systemLinks: {
    display: 'flex',
    gap: '24px',
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  }
};

export default Loans;