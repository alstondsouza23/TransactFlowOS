"""
handlers/loan_handler.py
Handles fast-track loan approval.
Updates loan_applications/{doc_id} and records in audit_log/.
"""

import asyncio
from datetime import datetime, timezone


def _db():
    from firebase_admin import firestore as fa_firestore
    return fa_firestore.client()


async def fast_track_approve(doc_id: str, actor_uid: str, actor_name: str) -> dict:
    """
    Fast-track a loan application to Verified status.

    Returns the updated document dict for broadcasting.
    """
    loop = asyncio.get_event_loop()
    db = _db()

    def _write():
        now = datetime.now(timezone.utc)
        loan_ref = db.collection("loan_applications").document(doc_id)
        snap_before = loan_ref.get()
        amount = snap_before.to_dict().get("requested_amount_inr", 0) if snap_before.exists else 0

        loan_ref.update({
            "status": "Verified",
            "approved_by": actor_uid,
            "approved_at": now,
        })

        db.collection("audit_log").add({
            "action_code": "LOAN_FAST_TRACK",
            "actor_name": actor_name,
            "actor_uid": actor_uid,
            "entity_type": "LOAN_APP",
            "entity_id": doc_id,
            "amount_inr": amount,
            "details": f"Loan fast-tracked to Verified by {actor_name}",
            "timestamp": now,
        })

        snap = loan_ref.get()
        return {**snap.to_dict(), "id": snap.id}

    return await loop.run_in_executor(None, _write)
