/**
 * src/hooks/useLoanDocs.js — Client
 *
 * Subscribes in real-time to loan_applications where
 * applicantUid == current user's UID.
 *
 * Fires toast notifications when a loan status changes from Pending
 * to Approved or Rejected — without requiring a page refresh.
 *
 * Returns { loans: LoanDoc[], loading: boolean }
 */
import { useEffect, useRef, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuthStore from '../store/authStore';
import toast from './useToast';

export default function useLoanDocs() {
  const uid = useAuthStore((s) => s.uid);
  const [loans,   setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Track statuses per loan id to detect transitions
  const prevStatuses  = useRef({});
  const initialised   = useRef(false);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'loan_applications'),
      where('applicantUid', '==', uid),
      orderBy('submittedAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        // ── Status change toasts ──────────────────────────────
        if (initialised.current) {
          docs.forEach((loan) => {
            const prev = prevStatuses.current[loan.id];
            if (prev && prev !== loan.status) {
              const amount = loan.requestedAmountINR
                ? `₹${Number(loan.requestedAmountINR).toLocaleString('en-IN')}`
                : 'your loan';
              if (loan.status === 'Approved') {
                toast.success(`Your loan of ${amount} has been approved.`, 7000);
              } else if (loan.status === 'Rejected') {
                const reason = loan.rejectionReason || 'No reason provided.';
                toast.error(
                  `Your loan application was not approved. Reason: ${reason}`,
                  8000
                );
              }
            }
            prevStatuses.current[loan.id] = loan.status;
          });
        } else {
          // First load — populate tracking map without toasting
          docs.forEach((loan) => {
            prevStatuses.current[loan.id] = loan.status;
          });
          initialised.current = true;
        }

        setLoans(docs);
        setLoading(false);
      },
      (err) => {
        console.error('[useLoanDocs] onSnapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  return { loans, loading };
}
