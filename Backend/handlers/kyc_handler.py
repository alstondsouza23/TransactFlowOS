"""
handlers/kyc_handler.py
=======================
Handles KYC approve / reject actions from the WebSocket server.

Dual-write strategy:
  1. Writes to kyc_queue/{doc_id}  (legacy — kept for WS snapshot compatibility)
  2. Writes to users/{uid}         (new — drives Client onSnapshot live updates)

The uid of the KYC applicant is stored in kyc_queue docs as `user_uid`.
If absent, only kyc_queue is updated.
"""

import asyncio
from datetime import datetime, timezone
from google.cloud import firestore


def _db() -> firestore.Client:
    """Lazy import so the main module can init Firebase first."""
    from firebase_admin import firestore as fa_firestore
    return fa_firestore.client()


async def approve_kyc(doc_id: str, actor_uid: str, actor_name: str) -> dict:
    """
    Mark a KYC request as Approved.
    Dual-writes to kyc_queue and users collection.
    Returns the updated kyc_queue document dict for broadcasting.
    """
    loop = asyncio.get_event_loop()
    db   = _db()

    def _write():
        now     = datetime.now(timezone.utc)
        kyc_ref = db.collection("kyc_queue").document(doc_id)

        # 1. Update kyc_queue (legacy WS broadcast compatibility)
        kyc_ref.update({
            "status":      "Approved",
            "reviewed_by": actor_uid,
            "reviewed_at": now,
        })

        # 2. Dual-write to users/{uid} so Client onSnapshot fires instantly
        snap_before = kyc_ref.get()
        user_uid    = snap_before.to_dict().get("user_uid") if snap_before.exists else None
        if user_uid:
            try:
                db.collection("users").document(user_uid).set(
                    {
                        "kycStatus":     "Approved",
                        "userType":      "loan_eligible",
                        "kycApprovedAt": now,
                        "kycApprovedBy": actor_uid,
                    },
                    merge=True,
                )
            except Exception as e:
                # Non-fatal — log and continue
                import logging
                logging.getLogger("transactflow-ws").warning(
                    f"[kyc_handler] users/{user_uid} write failed: {e}"
                )

        # 3. Audit trail
        db.collection("audit_log").add({
            "action_code": "KYC_APPROVE",
            "action":      "KYC_APPROVED",
            "actor_name":  actor_name,
            "actor_uid":   actor_uid,
            "actorUid":    actor_uid,
            "actorName":   actor_name,
            "entity_type": "KYC",
            "entity_id":   doc_id,
            "targetUid":   user_uid or doc_id,
            "amount_inr":  0,
            "details":     f"KYC approved by {actor_name}",
            "timestamp":   now,
        })

        snap = kyc_ref.get()
        return {**snap.to_dict(), "id": snap.id}

    return await loop.run_in_executor(None, _write)


async def reject_kyc(doc_id: str, reason: str, actor_uid: str, actor_name: str) -> dict:
    """
    Mark a KYC request as Rejected with a mandatory reason.
    Dual-writes to kyc_queue and users collection.
    Returns the updated kyc_queue document dict for broadcasting.
    """
    loop = asyncio.get_event_loop()
    db   = _db()

    def _write():
        now     = datetime.now(timezone.utc)
        kyc_ref = db.collection("kyc_queue").document(doc_id)

        # 1. Update kyc_queue
        kyc_ref.update({
            "status":           "Rejected",
            "rejection_reason": reason,
            "reviewed_by":      actor_uid,
            "reviewed_at":      now,
        })

        # 2. Dual-write to users/{uid}
        snap_before = kyc_ref.get()
        user_uid    = snap_before.to_dict().get("user_uid") if snap_before.exists else None
        if user_uid:
            try:
                db.collection("users").document(user_uid).set(
                    {
                        "kycStatus":          "Rejected",
                        "kycRejectionReason": reason,
                        "kycRejectedAt":      now,
                        "kycRejectedBy":      actor_uid,
                    },
                    merge=True,
                )
            except Exception as e:
                import logging
                logging.getLogger("transactflow-ws").warning(
                    f"[kyc_handler] users/{user_uid} write failed: {e}"
                )

        # 3. Audit trail
        db.collection("audit_log").add({
            "action_code": "KYC_REJECT",
            "action":      "KYC_REJECTED",
            "actor_name":  actor_name,
            "actor_uid":   actor_uid,
            "actorUid":    actor_uid,
            "actorName":   actor_name,
            "entity_type": "KYC",
            "entity_id":   doc_id,
            "targetUid":   user_uid or doc_id,
            "amount_inr":  0,
            "details":     f"KYC rejected by {actor_name}. Reason: {reason}",
            "timestamp":   now,
        })

        snap = kyc_ref.get()
        return {**snap.to_dict(), "id": snap.id}

    return await loop.run_in_executor(None, _write)
