/**
 * src/pages/employee/AuctionManagement.jsx
 *
 * Two sections:
 *   1. Create Auction form (schedule a new auction via WS)
 *   2. Active Auction panel (live bid feed + controls)
 */

import React, { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot, orderBy, limit,
} from 'firebase/firestore';
import { db }          from '../../lib/firestore';
import Sidebar         from '../../components/Sidebar';
import useAuction      from '../../hooks/useAuction';
import { useWsAction } from '../../providers/WebSocketProvider';
import useWsStore      from '../../store/wsStore';

const GROUP_ID = 'GRP-001';

// ── Helpers ────────────────────────────────────────────────────────
const inr = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtTime = (ms) => {
  const totalSec = Math.floor((ms || 0) / 1_000);
  const mm       = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss       = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const fmtHHMM = (ts) => {
  if (!ts) return '--:--';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// ── Status Badge ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    scheduled: { bg: '#FEF3C7', color: '#92400E',  label: 'Scheduled' },
    open:      { bg: '#DCFCE7', color: '#166534',  label: '🔴 Live'   },
    closed:    { bg: '#F1F5F9', color: '#475569',  label: 'Closed'    },
    cancelled: { bg: '#FEE2E2', color: '#991B1B',  label: 'Cancelled' },
  };
  const c = map[status] || map.scheduled;
  return (
    <span style={{ ...S.badge, background: c.bg, color: c.color }}>
      {status === 'open' && (
        <span style={{
          display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
          background: '#EF4444', marginRight: 6,
          animation: 'auct-pulse 1.5s ease-in-out infinite',
        }} />
      )}
      {c.label}
    </span>
  );
}

