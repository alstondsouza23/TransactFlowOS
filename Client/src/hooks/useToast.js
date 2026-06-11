/**
 * src/hooks/useToast.js — Client
 *
 * Lightweight toast system — no external library required.
 * Creates a module-level event bus so toasts can be triggered
 * from anywhere (hooks, non-React modules) without prop drilling.
 *
 * Usage anywhere in the app:
 *   import toast from '../hooks/useToast';
 *   toast.success('Your KYC has been approved.');
 *   toast.error('Rejected. Reason: ...');
 *   toast.info('Processing...');
 *
 * In a component (to get the live queue):
 *   import { useToastQueue } from '../hooks/useToast';
 *   const toasts = useToastQueue(); // rendered by <Toast /> in App.jsx
 */
import { useState, useEffect } from 'react';

// ── Event bus ────────────────────────────────────────────────────
const listeners = new Set();
let _toasts = [];
let _nextId = 1;

function emit(toasts) {
  _toasts = toasts;
  listeners.forEach((fn) => fn(toasts));
}

function push(type, message, duration = 5000) {
  const id = _nextId++;
  const t = { id, type, message };
  emit([..._toasts, t]);
  setTimeout(() => {
    emit(_toasts.filter((x) => x.id !== id));
  }, duration);
  return id;
}

// ── Public API ───────────────────────────────────────────────────
const toast = {
  success: (msg, duration) => push('success', msg, duration),
  error:   (msg, duration) => push('error',   msg, duration),
  info:    (msg, duration) => push('info',    msg, duration),
  dismiss: (id)            => emit(_toasts.filter((x) => x.id !== id)),
};

export default toast;

// ── React hook — used by <Toast /> to render the queue ───────────
export function useToastQueue() {
  const [toasts, setToasts] = useState(_toasts);

  useEffect(() => {
    const fn = (t) => setToasts([...t]);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  return toasts;
}
