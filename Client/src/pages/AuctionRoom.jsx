/**
 * src/pages/AuctionRoom.jsx — Client
 *
 * Real-time auction room. Bids come from Firestore onSnapshot via useAuction.
 * Every bid by every member appears instantly in the feed.
 * Highest bid leads. Highest bid wins when auction closes.
 *
 * States:
 *   null/undefined  — loading or no auction
 *   scheduled       — upcoming: countdown clock
 *   open            — live bidding: bid feed + place-bid form
 *   closed          — winner result card
 *   cancelled       — cancelled state
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import useAuction   from '../hooks/useAuction';
import useAuthStore from '../store/authStore';
import useWsStore   from '../store/wsStore';

// ── Helpers ────────────────────────────────────────────────────────
const inr = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtTime = (ms) => {
  if (!ms || ms <= 0) return '00:00';
  const s  = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const fmtScheduled = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

// ── Pulse dot ─────────────────────────────────────────────────────
function LiveDot({ size = 8 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      borderRadius: '50%', background: '#EF4444', flexShrink: 0,
      animation: 'ar-pulse 1.4s ease-in-out infinite',
    }} />
  );
}

// ── Status chip ───────────────────────────────────────────────────
function Chip({ children, bg, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 14px', borderRadius: 100,
      background: bg, color, fontSize: 11, fontWeight: 700,
      letterSpacing: 1.2, textTransform: 'uppercase',
    }}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// State 1: Loading
// ─────────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={C.center}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
      <p style={C.muted}>Checking for active auction…</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// State 2: No auction
// ─────────────────────────────────────────────────────────────────
function NoAuction() {
  return (
    <div style={C.centerCard}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🏷️</div>
      <h2 style={C.h2}>No Auction Scheduled</h2>
      <p style={{ ...C.muted, maxWidth: 340, textAlign: 'center' }}>
        Your group admin hasn't scheduled an auction yet.
        Check back soon — you'll see it here the moment one is created.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// State 3: Scheduled (upcoming countdown)
// ─────────────────────────────────────────────────────────────────
function ScheduledAuction({ auction }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const target = auction.scheduledFor?.toDate
      ? auction.scheduledFor.toDate().getTime()
      : new Date(auction.scheduledFor).getTime();

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setParts({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [auction.scheduledFor]);

  return (
    <div style={C.centerCard}>
      <Chip bg="#FEF3C7" color="#92400E">UPCOMING AUCTION</Chip>

      <h2 style={{ ...C.h2, marginTop: 20 }}>
        Cycle {auction.cycleNumber}
        {auction.monthLabel && ` · ${auction.monthLabel}`}
      </h2>

      <div style={{ marginTop: 8 }}>
        <div style={C.label}>Pot Amount</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: '#1F3A6E' }}>
          ₹{inr(auction.potAmountINR)}
        </div>
      </div>

      <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
        {fmtScheduled(auction.scheduledFor)}
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={C.label}>Auction starts in</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
          {[['Days', parts.d], ['Hours', parts.h], ['Min', parts.m], ['Sec', parts.s]].map(([l, v]) => (
            <div key={l} style={C.clock}>
              <span style={C.clockNum}>{String(v).padStart(2, '0')}</span>
              <span style={C.clockLabel}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ ...C.muted, marginTop: 24, fontSize: 13 }}>
        Duration: {auction.durationMinutes} minutes once opened
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// State 4: OPEN — live bidding
// ─────────────────────────────────────────────────────────────────

/** Assign stable "Member N" aliases based on first-bid order */
function useMemberNumbers(bids) {
  return useMemo(() => {
    // Sort unique bidders by their earliest placedAt
    const firstSeen = {};
    bids.forEach((bid) => {
      const t = bid.placedAt?.toDate
        ? bid.placedAt.toDate().getTime()
        : new Date(bid.placedAt ?? 0).getTime();
      if (!firstSeen[bid.bidderUid] || t < firstSeen[bid.bidderUid]) {
        firstSeen[bid.bidderUid] = t;
      }
    });
    const order = Object.entries(firstSeen).sort((a, b) => a[1] - b[1]);
    const map = {};
    order.forEach(([uid], i) => { map[uid] = i + 1; });
    return map;
  }, [bids]);
}

