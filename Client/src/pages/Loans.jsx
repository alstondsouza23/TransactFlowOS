import React, { useState, useMemo } from 'react';
import { calculateEMI } from '../utils/emiCalculator';
import TransactionModal from '../components/TransactionModal';

const Loans = () => {
  const [amount, setAmount] = useState('');
  const [tenure, setTenure] = useState(12);
  const [purpose, setPurpose] = useState('');

  // Dummy Data State
  const hasActiveLoan = false; // Set to false to allow form submission testing
  const activeBalance = "₹0.00";
  const annualInterestRate = 12; // 12% standard interest rate for group pool

  const [modalOpen, setModalOpen] = useState(false);
  const [transaction, setTransaction] = useState(null);

  const handleSubmit = () => {
    if (!amount || !purpose) return;
    const refId = 'LN-' + Math.floor(10000 + Math.random() * 89999);
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' • ' + now.toTimeString().slice(0, 8);
    setTransaction({
      referenceId: refId,
      method: `Loan – ₹${Number(amount).toLocaleString('en-IN')} / ${tenure} Months`,
      timestamp,
    });
    setModalOpen(true);
    // Reset form
    setAmount('');
    setPurpose('');
  };

  // Live EMI Calculation
  const emiData = useMemo(() => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return null;
    return calculateEMI(amt, annualInterestRate, tenure);
  }, [amount, tenure]);

  // Dummy Application History
  const loanHistory = [
    {
      id: 'LN-9921',
      principal: '₹50,000',
      purpose: 'Medical',
      date: 'Oct 12, 2023',
      status: 'Repaid',
      emi: '₹8,750',
      statusColor: '#1e293b',
      statusBg: '#f1f5f9'
    },
    {
      id: 'LN-1024',
      principal: '₹1,20,000',
      purpose: 'Business Expansion',
      date: 'Jan 15, 2024',
      status: 'Disbursed',
      emi: '₹11,200',
      statusColor: '#065f46',
      statusBg: '#d1fae5'
    },
    {
      id: 'LN-1055',
      principal: '₹25,000',
      purpose: 'Home Repair',
      date: 'Feb 28, 2024',
      status: 'Approved',
      emi: '₹4,500',
      statusColor: '#1e40af',
      statusBg: '#dbeafe'
    },
  ];

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Loans</h1>
        <p style={styles.subtitle}>Manage your loan applications and view repayment schedules.</p>
      </div>

      {/* Warning Banner: Active Loan Detection */}
      {hasActiveLoan && (
        <div style={styles.warningBanner}>
          <div style={styles.warningIcon}>⚠️</div>
          <div style={styles.warningContent}>
            <h4 style={styles.warningTitle}>Active Loan Detected</h4>
            <p style={styles.warningText}>
              Our policy allows only one active loan per member. You currently have an active balance of <span style={{ fontWeight: '700' }}>{activeBalance}</span>. Please complete your current repayments before applying for a new loan.
            </p>
          </div>
        </div>
      )}

      {/* Application Form Card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Apply for a New Loan</h2>

        <div style={styles.formSection}>
          {/* Amount Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Loan Amount
              <span style={styles.limitLabel}>LIMIT: ₹5,00,000</span>
            </label>
            <div style={styles.amountInputWrapper}>
              <span style={styles.currencyPrefix}>₹</span>
              <input
                type="number"
                placeholder="0.00"
                style={styles.input}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p style={styles.inputHint}>Enter the principal amount you wish to borrow from the group pool.</p>
          </div>

          {/* Purpose Dropdown */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Purpose of Loan</label>
            <select
              style={styles.select}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="">Select Purpose</option>
              <option value="Medical">Medical Emergency</option>
              <option value="Education">Education</option>
              <option value="Home Repair">Home Repair</option>
              <option value="Business">Business Expansion</option>
              <option value="Personal">Personal Use</option>
            </select>
          </div>

          {/* Tenure Selection */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Repayment Tenure</label>
            <div style={styles.tenureGrid}>
              {[6, 12, 18, 24].map((t) => (
                <button
                  key={t}
                  style={{
                    ...styles.tenureBtn,
                    backgroundColor: tenure === t ? '#1b3664' : '#ffffff',
                    color: tenure === t ? '#ffffff' : '#64748b',
                    borderColor: tenure === t ? '#1b3664' : '#e2e8f0',
                  }}
                  onClick={() => setTenure(t)}
                >
                  {t} Months
                </button>
              ))}
            </div>
          </div>

          {/* Live EMI Preview Section */}
          <div style={styles.previewBox}>
            {emiData ? (
              <div style={styles.previewContent}>
                <div style={styles.previewHeader}>Live EMI Preview</div>
                <div style={styles.emiValue}>₹{emiData.emi.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div style={styles.previewDetails}>
                  <div style={styles.pDetail}>
                    <span>Total Interest:</span>
                    <span>₹{emiData.totalInterest.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={styles.pDetail}>
                    <span>Total Repayment:</span>
                    <span>₹{emiData.totalPayment.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.emptyPreview}>
                <div style={styles.emptyIcon}>🕒</div>
                <p>Enter amount to see live preview</p>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            style={{
              ...styles.submitBtn,
              opacity: (hasActiveLoan || !amount || !purpose) ? 0.6 : 1,
              cursor: (hasActiveLoan || !amount || !purpose) ? 'not-allowed' : 'pointer'
            }}
            disabled={hasActiveLoan || !amount || !purpose}
            onClick={handleSubmit}
          >
            Submit Loan Application
          </button>
          <p style={styles.disclaimer}>TERMS AND CONDITIONS APPLY AS PER FOREMAN RULES</p>
        </div>
      </div>

      {/* Application History Card */}
      <div style={styles.card}>
        <div style={styles.historyHeader}>
          <h2 style={styles.cardTitle}>Loan Application History</h2>
          <span style={styles.recordCount}>Showing 3 records</span>
        </div>

        <div style={styles.historyList}>
          {loanHistory.map((loan) => (
            <div key={loan.id} style={styles.historyItem}>
              <div style={styles.historyTop}>
                <span style={styles.loanId}>{loan.id}</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: loan.statusBg,
                  color: loan.statusColor
                }}>{loan.status}</span>
              </div>

              <div style={styles.historyMain}>
                <div style={styles.historyCol}>
                  <span style={styles.historyLabel}>Principal</span>
                  <span style={styles.historyValue}>{loan.principal}</span>
                </div>
                <div style={styles.historyCol}>
                  <span style={styles.historyLabel}>Monthly EMI</span>
                  <span style={styles.historyValue}>{loan.emi}</span>
                </div>
              </div>

              <div style={styles.historyFooter}>
                <span style={styles.historyMeta}>{loan.purpose} • {loan.date}</span>
                <button style={styles.actionBtn}>View Schedule ▾</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Verified Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={transaction}
      />
    </div>
  );
};

// Styles object for mobile-first clean fintech UI
const styles = {
  container: {
    padding: '24px 18px 60px',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1b3664',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
  },
  warningBanner: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  warningIcon: {
    fontSize: '20px',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#92400e',
    margin: '0 0 4px 0',
  },
  warningText: {
    fontSize: '13px',
    color: '#b45309',
    margin: 0,
    lineHeight: '1.5',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1b3664',
    margin: '0 0 20px 0',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '700',
  },
  amountInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0 16px',
    height: '52px',
    backgroundColor: '#f8fafc',
  },
  currencyPrefix: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#64748b',
    marginRight: '8px',
  },
  input: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1b3664',
    outline: 'none',
    width: '100%',
  },
  inputHint: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
  },
  select: {
    height: '52px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '0 16px',
    fontSize: '15px',
    color: '#1b3664',
    fontWeight: '500',
    backgroundColor: '#f8fafc',
    outline: 'none',
  },
  tenureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  tenureBtn: {
    height: '44px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  previewBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    padding: '20px',
    minHeight: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px dashed #cbd5e1',
  },
  previewContent: {
    width: '100%',
    textAlign: 'center',
  },
  previewHeader: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  emiValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1b3664',
    marginBottom: '16px',
  },
  previewDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '12px',
  },
  pDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#475569',
    fontWeight: '500',
  },
  emptyPreview: {
    textAlign: 'center',
    color: '#94a3b8',
  },
  emptyIcon: {
    fontSize: '24px',
    marginBottom: '8px',
  },
  submitBtn: {
    height: '52px',
    backgroundColor: '#1b3664',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    marginTop: '10px',
    transition: 'opacity 0.2s',
  },
  disclaimer: {
    fontSize: '10px',
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '600',
    margin: 0,
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '20px',
  },
  recordCount: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  historyItem: {
    border: '1px solid #f1f5f9',
    borderRadius: '12px',
    padding: '16px',
  },
  historyTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  loanId: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#3b82f6',
    textDecoration: 'underline',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  historyMain: {
    display: 'flex',
    gap: '32px',
    marginBottom: '12px',
  },
  historyCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  historyLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  historyValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
  },
  historyFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f8fafc',
    paddingTop: '12px',
  },
  historyMeta: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },
  actionBtn: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1b3664',
    background: '#f1f5f9',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
  }
};

export default Loans;