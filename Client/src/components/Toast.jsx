/**
 * src/components/Toast.jsx — Client
 *
 * Renders the live toast stack in the top-right corner.
 * Mount this once inside App.jsx — it self-manages via useToastQueue.
 *
 * Toast types:
 *   success → green  (#10b981)
 *   error   → red    (#ef4444)
 *   info    → blue   (#3b82f6)
 */
import React from 'react';
import { useToastQueue } from '../hooks/useToast';
import toast from '../hooks/useToast';

const TYPE_STYLES = {
  success: {
    border:     '1px solid #bbf7d0',
    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    iconColor:  '#10b981',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  error: {
    border:     '1px solid #fecaca',
    background: 'linear-gradient(135deg, #fff5f5, #fee2e2)',
    iconColor:  '#ef4444',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
  info: {
    border:     '1px solid #bfdbfe',
    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    iconColor:  '#3b82f6',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
};

export default function Toast() {
  const toasts = useToastQueue();

  if (toasts.length === 0) return null;

  return (
    <div style={s.stack}>
      {toasts.map((t) => {
        const st = TYPE_STYLES[t.type] ?? TYPE_STYLES.info;
        return (
          <div key={t.id} style={{ ...s.toast, border: st.border, background: st.background }}>
            <span style={s.icon}>{st.icon}</span>
            <p style={s.msg}>{t.message}</p>
            <button style={s.close} onClick={() => toast.dismiss(t.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
      `}</style>
    </div>
  );
}

const s = {
  stack: {
    position:      'fixed',
    top:           '24px',
    right:         '24px',
    zIndex:        9999,
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
    pointerEvents: 'none',
    maxWidth:      '420px',
    width:         'calc(100vw - 48px)',
  },
  toast: {
    display:       'flex',
    alignItems:    'flex-start',
    gap:           '12px',
    padding:       '14px 16px',
    borderRadius:  '14px',
    boxShadow:     '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
    animation:     'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'all',
    fontFamily:    '"Plus Jakarta Sans", sans-serif',
  },
  icon: {
    flexShrink: 0,
    marginTop:  '1px',
  },
  msg: {
    flex:       1,
    margin:     0,
    fontSize:   '14px',
    fontWeight: '600',
    color:      '#1e293b',
    lineHeight: '1.5',
  },
  close: {
    background:  'none',
    border:      'none',
    cursor:      'pointer',
    padding:     '2px',
    flexShrink:  0,
    borderRadius:'4px',
    display:     'flex',
    alignItems:  'center',
  },
};