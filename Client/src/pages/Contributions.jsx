import React, { useState } from 'react';
import useAuthStore from '../store/authStore';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Wallet: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 11h.01"/></svg>,
  Alert: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Streak: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 9h9l-7 5 3 9-8-7-8 7 3-9-7-5h9z"/></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Filter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Info: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
};

const Contributions = () => {
  const [activeTab, setActiveTab] = useState('All History');
  const financialData = useAuthStore((s) => s.financialData);

  const contribs = financialData?.contributions ?? {};
  const summary  = contribs.summary             ?? {};

  // Full history from Firestore, or empty
  const history = (contribs.recent_timeline ?? []);

  // Upcoming payments from Firestore
  const upcoming = (contribs.upcoming_payments ?? []);

  // Filter logic for tabs
  const filteredHistory = activeTab === 'All History'
    ? history
    : history.filter((r) => r.status?.toLowerCase() === activeTab.toLowerCase());


  return (
    <div style={s.page}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <h1 style={s.title}>My Contributions</h1>
          <p style={s.subtitle}>History of your monthly pool contributions and dues.</p>
        </div>
        <div style={s.headerActions}>
          <button style={s.filterBtn}><Icons.Filter /> Filter</button>
          <button style={s.exportBtn}>Export PDF</button>
        </div>
      </div>

      {/* ── Summary Grid ───────────────────────────────────────── */}
      <div className="summaryGrid" style={s.summaryGrid}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardLabel}>TOTAL CONTRIBUTED</span>
            <div style={s.cardIconBox}><Icons.Wallet /></div>
          </div>
          <div style={s.cardValue}>{summary.total_contributed ?? '--'}</div>
          <div style={s.cardSubtext}>Cumulative contributions across {summary.total_cycles ?? '--'} cycles</div>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardLabel}>MISSED PAYMENTS</span>
            <div style={{...s.cardIconBox, backgroundColor: '#fef2f2'}}><Icons.Alert /></div>
          </div>
          <div style={{...s.cardValue, color: '#ef4444'}}>{summary.missed_payments ?? '--'}</div>
          <div style={s.cardSubtext}>Critical issues requiring attention</div>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardLabel}>PAYMENT STREAK</span>
            <div style={s.cardIconBox}><Icons.Streak /></div>
          </div>
          <div style={s.cardValue}>{summary.payment_streak_months ?? '--'} Months</div>
          <div style={s.cardSubtext}>Consecutive cycles paid on time</div>
        </div>
      </div>

      {/* ── Main History Section ───────────────────────────────── */}
      <div style={s.historySection}>
        <div style={s.tabsRow}>
          <div style={s.tabsContainer}>
            {['All History', 'Paid', 'Pending', 'Overdue'].map((tab) => {
              const count = tab === 'All History'
                ? history.length
                : history.filter((r) => r.status?.toLowerCase() === tab.toLowerCase()).length;
              return (
                <div
                  key={tab}
                  style={{
                    ...s.tab,
                    borderBottom: activeTab === tab ? '2px solid #1b3664' : 'none',
                    color: activeTab === tab ? '#1b3664' : '#64748b'
                  }}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  <span style={{
                    ...s.tabCount,
                    backgroundColor: activeTab === tab ? '#1b3664' : '#f1f5f9',
                    color: activeTab === tab ? '#ffffff' : '#64748b'
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={s.searchBox}>
            <div style={s.searchIconContainer}><Icons.Search /></div>
            <input type="text" placeholder="Search ref..." style={s.searchInput} />
          </div>
        </div>

        <div className="tableCard" style={s.tableCard}>
          <table style={s.table}>
            <thead>
              <tr style={s.thRow}>
                <th style={s.th}>Month</th>
                <th style={s.th}>Due Date</th>
                <th style={s.th}>Paid Date</th>
                <th style={s.th}>Amount</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Reference</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item, idx) => (
                <tr key={idx} style={{...s.tr, backgroundColor: item.status === 'Overdue' ? '#fef2f2' : '#ffffff'}}>
                  <td style={{...s.td, fontWeight: '700'}}>{item.month}</td>
                  <td style={{...s.td, color: '#64748b'}}>{item.date_due}</td>
                  <td style={{...s.td, color: '#64748b'}}>{item.date_paid}</td>
                  <td style={{...s.td, fontWeight: '700'}}>{item.amount}</td>
                  <td style={s.td}>
                    <span style={{
                      ...s.statusBadge,
                      backgroundColor: item.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                      color: item.status === 'Paid' ? '#047857' : '#b91c1c'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{...s.td, color: '#94a3b8', fontSize: '12px'}}>{item.reference_id}</td>
                  <td style={s.td}><Icons.ChevronDown /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={s.tableFooter}>
          <span style={s.footerText}>Showing 1-{filteredHistory.length} of {filteredHistory.length} records</span>
          <div style={s.pagination}>
            <button style={s.pageBtn}>Prev</button>
            <button style={{...s.pageBtn, backgroundColor: '#1b3664', color: '#ffffff', border: 'none'}}>1</button>
            <button style={s.pageBtn}>2</button>
            <button style={s.pageBtn}>Next</button>
          </div>
        </div>
      </div>

      {/* ── Bottom Grid ────────────────────────────────────────── */}
      <div className="bottomGrid" style={s.bottomGrid}>
        <div style={s.upcomingContainer}>
          <h2 style={s.sectionTitle}>Upcoming Payments</h2>
          <p style={s.sectionSubtitle}>Mark these dates to avoid late penalties.</p>
          
          <div style={s.upcomingList}>
            {upcoming.map((u, i) => (
              <div key={i} style={s.upcomingItem}>
                <div style={s.cycleCircle}>#{u.cycle_id}</div>
                <div style={s.upcomingInfo}>
                  <div style={s.uDate}>{u.date}</div>
                  <div style={s.uCycle}>CYCLE #{u.cycle_id}</div>
                </div>
                <div style={s.upcomingRight}>
                  <div style={s.uAmount}>{u.amount}</div>
                  <div style={s.uType}>{u.type}</div>
                </div>
                <div style={s.payNowLink}>Pay Now</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.foremanCard}>
           <div style={s.foremanIcon}><Icons.Info /></div>
           <h2 style={s.foremanTitle}>Foreman Note</h2>
           <p style={s.foremanText}>
             All contributions are collected by Foreman John between 10:00 AM and 04:00 PM on the 10th of every month. Please keep your reference slips ready for verification.
           </p>
           <button style={s.contactBtn}>Contact Foreman <span style={{marginLeft:'8px'}}>→</span></button>
        </div>
      </div>

      {/* ── System Footer ──────────────────────────────────────── */}
      <div style={s.systemFooter}>
        <p style={s.copyright}>© 2024 TransactFlowOS • Secured by Firebase</p>
        <div style={s.footerLinks}>
          <span>Privacy Policy</span>
          <span>Support</span>
          <span>System Status: <span style={{color: '#10b981', fontWeight:'700'}}>Online</span></span>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .summaryGrid { flex-direction: column !important; }
          .bottomGrid { flex-direction: column !important; }
          .tabsRow { flex-direction: column !important; gap: 16px !important; }
          .tableCard { overflow-x: auto !important; }
          .table { min-width: 900px !important; }
          .headerActions { display: none !important; }
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  exportBtn: {
    backgroundColor: '#1b3664',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  // Summary Cards
  summaryGrid: {
    display: 'flex',
    gap: '24px',
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: '1px',
  },
  cardIconBox: {
    backgroundColor: '#eff6ff',
    padding: '8px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  },
  cardSubtext: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  // History Section
  historySection: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
  },
  tabsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    borderBottom: '1px solid #f1f5f9',
  },
  tabsContainer: {
    display: 'flex',
    gap: '32px',
  },
  tab: {
    padding: '24px 0',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
  },
  tabCount: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    marginLeft: '6px',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIconContainer: {
    position: 'absolute',
    left: '10px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 12px 8px 34px',
    fontSize: '13px',
    width: '180px',
    outline: 'none',
    color: '#64748b',
  },
  tableCard: {
    overflowX: 'auto',
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
  },
  td: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#334155',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tableFooter: {
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  footerText: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  pagination: {
    display: 'flex',
    gap: '4px',
  },
  pageBtn: {
    padding: '6px 12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    cursor: 'pointer',
  },
  // Bottom Grid
  bottomGrid: {
    display: 'flex',
    gap: '24px',
  },
  upcomingContainer: {
    flex: 1.5,
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 6px 0',
  },
  sectionSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 24px 0',
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
    gap: '20px',
  },
  cycleCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
  },
  upcomingInfo: {
    flex: 1,
  },
  uDate: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1e293b',
  },
  uCycle: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
    marginTop: '2px',
  },
  upcomingRight: {
    textAlign: 'right',
    marginRight: '24px',
  },
  uAmount: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1e293b',
  },
  uType: {
    fontSize: '10px',
    color: '#10b981',
    fontWeight: '700',
    marginTop: '2px',
  },
  payNowLink: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#cbd5e1',
    cursor: 'not-allowed',
  },
  // Foreman Note
  foremanCard: {
    flex: 1,
    backgroundColor: '#1b3664',
    borderRadius: '20px',
    padding: '32px',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.1)',
  },
  foremanIcon: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  foremanTitle: {
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 16px 0',
  },
  foremanText: {
    fontSize: '14px',
    lineHeight: '1.7',
    color: '#cbd5e1',
    marginBottom: '32px',
  },
  contactBtn: {
    width: '100%',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 0',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // System Footer
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

export default Contributions;