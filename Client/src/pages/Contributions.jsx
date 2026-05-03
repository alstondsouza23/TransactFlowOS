import React, { useState } from 'react';
import TransactionModal from '../components/TransactionModal';

const Contributions = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transaction, setTransaction] = useState(null);

  const handleContactForeman = () => {
    // Simulate a verified transaction receipt
    const refId = 'TXN-' + Math.floor(80000000 + Math.random() * 19999999);
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' • ' + now.toTimeString().slice(0, 8);
    setTransaction({
      referenceId: refId,
      method: 'Bank Transfer (HDFC Bank)',
      timestamp,
    });
    setModalOpen(true);
  };
  const summaryData = {
    totalContributed: '₹55,000',
    cycles: 'Cumulative contributions across 11 cycles',
    missedPayments: 1,
    missedText: 'Critical issues requiring attention',
    paymentStreak: '7 Months',
    streakText: 'Consecutive cycles paid on time'
  };

  const transactions = [
    { id: 1, month: 'October 2024', dueDate: 'Oct 10, 2024', paidDate: 'Oct 08, 2024', amount: '₹5,000', status: 'Paid', ref: 'TXN-882190' },
    { id: 2, month: 'September 2024', dueDate: 'Sep 10, 2024', paidDate: 'Sep 09, 2024', amount: '₹5,000', status: 'Paid', ref: 'TXN-881023' },
    { id: 3, month: 'August 2024', dueDate: 'Aug 10, 2024', paidDate: 'Aug 12, 2024', amount: '₹5,000', status: 'Paid', ref: 'TXN-879102' },
    { id: 4, month: 'July 2024', dueDate: 'Jul 10, 2024', paidDate: '--', amount: '₹5,000', status: 'Overdue', ref: '-' },
    { id: 5, month: 'June 2024', dueDate: 'Jun 10, 2024', paidDate: 'Jun 05, 2024', amount: '₹5,000', status: 'Paid', ref: 'TXN-865412' }
  ];

  const upcomingPayments = [
    { id: 13, date: 'Nov 10, 2024', cycle: 'CYCLE #13', amount: '₹5,000', type: 'STANDARD DUE' },
    { id: 14, date: 'Dec 10, 2024', cycle: 'CYCLE #14', amount: '₹5,000', type: 'STANDARD DUE' },
    { id: 15, date: 'Jan 10, 2025', cycle: 'CYCLE #15', amount: '₹5,000', type: 'STANDARD DUE' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Contributions</h1>
        <p style={styles.subtitle}>History of your monthly pool contributions and dues.</p>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>TOTAL CONTRIBUTED</span>
          </div>
          <div style={styles.cardValue}>{summaryData.totalContributed}</div>
          <div style={styles.cardSubtext}>{summaryData.cycles}</div>
        </div>

        <div style={{ ...styles.card, border: '1px solid #fee2e2' }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>MISSED PAYMENTS</span>
          </div>
          <div style={{ ...styles.cardValue, color: '#ef4444' }}>{summaryData.missedPayments}</div>
          <div style={styles.cardSubtext}>{summaryData.missedText}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>PAYMENT STREAK</span>
          </div>
          <div style={styles.cardValue}>{summaryData.paymentStreak}</div>
          <div style={styles.cardSubtext}>{summaryData.streakText}</div>
        </div>
      </div>

      {/* Transaction List (Mobile-first List View instead of Table) */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Transaction History</h2>
        </div>
        <div style={styles.listContainer}>
          {transactions.map((txn, index) => (
            <div key={txn.id} style={{
              ...styles.listItem,
              borderBottom: index === transactions.length - 1 ? 'none' : '1px solid #e5e7eb',
              backgroundColor: txn.status === 'Overdue' ? '#fcf8f8' : '#ffffff'
            }}>
              <div style={styles.listRow}>
                <span style={styles.listMonth}>{txn.month}</span>
                <span style={styles.listAmount}>{txn.amount}</span>
              </div>
              <div style={styles.listRow}>
                <span style={styles.listDetail}>Due: {txn.dueDate}</span>
                <span style={styles.listDetail}>Paid: {txn.paidDate}</span>
              </div>
              <div style={styles.listRow}>
                <span style={styles.listDetail}>Ref: {txn.ref}</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: txn.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                  color: txn.status === 'Paid' ? '#166534' : '#991b1b'
                }}>
                  {txn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Payments & Foreman Note Container */}
      <div style={styles.bottomGrid}>

        {/* Upcoming Payments */}
        <div style={styles.upcomingCard}>
          <h3 style={styles.upcomingTitle}>Upcoming Payments</h3>
          <p style={styles.upcomingSubtitle}>Mark these dates to avoid late penalties.</p>

          <div style={styles.upcomingList}>
            {upcomingPayments.map(payment => (
              <div key={payment.id} style={styles.upcomingItem}>
                <div style={styles.cycleBadge}>#{payment.id}</div>
                <div style={styles.upcomingDetails}>
                  <div style={styles.upcomingDate}>{payment.date}</div>
                  <div style={styles.upcomingCycle}>{payment.cycle}</div>
                </div>
                <div style={styles.upcomingRight}>
                  <div style={styles.upcomingAmount}>{payment.amount}</div>
                  <div style={styles.upcomingType}>{payment.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Foreman Note */}
        <div style={styles.foremanCard}>
          <div style={styles.foremanIcon}>!</div>
          <h3 style={styles.foremanTitle}>Foreman Note</h3>
          <p style={styles.foremanText}>
            All contributions are collected by Foreman John between 10:00 AM and 04:00 PM on the 10th of every month. Please keep your reference slips ready for verification.
          </p>
          <button
            style={{
              ...styles.foremanButton,
              backgroundColor: isHovered ? '#2563eb' : '#3b82f6',
              boxShadow: isHovered ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleContactForeman}
          >
            Contact Foreman &rarr;
          </button>
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
    fontSize: '26px',
    fontWeight: '700',
    color: '#1b3664',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  summaryGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardHeader: {
    marginBottom: '10px',
  },
  cardLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.5px',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '6px',
  },
  cardSubtext: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  listItem: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  listRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listMonth: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: '15px',
  },
  listAmount: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: '16px',
  },
  listDetail: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
  },
  bottomGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  upcomingCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  upcomingTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 6px 0',
  },
  upcomingSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 20px 0',
    fontWeight: '500',
  },
  upcomingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  upcomingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  cycleBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#f0f4f8',
    color: '#1b3664',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '700',
  },
  upcomingDetails: {
    flex: 1,
  },
  upcomingDate: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: '15px',
  },
  upcomingCycle: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
    fontWeight: '600',
  },
  upcomingRight: {
    textAlign: 'right',
  },
  upcomingAmount: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: '15px',
  },
  upcomingType: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: '700',
    marginTop: '4px',
  },
  foremanCard: {
    backgroundColor: '#1b3664',
    borderRadius: '12px',
    padding: '24px',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(27, 54, 100, 0.2)',
  },
  foremanIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '700',
    fontSize: '18px',
    marginBottom: '20px',
  },
  foremanTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 12px 0',
  },
  foremanText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#d1dbec',
    margin: '0 0 24px 0',
  },
  foremanButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 20px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  }
};

export default Contributions;