import React from 'react';

const GroupOverview = () => {
  // Dummy Data
  const groupDetails = {
    name: 'Royal Elite Savings Circle',
    status: 'Active',
    id: 'GRP-7729-2024',
    foreman: 'Amit Sharma',
    createdOn: 'Jan 12, 2024',
    members: '20 / 20',
    chitAmount: '₹ 5,00,000',
    monthlyContribution: '₹ 25,000',
    totalCycles: '20 Months'
  };

  const poolMetrics = {
    totalCapital: '₹ 15,40,000',
    capitalPercentage: 72,
    amountDisbursed: '₹ 11,08,800',
    safeReserve: '₹ 4,31,200'
  };

  const members = [
    { id: 'TF-1001', name: 'Amit Sharma', initials: 'AS', role: 'Foreman', roleColor: '#d97706', roleBg: '#fef3c7', status: 'Paid', statusColor: '#059669', statusBg: '#d1fae5', prize: 'Winner (Cycle 4)', prizeColor: '#059669' },
    { id: 'TF-1002', name: 'Sriya Patel', initials: 'SP', role: 'Member', roleColor: '#64748b', roleBg: '#f1f5f9', status: 'Paid', statusColor: '#059669', statusBg: '#d1fae5', prize: 'Participant', prizeColor: '#64748b' },
    { id: 'TF-1003', name: 'Vikram Singh', initials: 'VS', role: 'Member', roleColor: '#64748b', roleBg: '#f1f5f9', status: 'Pending', statusColor: '#d97706', statusBg: '#fef3c7', prize: 'Participant', prizeColor: '#64748b' },
    { id: 'TF-8829', name: 'Rajesh Kumar', initials: 'RK', role: 'Member', roleColor: '#64748b', roleBg: '#f1f5f9', status: 'Paid', statusColor: '#059669', statusBg: '#d1fae5', prize: 'Winner (Cycle 1)', prizeColor: '#059669' },
    { id: 'TF-1005', name: 'Ananya Iyer', initials: 'AI', role: 'Secretary', roleColor: '#4f46e5', roleBg: '#e0e7ff', status: 'Paid', statusColor: '#059669', statusBg: '#d1fae5', prize: 'Participant', prizeColor: '#64748b' },
  ];

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Group Overview</h1>
        <p style={styles.subtitle}>Real-time transparency and collective financial standing.</p>
      </div>

      {/* Main Group Details Card */}
      <div style={styles.mainCard}>
        <div style={styles.cardSection}>
          <div style={styles.groupNameRow}>
            <h2 style={styles.groupName}>{groupDetails.name}</h2>
            <span style={styles.activeBadge}>{groupDetails.status}</span>
          </div>
          <p style={styles.groupId}># {groupDetails.id}</p>

          <div style={styles.metaRow}>
            <div style={styles.metaCol}>
              <span style={styles.metaLabel}>FOREMAN</span>
              <span style={styles.metaValue}>👑 {groupDetails.foreman}</span>
            </div>
            <div style={styles.metaCol}>
              <span style={styles.metaLabel}>CREATED ON</span>
              <span style={styles.metaValue}>📅 {groupDetails.createdOn}</span>
            </div>
          </div>
        </div>

        <div className="statsGrid" style={styles.statsGrid}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>👥 MEMBERS</span>
            <span style={styles.statValue}>{groupDetails.members}</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>🛡️ CHIT AMOUNT</span>
            <span style={styles.statValue}>{groupDetails.chitAmount}</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>📈 MONTHLY CONTRIBUTION</span>
            <span style={styles.statValue}>{groupDetails.monthlyContribution}</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>⏱️ TOTAL CYCLES</span>
            <span style={styles.statValue}>{groupDetails.totalCycles}</span>
          </div>
        </div>
      </div>

      {/* Pool Health Metrics */}
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>🛡️ Pool Health Metrics</h3>
      </div>
      <div className="metricsContainer" style={styles.metricsContainer}>
        <div style={styles.metricCard}>
          <div style={styles.metricTop}>
            <span style={styles.metricLabel}>TOTAL POOL CAPITAL</span>
          </div>
          <div style={styles.metricValue}>{poolMetrics.totalCapital}</div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${poolMetrics.capitalPercentage}%` }}></div>
          </div>
          <div style={styles.metricDesc}>{poolMetrics.capitalPercentage}% of total pool allocated</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricTop}>
            <span style={styles.metricLabel}>AMOUNT DISBURSED</span>
          </div>
          <div style={styles.metricValue}>{poolMetrics.amountDisbursed}</div>
          <div style={styles.metricDesc}>🕒 Updated 2 hours ago</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricTop}>
            <span style={styles.metricLabel}>SAFE RESERVE</span>
            <span style={styles.checkIcon}>✓</span>
          </div>
          <div style={styles.metricValue}>{poolMetrics.safeReserve}</div>
          <div style={styles.metricDesc}>ℹ️ Calculated using Banker's Algorithm</div>
        </div>
      </div>

      {/* Member Directory */}
      <div style={{ ...styles.sectionHeader, marginTop: '16px', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        <h3 style={styles.sectionTitle}>👤 Member Directory</h3>
        <p style={styles.sectionSubtitle}>Accountability view: all payments are verified by foreman</p>
      </div>

      <div style={styles.memberList}>
        {members.map((member, index) => (
          <div key={member.id} className="memberItem" style={{
            ...styles.memberItem,
            borderBottom: index === members.length - 1 ? 'none' : '1px solid #f1f5f9'
          }}>
            <div style={styles.memberTop}>
              <div style={styles.memberInfo}>
                <div style={styles.avatar}>{member.initials}</div>
                <div>
                  <div style={styles.memberName}>{member.name}</div>
                  <div style={styles.memberId}>{member.id}</div>
                </div>
              </div>
              <span style={{
                ...styles.badge,
                backgroundColor: member.statusBg,
                color: member.statusColor
              }}>{member.status}</span>
            </div>

            <div style={styles.memberBottom}>
              <div style={styles.mCol}>
                <span style={styles.mLabel}>POSITION</span>
                <span style={{
                  ...styles.roleBadge,
                  backgroundColor: member.roleBg,
                  color: member.roleColor
                }}>{member.role}</span>
              </div>
              <div style={{ ...styles.mCol, alignItems: 'flex-end' }}>
                <span style={styles.mLabel}>PRIZE STATUS</span>
                <span style={{
                  ...styles.prizeText,
                  color: member.prizeColor,
                  fontWeight: member.prize.includes('Winner') ? '700' : '500'
                }}>{member.prize}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global CSS for responsiveness */}
      <style>{`
        @media (max-width: 1023px) {
          h1 { font-size: 24px !important; }
          .metricsContainer { flex-direction: column !important; }
        }
        @media (min-width: 1024px) {
          .statsGrid { grid-template-columns: repeat(4, 1fr) !important; }
          .metricsContainer { flex-direction: row !important; }
          .metricsContainer > div { flex: 1 !important; }
          .memberItem { flex-direction: row !important; justify-content: space-between !important; align-items: center !important; }
          .memberBottom { border-top: none !important; padding-top: 0 !important; gap: 40px !important; }
          .memberTop { flex: 1 !important; }
        }
      `}</style>
    </div>
  );
};

// Styles for mobile-first layout
const styles = {
  container: {
    padding: '24px 18px 60px',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: '20px',
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
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  cardSection: {
    padding: '20px',
    borderBottom: '1px solid #f1f5f9',
  },
  groupNameRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '4px',
  },
  groupName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  activeBadge: {
    backgroundColor: '#1b3664',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  groupId: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 20px 0',
    fontFamily: 'monospace',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
  },
  metaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1px',
    backgroundColor: '#f1f5f9',
  },
  statBox: {
    backgroundColor: '#ffffff',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  statLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1b3664',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    fontStyle: 'italic',
  },
  metricsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '28px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
  },
  metricTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  metricLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  checkIcon: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  metricValue: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '12px',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '3px',
    marginBottom: '8px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0f172a',
    borderRadius: '3px',
  },
  metricDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  memberList: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  memberItem: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  memberTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
  },
  memberName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '2px',
  },
  memberId: {
    fontSize: '12px',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  memberBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #f8fafc',
  },
  mCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  mLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  prizeText: {
    fontSize: '13px',
  }
};

export default GroupOverview;