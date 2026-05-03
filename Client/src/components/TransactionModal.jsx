import React, { useState, useEffect } from 'react';

/**
 * TransactionModal
 * Props:
 *   isOpen     {boolean}  - controls visibility
 *   onClose    {function} - called when user closes modal
 *   transaction {object}  - { referenceId, method, timestamp }
 */
const TransactionModal = ({ isOpen, onClose, transaction = {} }) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId;
    let autoCloseId;

    if (isOpen) {
      setIsRendered(true);
      // Small delay to ensure the DOM element exists before setting opacity to 1
      timeoutId = setTimeout(() => setIsVisible(true), 10);

      // Auto close after 4 seconds
      autoCloseId = setTimeout(() => {
        handleClose();
      }, 4000);

    } else {
      setIsVisible(false);
      // Wait for the exit animation to complete before removing from DOM
      timeoutId = setTimeout(() => setIsRendered(false), 300);
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(autoCloseId);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  if (!isRendered) return null;

  const {
    referenceId = 'TXN-000000',
    method = 'Bank Transfer',
    timestamp = new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }),
  } = transaction;

  // Close when clicking the dim overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return (
    <div style={{ ...s.overlay, opacity: isVisible ? 1 : 0 }} onClick={handleOverlayClick}>
      <div style={{
        ...s.modal,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)'
      }}>

        {/* ── Modal Header ── */}
        <div style={s.header}>
          <span style={s.headerTitle}>Payment Verification Proof</span>
          <button style={s.headerClose} onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* ── Success Icon ── */}
        <div style={s.iconRing}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* ── Title ── */}
        <p style={s.title}>Transaction Verified</p>
        <p style={s.subtitle}>Payment successfully processed by foreman.</p>

        {/* ── Details Table ── */}
        <div style={s.detailsBox}>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>REFERENCE ID</span>
            <span style={s.detailValue}>{referenceId}</span>
          </div>
          <div style={{ ...s.detailRow, borderTop: '1px solid #f1f5f9' }}>
            <span style={s.detailLabel}>METHOD</span>
            <span style={s.detailValue}>{method}</span>
          </div>
          <div style={{ ...s.detailRow, borderTop: '1px solid #f1f5f9' }}>
            <span style={s.detailLabel}>TIMESTAMP</span>
            <span style={s.detailValue}>{timestamp}</span>
          </div>
        </div>

        {/* ── Close Button ── */}
        <button style={s.closeBtn} onClick={handleClose}>
          Close Receipt
        </button>

      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    boxSizing: 'border-box',
    transition: 'opacity 0.3s ease-out',
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'opacity 0.3s ease-out, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  /* Header bar */
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px',
    borderBottom: '1px solid #f1f5f9',
    boxSizing: 'border-box',
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
  },
  headerClose: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    color: '#94a3b8',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 2px',
  },
  /* Success icon */
  iconRing: {
    marginTop: '28px',
    marginBottom: '16px',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#d1fae5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 6px 0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 24px 0',
    textAlign: 'center',
  },
  /* Details table */
  detailsBox: {
    width: 'calc(100% - 40px)',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
  },
  detailLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
  },
  /* Close button */
  closeBtn: {
    marginBottom: '20px',
    height: '46px',
    paddingLeft: '32px',
    paddingRight: '32px',
    backgroundColor: '#1b3664',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default TransactionModal;
