"""
handlers/kyc_handler.py
Handles KYC approve / reject actions.
Writes the status change to kyc_queue/{doc_id} and records an
entry in audit_log/.
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

    Returns the updated document dict for broadcasting.
    """
    loop = asyncio.get_event_loop()
    db = _db()

    def _write():
        now = datetime.now(timezone.utc)
        kyc_ref = db.collection("kyc_queue").document(doc_id)
        kyc_ref.update({
            "status": "Approved",
            "reviewed_by": actor_uid,
            "reviewed_at": now,
        })

        # Audit trail
        db.collection("audit_log").add({
            "action_code": "KYC_APPROVE",
            "actor_name": actor_name,
            "actor_uid": actor_uid,
            "entity_type": "KYC",
            "entity_id": doc_id,
            "amount_inr": 0,
            "details": f"KYC approved by {actor_name}",
            "timestamp": now,
        })

        snap = kyc_ref.get()
        return {**snap.to_dict(), "id": snap.id}

    return await loop.run_in_executor(None, _write)


async def reject_kyc(doc_id: str, reason: str, actor_uid: str, actor_name: str) -> dict:
    """
    Mark a KYC request as Rejected with a mandatory reason.

    Returns the updated document dict for broadcasting.
    """
    loop = asyncio.get_event_loop()
    db = _db()

    def _write():
        now = datetime.now(timezone.utc)
        kyc_ref = db.collection("kyc_queue").document(doc_id)
        kyc_ref.update({
            "status": "Rejected",
            "rejection_reason": reason,
            "reviewed_by": actor_uid,
            "reviewed_at": now,
        })

        db.collection("audit_log").add({
            "action_code": "KYC_REJECT",
            "actor_name": actor_name,
            "actor_uid": actor_uid,
            "entity_type": "KYC",
            "entity_id": doc_id,
            "amount_inr": 0,
            "details": f"KYC rejected by {actor_name}. Reason: {reason}",
            "timestamp": now,
        })

        snap = kyc_ref.get()
        return {**snap.to_dict(), "id": snap.id}

    return await loop.run_in_executor(None, _write)