function OpenAuction({ auction, bids, myBid, timeLeft, hasWon, placeBid }) {
  const uid         = useAuthStore((s) => s.uid);
  const memberNums  = useMemberNumbers(bids);
  const auctionEvent = useWsStore((s) => s.auctionEvent);

  const [amount,    setAmount]    = useState('');
  const [error,     setError]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef(null);

  const pot    = auction.potAmountINR;
  const leader = bids[0] ?? null; // already sorted highest-first

  // Feedback from WS events
  useEffect(() => {
    if (!auctionEvent) return;
    if (auctionEvent.event === 'bid_error') {
      setError(auctionEvent.payload?.message || 'Bid failed');
      setSubmitting(false);
    }
    if (auctionEvent.event === 'bid_update') {
      setSubmitting(false);
      setError('');
    }
  }, [auctionEvent]);

  // Scroll new bids into view (bids list is sorted highest-first so no auto-scroll needed)

  const getLabel = (bid) => {
    if (bid.bidderUid === uid) return 'You';
    const n = memberNums[bid.bidderUid];
    return n ? `Member ${n}` : `Member ${bid.bidderUid?.slice(0, 4).toUpperCase()}`;
  };

  const handleBid = (e) => {
    e.preventDefault();
    setError('');
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }
    try {
      setSubmitting(true);
      placeBid(amt);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const timeColor = timeLeft < 60_000 ? '#DC2626' : '#1F3A6E';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

      {/* ── Left column: Live bid feed ─── */}
      <div>
        {/* Auction header */}
        <div style={{ ...C.card, marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={C.label}>Cycle</div>
            <div style={C.value}>#{auction.cycleNumber} · {auction.monthLabel}</div>
          </div>
          <div style={C.vdiv} />
          <div>
            <div style={C.label}>Pot Amount</div>
            <div style={C.value}>₹{inr(pot)}</div>
          </div>
          <div style={C.vdiv} />
          <div>
            <div style={C.label}>Time Left</div>
            <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 800, color: timeColor }}>
              {fmtTime(timeLeft)}
            </div>
          </div>
          <div style={C.vdiv} />
          <div>
            <div style={C.label}>Bids</div>
            <div style={C.value}>{bids.length}</div>
          </div>
        </div>

        {/* Leader banner */}
        {leader && (
          <div style={{
            ...C.card, marginBottom: 16,
            background: 'linear-gradient(135deg, #0F6E56, #13A67E)',
            border: 'none', color: '#FFF',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🏆</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, letterSpacing: 1.2 }}>
                  CURRENTLY LEADING
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 2 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>
                    {getLabel(leader)}
                  </span>
                  <span style={{ fontWeight: 900, fontSize: 28 }}>
                    ₹{inr(leader.bidAmountINR)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bid feed */}
        <div style={C.card}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#64748b',
            letterSpacing: 1.2, marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <LiveDot />
            LIVE BID FEED — {bids.length} bid{bids.length !== 1 ? 's' : ''}
          </div>

          {bids.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
              No bids yet — be the first to bid!
            </div>
          ) : (
            <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 80px',
                padding: '6px 12px', fontSize: 10, fontWeight: 700,
                color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8,
              }}>
                <span>Member</span>
                <span style={{ textAlign: 'right' }}>Bid Amount</span>
                <span style={{ textAlign: 'center' }}>Rank</span>
              </div>

              {bids.map((bid, i) => {
                const isMe     = bid.bidderUid === uid;
                const isLeader = i === 0;
                return (
                  <div
                    key={bid.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 80px',
                      alignItems: 'center',
                      padding: '11px 12px',
                      borderRadius: 10,
                      background: isLeader
                        ? '#DCFCE7'
                        : isMe
                          ? '#EFF6FF'
                          : '#F8FAFC',
                      border: isLeader
                        ? '1.5px solid #0F6E56'
                        : isMe
                          ? '1.5px solid #BFDBFE'
                          : '1.5px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: isLeader ? '#0F6E56' : isMe ? '#2563EB' : '#CBD5E1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800,
                        color: isLeader || isMe ? '#FFF' : '#64748B',
                        flexShrink: 0,
                      }}>
                        {isMe ? 'Y' : (memberNums[bid.bidderUid] ?? '?')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>
                          {getLabel(bid)}
                          {isLeader && (
                            <span style={{ marginLeft: 6, fontSize: 10, color: '#0F6E56', fontWeight: 700 }}>
                              LEADING
                            </span>
                          )}
                        </div>
                        {isMe && (
                          <div style={{ fontSize: 10, color: '#2563EB', fontWeight: 600 }}>
                            Your bid
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{
                      textAlign: 'right', fontWeight: 800,
                      fontSize: 16,
                      color: isLeader ? '#0F6E56' : '#1F3A6E',
                    }}>
                      ₹{inr(bid.bidAmountINR)}
                    </div>

                    {/* Rank */}
                    <div style={{ textAlign: 'center' }}>
                      {isLeader ? (
                        <span style={{ fontSize: 18 }}>🏆</span>
                      ) : (
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: '#94a3b8',
                        }}>
                          #{i + 1}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right column: Bid form ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>
        <div style={C.card}>
          {hasWon ? (
            /* Already won this cycle */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
              <div style={{ fontWeight: 800, color: '#0F6E56', fontSize: 16, marginBottom: 6 }}>
                You already won this cycle
              </div>
              <div style={{ color: '#64748b', fontSize: 13 }}>
                Bidding is disabled. You can bid again next cycle.
              </div>
            </div>
          ) : (
            <form onSubmit={handleBid}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1F3A6E', marginBottom: 4 }}>
                Place Your Bid
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
                Enter any amount. Highest bid when the auction closes wins the pot.
              </div>

              {myBid && (
                <div style={{
                  background: '#EFF6FF', border: '1px solid #BFDBFE',
                  borderRadius: 8, padding: '10px 12px', marginBottom: 14,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>
                    Your current bid
                  </span>
                  <span style={{ fontWeight: 800, color: '#1F3A6E', fontSize: 16 }}>
                    ₹{inr(myBid.bidAmountINR)}
                  </span>
                </div>
              )}

              <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Bid Amount (₹)
              </label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 800, color: '#1F3A6E', fontSize: 18,
                }}>₹</span>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  placeholder="e.g. 25000"
                  style={{
                    width: '100%', padding: '14px 14px 14px 32px',
                    border: `2px solid ${error ? '#FCA5A5' : '#E2E8F0'}`,
                    borderRadius: 10, fontSize: 20, fontWeight: 800,
                    color: '#1F3A6E', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit', background: '#F8FAFC',
                  }}
                />
              </div>

              {error && (
                <div style={{
                  marginTop: 8, color: '#DC2626', fontSize: 12,
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  ⚠ {error}
                </div>
              )}

              {/* Preview */}
              {amount && parseInt(amount, 10) > 0 && !error && (
                <div style={{
                  marginTop: 12, background: '#F0FDF4',
                  border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>
                    You're bidding ₹{inr(amount)}
                  </div>
                  {leader && parseInt(amount, 10) > leader.bidAmountINR && (
                    <div style={{ fontSize: 11, color: '#0F6E56', marginTop: 3 }}>
                      🏆 This will put you in the lead!
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', marginTop: 16, padding: '14px',
                  background: submitting
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #1F3A6E 0%, #2E6DAD 100%)',
                  border: 'none', borderRadius: 10, color: '#FFF',
                  fontSize: 14, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: submitting ? 'none' : '0 4px 14px rgba(31,58,110,0.3)',
                  transition: 'all 0.15s',
                }}
              >
                {submitting
                  ? 'Submitting…'
                  : myBid
                    ? '↑ Raise My Bid'
                    : 'Submit Bid'}
              </button>
            </form>
          )}
        </div>

        {/* Pot info */}
        <div style={{ ...C.card, background: '#F8FAFC', padding: '14px 16px' }}>
          <div style={C.label}>Pot Amount (winner receives)</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: '#1F3A6E', marginTop: 2 }}>
            ₹{inr(pot)}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            Highest bid when the timer hits zero wins the full pot.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// State 5: Closed — results
// ─────────────────────────────────────────────────────────────────
function ClosedAuction({ auction }) {
  const uid = useAuthStore((s) => s.uid);
  const won = uid === auction.winnerId;
  return (
    <div style={C.centerCard}>
      <Chip bg="#F1F5F9" color="#475569">AUCTION ENDED</Chip>

      <h2 style={{ ...C.h2, marginTop: 20 }}>
        Cycle {auction.cycleNumber}
        {auction.monthLabel && ` · ${auction.monthLabel}`}
      </h2>

      <div style={{ marginTop: 20 }}>
        <div style={C.label}>Winning Bid</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#1F3A6E', lineHeight: 1.1 }}>
          ₹{inr(auction.winningBidINR)}
        </div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
          by {auction.winnerName}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        {won ? (
          <div style={{
            background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
            border: '2px solid #0F6E56', borderRadius: 14,
            padding: '28px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
            <div style={{ fontWeight: 900, color: '#0F6E56', fontSize: 20 }}>
              You Won the Auction!
            </div>
            <div style={{ color: '#166534', marginTop: 8, fontSize: 15, fontWeight: 600 }}>
              Your payout of ₹{inr(auction.winningBidINR)} has been scheduled.
            </div>
          </div>
        ) : (
          <div style={{
            background: '#F8FAFC', border: '1.5px solid #E2E8F0',
            borderRadius: 14, padding: '24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
            <div style={{ fontWeight: 700, color: '#475569', fontSize: 16 }}>
              Better luck next time!
            </div>
            <div style={{ color: '#94a3b8', marginTop: 6, fontSize: 13 }}>
              Winner: <strong style={{ color: '#374151' }}>{auction.winnerName}</strong>
              {' '}with bid ₹{inr(auction.winningBidINR)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Page root
// ─────────────────────────────────────────────────────────────────
export default function AuctionRoom() {
  const { auction, bids, myBid, timeLeft, hasWon, loading, placeBid } = useAuction();
  const wsConnected  = useWsStore((s) => s.connected);
  const auctionEvent = useWsStore((s) => s.auctionEvent);

  return (
    <div style={{ minHeight: '100%', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>
      <style>{`
        @keyframes ar-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

      {/* WS reconnect banner */}
      {!wsConnected && (
        <div style={{
          background: '#FEF3C7', border: '1px solid #FDE68A',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, fontWeight: 600, color: '#92400E',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ⚡ Reconnecting to live server — bid submission temporarily unavailable
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1F3A6E', margin: '0 0 4px' }}>
            Auction Room
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Highest bid when the timer expires wins the pot
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {auction?.status === 'open' && (
            <Chip bg="#DCFCE7" color="#166534">
              <LiveDot size={7} /> LIVE
            </Chip>
          )}
          {auction?.status === 'scheduled' && (
            <Chip bg="#FEF3C7" color="#92400E">UPCOMING</Chip>
          )}
        </div>
      </div>

      {/* State router */}
      {loading && <LoadingState />}

      {!loading && (!auction || auction === null) && <NoAuction />}

      {!loading && auction?.status === 'scheduled' && (
        <ScheduledAuction auction={auction} />
      )}

      {!loading && auction?.status === 'open' && (
        <OpenAuction
          auction={auction}
          bids={bids}
          myBid={myBid}
          timeLeft={timeLeft}
          hasWon={hasWon}
          placeBid={placeBid}
        />
      )}

      {!loading && auction?.status === 'closed' && (
        <ClosedAuction auction={auction} />
      )}

      {!loading && auction?.status === 'cancelled' && (
        <div style={C.centerCard}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
          <h2 style={C.h2}>Auction Cancelled</h2>
          <p style={C.muted}>This auction was cancelled by your group admin.</p>
          {auction.cancelReason && (
            <p style={{ ...C.muted, marginTop: 6, fontStyle: 'italic' }}>
              Reason: {auction.cancelReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared style tokens ───────────────────────────────────────────
const C = {
  card: {
    background: '#FFF', border: '1px solid #E2E8F0',
    borderRadius: 12, padding: 20,
  },
  centerCard: {
    background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 14,
    padding: '52px 40px', textAlign: 'center', maxWidth: 520, margin: '0 auto',
  },
  center: {
    padding: '80px 0', textAlign: 'center', color: '#94a3b8',
  },
  h2: { fontSize: 22, fontWeight: 800, color: '#1F3A6E', margin: 0 },
  muted: { color: '#64748b', fontSize: 14, margin: '8px 0 0' },
  label: {
    fontSize: 10, fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3,
  },
  value: { fontSize: 18, fontWeight: 800, color: '#1F3A6E' },
  vdiv: { width: 1, height: 36, background: '#E2E8F0', flexShrink: 0 },
  clock: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: '#F8FAFC', border: '1px solid #E2E8F0',
    borderRadius: 10, padding: '12px 18px', minWidth: 64,
  },
  clockNum: { fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: '#1F3A6E' },
  clockLabel: { fontSize: 9, fontWeight: 700, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase' },
};
