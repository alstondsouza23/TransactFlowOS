import React, { useState }  from 'react';
import { useNavigate }    from 'react-router-dom';
import useAuthStore       from '../store/authStore';
import useUserDoc         from '../hooks/useUserDoc';
import KYCSubmitModal     from '../components/KYCSubmitModal';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Wallet: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 11h.01"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3664" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Lock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Snapshot: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  Credit: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Group: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Activity: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
};

// ── KYC badge helper ──────────────────────────────────────────────────────
function KycBadge({ status }) {
  if (status === 'Approved') {
    return (
      <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', fontWeight:'700', color:'#10b981', backgroundColor:'#f0fdf4', padding:'4px 10px', borderRadius:'20px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        KYC Verified
      </span>
    );
  }
  if (status === 'Rejected') {
    return (
      <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', fontWeight:'700', color:'#ef4444', backgroundColor:'#fff5f5', padding:'4px 10px', borderRadius:'20px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        KYC Rejected
      </span>
    );
  }
  // Pending or unknown
  return (
    <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', fontWeight:'700', color:'#f59e0b', backgroundColor:'#fffbeb', padding:'4px 10px', borderRadius:'20px' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      KYC Pending
    </span>
  );
}

const Dashboard = () => {
  const navigate      = useNavigate();
  const displayName   = useAuthStore((s) => s.displayName) || '';
  const uid           = useAuthStore((s) => s.uid) ?? '';
  const financialData = useAuthStore((s) => s.financialData);
  const memberId      = uid ? `TF-${uid.slice(0, 4).toUpperCase()}` : 'TF-XXXX';

  // Live Firestore user doc — triggers toast on KYC status change
  const userDoc = useUserDoc();

  // KYC submission modal
  const [kycModalOpen, setKycModalOpen] = useState(false);

  // Show the submit banner if user hasn't submitted KYC details yet
  // (userDoc exists but has no panMasked) OR userDoc doesn't exist yet
  const needsKycSubmit = !userDoc?.panMasked && userDoc?.kycStatus !== 'Approved';

  // ── Destructure nested data with safe fallbacks ────────────────────────
  const profile   = financialData?.profile            ?? {};
  const snapshot  = financialData?.financial_snapshot ?? {};
  const loans     = financialData?.loans_and_credit   ?? {};
  const contribs  = financialData?.contributions      ?? {};

  // Timeline from recent_timeline or empty array
  const timeline = (contribs?.recent_timeline ?? []).map((row) => ({
    date:   row.date_due,
    type:   row.type,
    amount: row.amount,
    status: row.status?.toLowerCase(),
    ref:    row.reference_id,
  }));

  return (
    <div style={s.page}>
      {/* ── Top Profile Header ────────────────────────────────────── */}
      <div style={s.profileCard}>
        <div style={s.profileLeft}>
          <img 
            src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><circle cx='12' cy='8' r='4'/><path d='M12 14c-6.1 0-8 4-8 4v2h16v-2s-1.9-4-8-4z'/></svg>" 
            alt={displayName} 
            style={s.profileAvatar} 
          />
          <div style={s.profileInfo}>
            <div style={s.nameRow}>
              <h2 style={s.userName}>{displayName}</h2>
              <KycBadge status={userDoc?.kycStatus ?? 'Pending'} />
            </div>
            <p style={s.memberId}>Member ID: {memberId}</p>

      {/* ── KYC submission banner ────────────────────────────────── */}
      {needsKycSubmit && (
        <div style={s.kycBanner}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
            <div style={s.kycBannerIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b3664" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p style={s.kycBannerTitle}>Complete KYC Verification</p>
              <p style={s.kycBannerSub}>Submit your identity documents to unlock loans and full membership.</p>
            </div>
          </div>
          <button style={s.kycBannerBtn} onClick={() => setKycModalOpen(true)}>
            Verify Now →
          </button>
        </div>
      )}

            <div style={s.profileStats}>
              <div style={s.pStat}>
                <span style={s.pStatLabel}>CURRENT STREAK</span>
                <span style={s.pStatVal}>{profile.current_streak_months ?? '--'} Months 🔥</span>
              </div>
              <div style={s.pStat}>
                <span style={s.pStatLabel}>MISSED PAYMENTS</span>
                <span style={{...s.pStatVal, color: '#ef4444'}}>
                  {String(profile.missed_payments_count ?? '--').padStart(2, '0')}
                </span>
              </div>
              <div style={s.pStat}>
                <span style={s.pStatLabel}>ACTIVE LOAN</span>
                <span style={s.pStatVal}>{profile.active_loan_status ?? '--'}</span>
              </div>
            </div>
          </div>
        </div>
        <div style={s.savingsImpact}>
          <span style={s.impactLabel}>Total Savings Impact</span>
          <span style={s.impactVal}>{profile.savings_impact ?? '--'}</span>
        </div>
      </div>

      <div style={s.mainGrid}>
        {/* ── LEFT COLUMN (60%) ─────────────────────────────────── */}
        <div style={s.leftCol}>
          {/* Financial Snapshot */}
          <div style={s.sectionHeader}>
            <div style={s.sTitleRow}><Icons.Snapshot /> <h3 style={s.sectionTitle}>Financial Snapshot</h3></div>
          </div>
          <div style={s.snapshotGrid}>
            <div style={s.snapCard}>
              <span style={s.snapLabel}>Total Contributed</span>
              <span style={s.snapVal}>{snapshot.total_contributed ?? '--'}</span>
            </div>
            <div style={s.snapCard}>
              <span style={s.snapLabel}>Remaining Contribution</span>
              <span style={s.snapVal}>{snapshot.remaining_contribution ?? '--'}</span>
              <span style={s.snapHint}>({snapshot.remaining_months ?? '--'} mos)</span>
            </div>
            <div style={s.snapCard}>
              <span style={s.snapLabel}>Active Loan Balance</span>
              <span style={s.snapVal}>{snapshot.active_loan_balance ?? '--'}</span>
              <span style={s.snapHint}>
                {profile.active_loan_status === 'Active' ? 'Active loan' : 'No active loan'}
              </span>
            </div>
            <div style={{...s.snapCard, border: '2.5px solid #3b82f6'}}>
              <span style={s.snapLabel}>Next Payment Due</span>
              <span style={{...s.snapHint, color: '#3b82f6', fontWeight:'700'}}>
                {snapshot.next_payment_due_date ?? '--'}
              </span>
              <span style={s.snapVal}>{snapshot.next_payment_due_amount ?? '--'}</span>
            </div>
          </div>

          {/* Contributions Timeline */}
          <div style={{...s.sectionHeader, marginTop: '32px'}}>
            <div style={s.sTitleRow}><Icons.Clock /> <h3 style={s.sectionTitle}>Contributions Timeline</h3></div>
            <span style={s.viewAll}>View All</span>
          </div>
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead>
                <tr style={s.thRow}>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Type</th>
                  <th style={s.th}>Amount</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Ref ID</th>
                  <th style={{...s.th, textAlign:'right'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((row, idx) => (
                  <tr key={idx} style={s.tr}>
                    <td style={{...s.td, fontWeight:'700'}}>{row.date}</td>
                    <td style={s.td}>{row.type}</td>
                    <td style={{...s.td, fontWeight:'700'}}>{row.amount}</td>
                    <td style={s.td}>
                      <span style={{
                        ...s.statusPill,
                        backgroundColor: row.status === 'paid' ? '#dcfce7' : '#fee2e2',
                        color: row.status === 'paid' ? '#059669' : '#ef4444'
                      }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{...s.td, color: '#94a3b8', fontSize: '12px'}}>{row.ref}</td>
                    <td style={{...s.td, textAlign:'right'}}>
                      <button style={s.proofBtn}><Icons.Lock /> Proof</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RIGHT COLUMN (40%) ────────────────────────────────── */}
        <div style={s.rightCol}>
          {/* Loans & Credit */}
          <div style={s.sectionHeader}>
            <div style={s.sTitleRow}><Icons.Credit /> <h3 style={s.sectionTitle}>Loans & Credit</h3></div>
          </div>
          <div style={s.loanOfferCard}>
            <div style={s.offerHeader}>
              <div>
                <div style={s.offerTitle}>Apply for New Loan</div>
                <div style={s.offerSub}>Eligibility: Up to ₹5,00,000</div>
              </div>
              <span style={s.activeOfferBadge}>Active Offer</span>
            </div>
            <div style={s.offerDetails}>
              <div style={s.oDetail}>
                <span style={s.oLabel}>ESTIMATED EMI</span>
                <span style={s.oVal}>
                  {loans.new_loan_estimated_emi ?? '--'}
                  <span style={{fontSize:'10px', color:'#94a3b8'}}> /mo</span>
                </span>
              </div>
              <div style={s.oDetail}>
                <span style={s.oLabel}>INTEREST RATE</span>
                <span style={s.oVal}>
                  {loans.new_loan_interest_rate ?? '--'}
                  <span style={{fontSize:'10px', color:'#94a3b8'}}> p.a.</span>
                </span>
              </div>
            </div>
            <button style={s.proceedBtn}>Proceed to Bid & Apply</button>
            <div style={s.recentLoans}>
               <p style={s.recentTitle}>Recent Loan History</p>
               {(loans.recent_loan_history ?? []).map((l, i) => (
                 <div key={i} style={s.loanHistoryItem}>
                   <div style={s.lIcon}><Icons.Credit /></div>
                   <div style={{flex:1}}>
                     <div style={s.lVal}>{l.disbursed_amount}</div>
                     <div style={s.lDate}>Disbursed {l.disbursed_date}</div>
                   </div>
                   <span style={s.closedBadge}>closed</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Group Performance */}
          <div style={{...s.sectionHeader, marginTop: '32px'}}>
            <div style={s.sTitleRow}><Icons.Group /> <h3 style={s.sectionTitle}>Group Performance (ID: #GP-99)</h3></div>
          </div>
          <div style={s.groupCard}>
            <div style={s.poolHeader}>
              <span style={s.poolLabel}>TOTAL POOL COLLECTION</span>
              <span style={s.poolPerc}>78%</span>
            </div>
            <div style={s.poolBar}><div style={{...s.poolFill, width: '78%'}} /></div>
            <div style={s.poolSub}>₹14,50,000 / ₹18,50,000</div>
            
            <div style={s.groupMetrics}>
              <div style={s.gMet}>
                <span style={s.gMetLabel}>Members Paid</span>
                <span style={s.gMetVal}>18 / 24</span>
                <div style={s.gMetBar}><div style={{...s.gMetFill, width: '75%'}} /></div>
              </div>
              <div style={s.gMet}>
                <span style={s.gMetLabel}>Active Defaults</span>
                <span style={{...s.gMetVal, color: '#ef4444'}}>02 <Icons.Check /></span>
                <p style={s.gMetHint}>Requires Foreman Action</p>
              </div>
            </div>

            <div style={s.commissionRow}>
              <span>Foreman Commission:</span>
              <span style={{fontWeight:'700'}}>5.0%</span>
            </div>
            <div style={s.commissionRow}>
              <span>Remaining Cycles:</span>
              <span style={{fontWeight:'700'}}>32 Months</span>
            </div>

            <div style={s.topContributors}>
              <p style={s.contriTitle}>TOP CONTRIBUTORS</p>
              {[
                { n: 'Anita S.', i: 'AS', s: 'Up to Date' },
                { n: 'Vikram R.', i: 'VR', s: 'Up to Date' },
                { n: 'Suresh M.', i: 'SM', s: 'Early Payer' },
              ].map(c => (
                <div key={c.n} style={s.contriItem}>
                  <div style={s.contriAvatar}>{c.i}</div>
                  <span style={s.contriName}>{c.n}</span>
                  <span style={s.contriStatus}>{c.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent System Activity ────────────────────────────────── */}
      <div style={{...s.sectionHeader, marginTop: '32px'}}>
        <div style={s.sTitleRow}><Icons.Activity /> <h3 style={s.sectionTitle}>Recent System Activity</h3></div>
      </div>
      <div style={s.activityList}>
        {[
          { t: 'Monthly Contribution Paid', sub: 'Global Audit Log #TXN-8800', time: '2 hours ago' },
          { t: 'Loan disbursement for Member AR-449', sub: 'Global Audit Log #TXN-8801', time: '10 Apr' },
          { t: 'New Group Notice: Dividend distribution', sub: 'Global Audit Log #TXN-8802', time: '08 Apr' },
          { t: 'KYC Documents Re-verified', sub: 'Global Audit Log #TXN-8803', time: '05 Apr' },
        ].map((a, i) => (
          <div key={i} style={s.activityItem}>
            <div style={s.actIcon}><Icons.Activity /></div>
            <div style={{flex:1}}>
              <div style={s.actTitle}>{a.t}</div>
              <div style={s.actSub}>{a.sub}</div>
            </div>
            <div style={s.actRight}>
              <span style={s.actTime}>{a.time}</span>
              <Icons.ChevronRight />
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div style={s.systemFooter}>
        <p style={s.copyright}>© 2024 TransactFlowOS • Secured by Firebase</p>
        <div style={s.footerLinks}>
          <span>Privacy Policy</span>
          <span>Support</span>
          <span>System Status: <span style={{color: '#10b981', fontWeight: '700'}}>Online</span></span>
        </div>
      </div>

      {/* KYC Submit Modal */}
      {kycModalOpen && <KYCSubmitModal onClose={() => setKycModalOpen(false)} />}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 1023px) {
          .mainGrid { flex-direction: column !important; }
          .snapshotGrid { grid-template-columns: 1fr 1fr !important; }
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
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    backgroundColor: '#f8fafc',
  },
  // Profile Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
  },
  profileLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  profileAvatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #f1f5f9',
    backgroundColor: '#e2e8f0',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1b3664',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  kycBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: '#f0fdf4',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  // KYC submit banner
  kycBanner: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    gap:             '12px',
    backgroundColor: '#eff6ff',
    border:          '1.5px solid #bfdbfe',
    borderRadius:    '16px',
    padding:         '14px 18px',
    marginTop:       '10px',
  },
  kycBannerIcon: {
    width:           '36px',
    height:          '36px',
    background:      '#dbeafe',
    borderRadius:    '10px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  kycBannerTitle: {
    fontSize:        '13px',
    fontWeight:      '800',
    color:           '#1e40af',
    margin:          '0 0 2px',
  },
  kycBannerSub: {
    fontSize:        '11px',
    fontWeight:      '500',
    color:           '#3b82f6',
    margin:          0,
  },
  kycBannerBtn: {
    padding:         '9px 18px',
    background:      '#1b3664',
    color:           '#fff',
    border:          'none',
    borderRadius:    '10px',
    fontSize:        '13px',
    fontWeight:      '700',
    cursor:          'pointer',
    whiteSpace:      'nowrap',
    fontFamily:      '"Plus Jakarta Sans", sans-serif',
    flexShrink:      0,
  },

  memberId: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '600',
    margin: '0 0 16px 0',
  },
  profileStats: {
    display: 'flex',
    gap: '32px',
  },
  pStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  pStatLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  pStatVal: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
  },
  savingsImpact: {
    backgroundColor: '#eff6ff',
    padding: '24px 32px',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  impactLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  impactVal: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1d4ed8',
  },
  // Main Grid
  mainGrid: {
    display: 'flex',
    gap: '32px',
  },
  leftCol: {
    flex: 1.5,
  },
  rightCol: {
    flex: 1,
  },
  // Sections
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1b3664',
    margin: 0,
  },
  viewAll: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#3b82f6',
    cursor: 'pointer',
  },
  // Snapshot
  snapshotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  snapCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  snapLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  snapVal: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
  },
  snapHint: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  // Table
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '1px solid #f1f5f9',
  },
  th: {
    padding: '16px 24px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '16px 24px',
    fontSize: '14px',
    color: '#334155',
  },
  statusPill: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  proofBtn: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    float: 'right',
  },
  // Loans & Credit
  loanOfferCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '28px',
    border: '1px solid #e2e8f0',
  },
  offerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  offerTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1b3664',
    marginBottom: '4px',
  },
  offerSub: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  activeOfferBadge: {
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
    textTransform: 'uppercase',
  },
  offerDetails: {
    display: 'flex',
    gap: '40px',
    marginBottom: '24px',
    backgroundColor: '#fcfcfd',
    padding: '16px',
    borderRadius: '16px',
  },
  oDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  oLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  oVal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
  },
  proceedBtn: {
    width: '100%',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 0',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '32px',
  },
  recentLoans: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  recentTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1b3664',
    marginBottom: '4px',
  },
  loanHistoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  lIcon: {
    backgroundColor: '#f1f5f9',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lVal: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
  },
  lDate: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  closedBadge: {
    fontSize: '10px',
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  // Group Card
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '28px',
    border: '1px solid #e2e8f0',
  },
  poolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: '700',
    color: '#1b3664',
    marginBottom: '10px',
  },
  poolBar: {
    height: '10px',
    backgroundColor: '#f1f5f9',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  poolFill: {
    height: '100%',
    backgroundColor: '#1d4ed8',
  },
  poolSub: {
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'right',
    fontWeight: '600',
    marginBottom: '24px',
  },
  groupMetrics: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '24px',
  },
  gMet: {
    backgroundColor: '#fcfcfd',
    padding: '16px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  gMetLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  gMetVal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  gMetBar: {
    height: '4px',
    backgroundColor: '#f1f5f9',
    borderRadius: '2px',
  },
  gMetFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  gMetHint: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  commissionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '12px',
  },
  topContributors: {
    marginTop: '24px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '20px',
  },
  contriTitle: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: '1px',
    marginBottom: '16px',
  },
  contriItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  contriAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f5f3ff',
    color: '#7c3aed',
    fontSize: '10px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contriName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  contriStatus: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  // Activity List
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px 32px',
    borderBottom: '1px solid #f1f5f9',
  },
  actIcon: {
    backgroundColor: '#f1f5f9',
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '4px',
  },
  actSub: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  actRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  actTime: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '600',
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

export default Dashboard;