// ── Confirmation Modal ─────────────────────────────────────────────
function ConfirmModal({ title, description, onConfirm, onCancel, needsReason = false, confirmLabel = 'Confirm', confirmColor = '#C00000' }) {
  const [reason, setReason] = useState('');
  return (
    <div style={S.overlay} onClick={onCancel}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#1a2f55' }}>{title}</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>{description}</p>
        {needsReason && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>
              Reason <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for cancellation…"
              rows={3}
              style={{ ...S.input, resize: 'vertical', marginTop: 6 }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={S.cancelBtn}>Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={needsReason && !reason.trim()}
            style={{ ...S.confirmBtn, background: confirmColor,
                     opacity: needsReason && !reason.trim() ? 0.5 : 1 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Auction Form ─────────────────────────────────────────────
function CreateAuctionForm() {
  const { sendAction } = useWsAction();
  const { auction }    = useAuction(GROUP_ID);
  const auctionEvent   = useWsStore((s) => s.auctionEvent);

  const now = new Date();
  const defaultScheduled = new Date(now.getTime() + 60 * 60_000)
    .toISOString().slice(0, 16);

  const [form, setForm] = useState({
    groupId:         GROUP_ID,
    cycleNumber:     1,
    monthLabel:      now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    potAmountINR:    '',
    scheduledFor:    defaultScheduled,
    durationMinutes: 60,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  // Listen for WS confirmation that auction was created
  useEffect(() => {
    if (!auctionEvent) return;
    if (auctionEvent.event === 'auction_scheduled') {
      setSubmitting(false);
      setSuccess(`✅ Auction scheduled! Cycle ${auctionEvent.payload?.cycleNumber ?? ''} — ₹${inr(auctionEvent.payload?.potAmountINR)} pot`);
      setTimeout(() => setSuccess(''), 6000);
    }
    if (auctionEvent.event === 'create_error') {
      setSubmitting(false);
      setError(auctionEvent.payload?.message || 'Failed to create auction');
    }
  }, [auctionEvent]);

  const DURATIONS = [30, 60, 90, 120];

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const pot = parseInt(form.potAmountINR, 10);
    if (!pot || pot <= 0) { setError('Enter a valid pot amount (e.g. 50000)'); return; }
    if (!form.scheduledFor)  { setError('Select a scheduled date/time'); return; }

    setSubmitting(true);
    try {
      sendAction({
        channel: 'auction_room',
        action:  'create_auction',
        payload: {
          ...form,
          potAmountINR: pot,
          scheduledFor: new Date(form.scheduledFor).toISOString(),
        },
      });
      // Don't reset yet — wait for WS confirmation (auction_scheduled event above)
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const hasActive = auction && ['scheduled', 'open'].includes(auction.status);

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <h2 style={S.cardTitle}>Schedule New Auction</h2>
        {hasActive && (
          <span style={{ ...S.badge, background: '#FEF3C7', color: '#92400E' }}>
            Active auction exists
          </span>
        )}
      </div>

      {success && (
        <div style={{
          background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 8,
          padding: '10px 14px', color: '#166534', fontSize: 13, fontWeight: 700,
          marginBottom: 16,
        }}>
          {success}
        </div>
      )}

      {error && <div style={S.errorBar}>{error}</div>}

      <form onSubmit={handleSubmit} style={S.form}>
        <div style={S.formGrid}>
          {/* Group */}
          <div style={S.field}>
            <label style={S.label}>Group</label>
            <select value={form.groupId} onChange={(e) => set('groupId', e.target.value)} style={S.input}>
              <option value="GRP-001">GRP-001</option>
            </select>
          </div>

          {/* Cycle Number */}
          <div style={S.field}>
            <label style={S.label}>Cycle Number</label>
            <input type="number" min={1} value={form.cycleNumber}
              onChange={(e) => set('cycleNumber', parseInt(e.target.value, 10) || 1)}
              style={S.input} />
          </div>

          {/* Month Label */}
          <div style={S.field}>
            <label style={S.label}>Month Label</label>
            <input type="text" value={form.monthLabel}
              onChange={(e) => set('monthLabel', e.target.value)}
              placeholder="e.g. June 2025"
              style={S.input} />
          </div>

          {/* Pot Amount */}
          <div style={S.field}>
            <label style={S.label}>Pot Amount (₹)</label>
            <div style={{ position: 'relative' }}>
              <span style={S.rupeePrefix}>₹</span>
              <input type="number" min={1} value={form.potAmountINR}
                onChange={(e) => set('potAmountINR', e.target.value)}
                placeholder="50000"
                style={{ ...S.input, paddingLeft: 28 }} />
            </div>
          </div>

          {/* Scheduled For */}
          <div style={S.field}>
            <label style={S.label}>Scheduled Date & Time</label>
            <input type="datetime-local" value={form.scheduledFor}
              onChange={(e) => set('scheduledFor', e.target.value)}
              style={S.input} />
          </div>

          {/* Duration */}
          <div style={S.field}>
            <label style={S.label}>Auction Duration</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {DURATIONS.map((d) => (
                <button key={d} type="button"
                  onClick={() => set('durationMinutes', d)}
                  style={{
                    ...S.pill,
                    background:   form.durationMinutes === d ? '#1a2f55' : '#F8FAFC',
                    color:        form.durationMinutes === d ? '#FFF'     : '#64748b',
                    borderColor:  form.durationMinutes === d ? '#1a2f55' : '#E2E8F0',
                  }}>
                  {d} min
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          {submitting && (
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              Sending to server…
            </span>
          )}
          <button type="submit" disabled={submitting} style={{ ...S.primaryBtn, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? '⏳ Scheduling…' : '📅 Schedule Auction'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Active Auction Panel ────────────────────────────────────────────
function ActiveAuctionPanel() {
  const { auction, bids, timeLeft, openAuction, forceClose, cancelAuction } = useAuction(GROUP_ID);
  const { sendAction } = useWsAction();

  const [showForceClose,  setShowForceClose]  = useState(false);
  const [showCancel,      setShowCancel]      = useState(false);

  if (!auction) return null;

  const isOpen      = auction.status === 'open';
  const isScheduled = auction.status === 'scheduled';
  const isClosed    = auction.status === 'closed';

  // Current leader = first in bids array (already sorted highest-first by useAuction)
  const leader = bids[0] || null;
  const uniqueBidders = new Set(bids.map((b) => b.bidderUid)).size;

  return (
    <div style={S.card}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontWeight: 700, color: '#64748b', fontSize: 12 }}>GROUP</span>
          <div style={{ fontWeight: 800, color: '#1a2f55' }}>{auction.groupId}</div>
        </div>
        <div style={S.divider} />
        <div>
          <span style={{ fontWeight: 700, color: '#64748b', fontSize: 12 }}>CYCLE</span>
          <div style={{ fontWeight: 800, color: '#1a2f55' }}>#{auction.cycleNumber}</div>
        </div>
        <div style={S.divider} />
        <div>
          <span style={{ fontWeight: 700, color: '#64748b', fontSize: 12 }}>MONTH</span>
          <div style={{ fontWeight: 800, color: '#1a2f55' }}>{auction.monthLabel}</div>
        </div>
        <div style={S.divider} />
        <div>
          <span style={{ fontWeight: 700, color: '#64748b', fontSize: 12 }}>POT</span>
          <div style={{ fontWeight: 800, color: '#1a2f55' }}>₹{inr(auction.potAmountINR)}</div>
        </div>
        <StatusBadge status={auction.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Left: Live Bid Feed */}
        <div>
          <div style={S.sectionTitle}>Live Bid Feed (Admin View — Real Names)</div>
          {bids.length === 0 ? (
            <div style={{ color: '#94a3b8', padding: '32px 0', textAlign: 'center', fontStyle: 'italic' }}>
              No bids yet
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              {/* Header row */}
              <div style={{ ...S.bidRow, background: '#F8FAFC', fontWeight: 700, fontSize: 11,
                            color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                <span style={{ minWidth: 36 }}>Rank</span>
                <span style={{ flex: 1 }}>Member Name</span>
                <span style={{ minWidth: 100, textAlign: 'right' }}>Bid Amount</span>
              </div>
              {bids.map((bid, i) => (
                <div key={bid.id || i} style={{
                  ...S.bidRow,
                  background: bid.isWinning ? '#DCFCE7' : i === 0 ? '#EFF6FF' : i % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                  borderLeft: bid.isWinning ? '3px solid #0F6E56' : i === 0 ? '3px solid #2563EB' : '3px solid transparent',
                }}>
                  <span style={{ color: '#94a3b8', fontSize: 12, minWidth: 36, fontWeight: 700 }}>
                    {i === 0 ? '🏆' : `#${i + 1}`}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, color: '#374151' }}>
                    {bid.bidderName}
                    {i === 0 && !bid.isWinning && <span style={{ marginLeft: 6, fontSize: 10, color: '#2563EB', fontWeight: 700 }}>LEADING</span>}
                    {bid.isWinning && <span style={{ marginLeft: 6, fontSize: 10, color: '#0F6E56', fontWeight: 700 }}>✓ WINNER</span>}
                  </span>
                  <span style={{ minWidth: 100, textAlign: 'right', fontWeight: 800, color: i === 0 ? '#1a2f55' : '#374151', fontSize: 15 }}>
                    ₹{inr(bid.bidAmountINR)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats */}
          <div style={S.statsCard}>
            {isOpen && (
              <div style={{ marginBottom: 16 }}>
                <div style={S.statLabel}>Time Remaining</div>
                <div style={{
                  fontFamily: 'monospace', fontSize: 32, fontWeight: 800,
                  color: timeLeft < 60_000 ? '#C00000' : '#1a2f55',
                }}>
                  {fmtTime(timeLeft)}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={S.statLabel}>Members Bidding</div>
              <div style={{ fontWeight: 800, fontSize: 22, color: '#2E6DAD' }}>{uniqueBidders}</div>
            </div>
            {leader && (
              <div>
                <div style={S.statLabel}>Current Leader</div>
                <div style={{ fontWeight: 700, color: '#0F6E56' }}>{leader.bidderName}</div>
                <div style={{ fontWeight: 800, color: '#1a2f55', fontSize: 18 }}>
                  ₹{inr(leader.bidAmountINR)}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons or winner card */}
          {isClosed ? (
            <div style={{ ...S.statsCard, background: '#DCFCE7', borderColor: '#0F6E56' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🏆</div>
              <div style={S.statLabel}>Winner</div>
              <div style={{ fontWeight: 800, color: '#0F6E56', fontSize: 16 }}>{auction.winnerName}</div>
              <div style={{ color: '#1a2f55', fontWeight: 700, marginTop: 6 }}>
                Winning Bid: ₹{inr(auction.winningBidINR)}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Open button (only for scheduled) */}
              {isScheduled && (
                <button onClick={openAuction} style={S.primaryBtn}>
                  🟢 Open Auction Now
                </button>
              )}

              {/* Force Close (only when open) */}
              <button
                disabled={!isOpen}
                onClick={() => setShowForceClose(true)}
                style={{ ...S.warnBtn, opacity: !isOpen ? 0.4 : 1 }}
              >
                ⏹ Force Close
              </button>

              {/* Cancel (scheduled or open) */}
              <button
                disabled={isClosed}
                onClick={() => setShowCancel(true)}
                style={{ ...S.dangerBtn, opacity: isClosed ? 0.4 : 1 }}
              >
                ✕ Cancel Auction
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showForceClose && (
        <ConfirmModal
          title="Force Close Auction"
          description={`Close the auction now? Winner will be the HIGHEST current bid${leader ? ` — ${leader.bidderName} (₹${inr(leader.bidAmountINR)})` : ''}.`}
          confirmLabel="Force Close"
          confirmColor="#BA7517"
          onCancel={() => setShowForceClose(false)}
          onConfirm={() => {
            forceClose();
            setShowForceClose(false);
          }}
        />
      )}

      {showCancel && (
        <ConfirmModal
          title="Cancel Auction"
          description="Permanently cancel this auction. This cannot be undone."
          confirmLabel="Cancel Auction"
          confirmColor="#C00000"
          needsReason
          onCancel={() => setShowCancel(false)}
          onConfirm={(reason) => {
            cancelAuction(reason);
            setShowCancel(false);
          }}
        />
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────
export default function AuctionManagement() {
  const wsConnected = useWsStore((s) => s.connected);

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar activePage="Auction Management" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">Auction Management</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: wsConnected ? '#22C55E' : '#EF4444',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: wsConnected ? '#166534' : '#DC2626' }}>
                {wsConnected ? 'WS Connected' : 'Reconnecting…'}
              </span>
            </div>
          </header>

          <main className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">
            <style>{`
              @keyframes auct-pulse {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0.3; }
              }
            `}</style>

            <CreateAuctionForm />
            <ActiveAuctionPanel />
          </main>
        </div>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const S = {
  card: {
    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24,
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16, fontWeight: 800, color: '#1a2f55', margin: 0,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
  },
  form:     { display: 'flex', flexDirection: 'column' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 20px' },
  field:    { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 11, fontWeight: 700, color: '#374151',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0',
    fontSize: 14, fontWeight: 600, color: '#1e293b', outline: 'none',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
    background: '#F8FAFC',
  },
  pill: {
    padding: '6px 14px', borderRadius: 100, border: '1.5px solid',
    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  rupeePrefix: {
    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
    fontWeight: 700, color: '#64748b', fontSize: 14,
  },
  primaryBtn: {
    padding: '11px 20px', background: '#1a2f55', color: '#FFF',
    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  warnBtn: {
    padding: '11px 20px', background: '#BA7517', color: '#FFF',
    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
  },
  dangerBtn: {
    padding: '11px 20px', background: '#C00000', color: '#FFF',
    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
  },
  cancelBtn: {
    padding: '9px 16px', background: 'none', border: '1.5px solid #E2E8F0',
    borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#64748b',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  confirmBtn: {
    padding: '9px 20px', border: 'none', borderRadius: 8,
    fontSize: 13, fontWeight: 700, color: '#FFF', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  bidRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 12px', fontSize: 13, borderRadius: 6,
  },
  statsCard: {
    border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px',
    background: '#F8FAFC',
  },
  statLabel: {
    fontSize: 10, fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.8,
    display: 'block', marginBottom: 4,
  },
  divider: {
    width: 1, height: 32, background: '#E2E8F0',
  },
  errorBar: {
    background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8,
    padding: '10px 14px', color: '#DC2626', fontSize: 13, fontWeight: 600,
    marginBottom: 16,
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
    backdropFilter: 'blur(4px)', zIndex: 9998,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: '#FFF', borderRadius: 14, padding: '28px 24px',
    width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    fontFamily: 'inherit',
  },
};
