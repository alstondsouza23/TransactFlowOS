/**
 * src/hooks/useUserDoc.js — Client
 *
 * Subscribes to the current user's Firestore document (users/{uid})
 * in real-time. Fires toast notifications when kycStatus or loan status
 * changes without a page refresh.
 *
 * Returns the live Firestore document data (or null while loading).
 *
 * Usage:
 *   const userDoc = useUserDoc();
 *   // userDoc.kycStatus, userDoc.userType, userDoc.kycRejectionReason
 */
import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuthStore from '../store/authStore';
import toast from './useToast';

export default function useUserDoc() {
  const uid           = useAuthStore((s) => s.uid);
  const [data, setData] = useState(null);

  // Track previous kycStatus to detect transitions
  const prevKycStatus = useRef(null);
  // Avoid firing toast on the very first load (only on subsequent changes)
  const initialised   = useRef(false);

  useEffect(() => {
    if (!uid) return;

    const unsub = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();

        // ── KYC status change toast ──────────────────────────
        if (initialised.current && prevKycStatus.current !== d.kycStatus) {
          if (d.kycStatus === 'Approved') {
            toast.success(
              'Your KYC has been approved. You can now apply for a loan.',
              7000
            );
          } else if (d.kycStatus === 'Rejected') {
            const reason = d.kycRejectionReason || 'No reason provided.';
            toast.error(
              `Your KYC was not approved. Reason: ${reason}`,
              8000
            );
          }
        }

        prevKycStatus.current = d.kycStatus;
        initialised.current   = true;
        setData(d);
      },
      (err) => {
        console.error('[useUserDoc] onSnapshot error:', err);
      }
    );

    return () => unsub();
  }, [uid]);

  return data;
}
