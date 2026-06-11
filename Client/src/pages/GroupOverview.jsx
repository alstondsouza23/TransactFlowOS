import React from 'react';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Crown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3664" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Members: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Chit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 11h.01"/></svg>,
  Trend: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3664" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
};

const GroupOverview = () => {
  const membersData = [
    { id: 'TF-1001', name: 'Amit Sharma', role: 'Foreman', status: 'Paid', prize: 'Winner (Cycle 4)', img: 'https://i.pravatar.cc/150?u=amit' },
    { id: 'TF-1002', name: 'Sriya Patel', role: 'Member', status: 'Paid', prize: 'Participant', img: 'https://i.pravatar.cc/150?u=sriya' },
    { id: 'TF-1003', name: 'Vikram Singh', role: 'Member', status: 'Pending', prize: 'Participant', img: 'https://i.pravatar.cc/150?u=vikram' },
    { id: 'TF-8829', name: 'Rajesh Kumar', role: 'Member', status: 'Paid', prize: 'Winner (Cycle 1)', img: 'https://i.pravatar.cc/150?u=rajesh' },
    { id: 'TF-1005', name: 'Ananya Iyer', role: 'Secretary', status: 'Paid', prize: 'Participant', img: 'https://i.pravatar.cc/150?u=ananya' },
  ];

  return (
    <div style={s.page} className="animate-in">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div style={s.header}>
        <h1 style={s.title}>Group Overview</h1>
        <p style={s.subtitle}>Real-time transparency and collective financial standing.</p>
      </div>

      {/* ── Main Group Card ────────────────────────────────────── */}
      <div className="mainCard" style={s.mainCard}>
        <div style={s.groupInfo}>
           <div style={s.titleRow}>
             <h2 style={s.groupName}>Royal Elite Savings Circle</h2>
             <span style={s.activeBadge}>Active</span>
           </div>
           <p style={s.groupId}># GRP-7729-2024</p>
           
           <div style={s.metaGrid}>
             <div style={s.metaItem}>
               <span style={s.metaLabel}>FOREMAN</span>
               <div style={s.metaVal}><Icons.Crown /><span style={{marginLeft:'6px'}}>Amit Sharma</span></div>
             </div>
             <div style={s.metaItem}>
               <span style={s.metaLabel}>CREATED ON</span>
               <div style={s.metaVal}><Icons.Calendar /><span style={{marginLeft:'6px'}}>Jan 12, 2024</span></div>
             </div>
           </div>
        </div>

        <div className="statsGrid" style={s.statsGrid}>
           <div style={s.statBox}>
             <div style={s.statHeader}><Icons.Members /><span>MEMBERS</span></div>
             <div style={s.statValLarge}>20 / 20</div>
           </div>
           <div style={s.statBox}>
             <div style={s.statHeader}><Icons.Chit /><span>CHIT AMOUNT</span></div>
             <div style={s.statValLarge}>₹ 5,00,000</div>
           </div>
           <div style={s.statBox}>
             <div style={s.statHeader}><Icons.Trend /><span>MONTHLY CONTRIBUTION</span></div>
             <div style={s.statValLarge}>₹ 25,000</div>
           </div>
           <div style={s.statBox}>
             <div style={s.statHeader}><Icons.Clock /><span>TOTAL CYCLES</span></div>
             <div style={s.statValLarge}>20 Months</div>
           </div>
        </div>
      </div>

      {/* ── Pool Health Section ────────────────────────────────── */}
      <div style={s.sectionHeader}>
        <Icons.Shield />
        <h3 style={s.sectionTitle}>Pool Health Metrics</h3>
      </div>

      <div className="metricsGrid" style={s.metricsGrid}>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>TOTAL POOL CAPITAL</span>
          <div style={s.metricValue}>₹ 15,40,000</div>
          <div style={s.progressBar}>
             <div style={{...s.progressFill, width: '72%'}} />
          </div>
          <span style={s.metricFooter}>72% of total pool allocated</span>
        </div>

        <div style={s.metricCard}>
          <span style={s.metricLabel}>AMOUNT DISBURSED</span>
          <div style={s.metricValue}>₹ 11,08,800</div>
          <div style={s.metricFooter}><Icons.Clock /> Updated 2 hours ago</div>
        </div>

        <div style={s.metricCard}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={s.metricLabel}>SAFE RESERVE</span>
            <Icons.Check />
          </div>
          <div style={s.metricValue}>₹ 4,31,200</div>
          <span style={s.metricFooter}><span style={{marginRight:'4px'}}>ℹ️</span> Calculated using Banker's Algorithm</span>
        </div>
      </div>

      {/* ── Member Directory Section ────────────────────────────── */}
      <div style={s.directoryHeader}>
        <div style={s.dirTitleRow}>
          <Icons.Users />
          <h3 style={s.sectionTitle}>Member Directory</h3>
        </div>
        <p style={s.dirSubtitle}>Accountability view: all payments are verified by foreman</p>
      </div>

      <div className="tableCard" style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr style={s.thRow}>
              <th style={s.th}>MEMBER</th>
              <th style={s.th}>POSITION</th>
              <th style={s.th}>CURRENT STATUS</th>
              <th style={{...s.th, textAlign:'right'}}>PRIZE STATUS</th>
            </tr>
          </thead>
          <tbody>
            {membersData.map((m, idx) => (
              <tr key={idx} style={s.tr}>
                <td style={s.td}>
                  <div style={s.memberCell}>
                    <img src={m.img} alt={m.name} style={s.avatar} />
                    <div>
                      <div style={s.mName}>{m.name}</div>
                      <div style={s.mId}>{m.id}</div>
                    </div>
                  </div>
                </td>
                <td style={s.td}>
                  <span style={{
                    ...s.roleBadge,
                    backgroundColor: m.role === 'Foreman' ? '#fef3c7' : m.role === 'Secretary' ? '#f5f3ff' : '#f1f5f9',
                    color: m.role === 'Foreman' ? '#d97706' : m.role === 'Secretary' ? '#7c3aed' : '#64748b'
                  }}>
                    {m.role}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={{
                    ...s.statusBadge,
                    backgroundColor: m.status === 'Paid' ? '#dcfce7' : '#fef2f2',
                    color: m.status === 'Paid' ? '#059669' : '#ef4444'
                  }}>
                    {m.status}
                  </span>
                </td>
                <td style={{...s.td, textAlign:'right'}}>
                   <span style={{
                     fontSize: '13px',
                     fontWeight: m.prize.includes('Winner') ? '800' : '500',
                     color: m.prize.includes('Winner') ? '#059669' : '#94a3b8'
                   }}>
                     {m.prize}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── System Footer ──────────────────────────────────────── */}
      <div style={s.systemFooter}>
        <p style={s.copyright}>© 2024 TransactFlowOS • Secured by Firebase</p>
        <div style={s.footerLinks}>
          <span>Privacy Policy</span>
          <span>Support</span>
          <span>System Status: <span style={{color: '#10b981', fontWeight: '700'}}>Online</span></span>
        </div>
      </div>

      <style>{`
        .animate-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1023px) {
          .mainCard { flex-direction: column !important; }
          .statsGrid { grid-template-columns: repeat(2, 1fr) !important; }
          .metricsGrid { grid-template-columns: 1fr !important; }
          .tableCard { overflow-x: auto !important; }
          .table { min-width: 800px !important; }
        }
      `}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '8px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1b3664',
    margin: '0 0 8px 0',
    letterSpacing: '-1px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    margin: 0,
  },
  // Main Group Card
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
  },
  groupInfo: {
    flex: 1.2,
    padding: '32px',
    borderRight: '1px solid #f1f5f9',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px',
  },
  groupName: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1b3664',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  activeBadge: {
    backgroundColor: '#1b3664',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '20px',
    textTransform: 'uppercase',
  },
  groupId: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: '0 0 32px 0',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '32px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: '0.5px',
  },
  metaVal: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
  },
  // Stats Grid
  statsGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1px',
    backgroundColor: '#f1f5f9',
  },
  statBox: {
    backgroundColor: '#ffffff',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '12px',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.5px',
  },
  statValLarge: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
  },
  // Section Headers
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1b3664',
    margin: 0,
  },
  // Metrics Grid
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
  },
  metricLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0f172a',
    borderRadius: '4px',
  },
  metricFooter: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  // Member Directory
  directoryHeader: {
    marginTop: '16px',
  },
  dirTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px',
  },
  dirSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
    fontStyle: 'italic',
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
    padding: '16px 24px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#334155',
  },
  memberCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #f1f5f9',
  },
  mName: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '15px',
  },
  mId: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Footer
  systemFooter: {
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyright: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  footerLinks: {
    display: 'flex',
    gap: '24px',
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
  }
};

export default GroupOverview;