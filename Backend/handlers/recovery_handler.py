"""
handlers/recovery_handler.py
Handles moving a recovery case between Kanban stages.
Updates recovery_cases/{doc_id} and records in audit_log/.
"""

import asyncio
from datetime import datetime, timezone

VALID_STAGES = {
    "Overdue_1_5",
    "Warning_5_15",
    "Critical_15_30",
    "Legal_NPR",
}


def _db():
    from firebase_admin import firestore as fa_firestore
    return fa_firestore.client()


async def move_stage(doc_id: str, new_stage: str, actor_uid: str, actor_name: str) -> dict:
    """
    Move a recovery case to a new Kanban stage.

    Returns the updated document dict for broadcasting.
    Raises ValueError for unknown stages.
    """
    if new_stage not in VALID_STAGES:
        raise ValueError(f"Unknown recovery stage: {new_stage}")

    loop = asyncio.get_event_loop()
    db = _db()

    def _write():
        now = datetime.now(timezone.utc)
        rec_ref = db.collection("recovery_cases").document(doc_id)
        snap_before = rec_ref.get()
        member = snap_before.to_dict().get("member_name", "Unknown") if snap_before.exists else "Unknown"

        rec_ref.update({
            "recovery_stage": new_stage,
            "last_moved_by": actor_uid,
            "last_moved_at": now,
        })

        db.collection("audit_log").add({
            "action_code": "RECOVERY_STAGE_MOVE",
            "actor_name": actor_name,
            "actor_uid": actor_uid,
            "entity_type": "RECOVERY_CASE",
            "entity_id": doc_id,
            "amount_inr": 0,
            "details": f"Recovery case for {member} moved to {new_stage} by {actor_name}",
            "timestamp": now,
        })

        snap = rec_ref.get()
        return {**snap.to_dict(), "id": snap.id}

    return await loop.run_in_executor(None, _write)
