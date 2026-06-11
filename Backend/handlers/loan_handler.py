"""
handlers/loan_handler.py
========================
Handles loan approve / reject actions from the WebSocket server.

approve_loan:  Updates loan_applications + users/{uid} + EMI installments + audit_log
reject_loan:   Updates loan_applications + audit_log (userType stays loan_eligible)
fast_track_approve: Legacy alias — kept for backwards-compat with existing WS routes.
"""

import asyncio
import math
from datetime import datetime, timezone


def _db():
    from firebase_admin import firestore as fa_firestore
    return fa_firestore.client()


def _calc_emi(principal: float, annual_rate_pct: float, tenure_months: int) -> float:
    """Standard reducing-balance EMI formula."""
    if annual_rate_pct == 0:
        return principal / tenure_months
    r = annual_rate_pct / 12 / 100
    n = tenure_months
    return (principal * r * math.pow(1 + r, n)) / (math.pow(1 + r, n) - 1)


def _build_installments(principal: float, annual_rate_pct: float = 12.0, tenure_months: int = 12) -> list:
    emi     = _calc_emi(principal, annual_rate_pct, tenure_months)
    balance = principal
    now     = datetime.now(timezone.utc)
    result  = []

    for i in range(1, tenure_months + 1):
        interest   = balance * (annual_rate_pct / 12 / 100)
        principal_ = emi - interest
        balance   -= principal_

        due = datetime(now.year, now.month, now.day)
        # Advance by i months
        month = now.month + i - 1
        due   = due.replace(year=now.year + month // 12, month=month % 12 + 1, day=1)

        result.append({
            "installmentNo":  i,
            "dueDate":        due.strftime("%Y-%m-%d"),
            "emi":            round(emi),
            "principal":      round(principal_),
            "interest":       round(interest),
            "closingBalance": max(0, round(balance)),
            "status":         "Pending",
        })

    return result


async def approve_loan(doc_id: str, actor_uid: str, actor_name: str) -> dict:
    """
    Approve a loan application.
    Writes installment schedule, updates users/{uid}, records audit entry.
    """
    loop = asyncio.get_event_loop()
    db   = _db()

    def _write():
        now      = datetime.now(timezone.utc)
        loan_ref = db.collection("loan_applications").document(doc_id)
        snap     = loan_ref.get()

        if not snap.exists:
            raise ValueError(f"loan_applications/{doc_id} does not exist")

        data          = snap.to_dict()
        amount        = data.get("requestedAmountINR") or data.get("requested_amount_inr", 0)
        tenure        = data.get("tenureMonths", 12)
        applicant_uid = data.get("applicantUid") or data.get("applicant_uid")
        applicant_name= data.get("applicantName") or data.get("applicant_name", "Member")

        installments = _build_installments(float(amount), 12.0, int(tenure))

        # 1. Update loan application
        loan_ref.update({
            "status":       "Approved",
            "reviewedBy":   actor_uid,
            "reviewedAt":   now,
            "installments": installments,
        })

        # 2. Update user document
        if applicant_uid:
            try:
                db.collection("users").document(applicant_uid).set(
                    {"userType": "contributor", "activeLoanId": doc_id},
                    merge=True,
                )
            except Exception as e:
                import logging
                logging.getLogger("transactflow-ws").warning(
                    f"[loan_handler] users/{applicant_uid} write failed: {e}"
                )

        # 3. Audit trail
        db.collection("audit_log").add({
            "action_code": "LOAN_APPROVED",
            "action":      "LOAN_APPROVED",
            "actor_name":  actor_name,
            "actor_uid":   actor_uid,
            "actorUid":    actor_uid,
            "actorName":   actor_name,
            "entity_type": "LOAN_APP",
            "entity_id":   doc_id,
            "targetUid":   applicant_uid or doc_id,
            "targetName":  applicant_name,
            "amount_inr":  amount,
            "details":     f"Loan of ₹{amount} approved by {actor_name} for {applicant_name}",
            "timestamp":   now,
        })

        updated = loan_ref.get()
        return {**updated.to_dict(), "id": updated.id}

    return await loop.run_in_executor(None, _write)


async def reject_loan(doc_id: str, reason: str, actor_uid: str, actor_name: str) -> dict:
    """
    Reject a loan application.
    User's userType stays loan_eligible so they can re-apply.
    """
    loop = asyncio.get_event_loop()
    db   = _db()

    def _write():
        now      = datetime.now(timezone.utc)
        loan_ref = db.collection("loan_applications").document(doc_id)
        snap     = loan_ref.get()

        data          = snap.to_dict() if snap.exists else {}
        applicant_uid = data.get("applicantUid") or data.get("applicant_uid")
        applicant_name= data.get("applicantName") or data.get("applicant_name", "Member")
        amount        = data.get("requestedAmountINR") or data.get("requested_amount_inr", 0)

        loan_ref.update({
            "status":          "Rejected",
            "rejectionReason": reason,
            "reviewedBy":      actor_uid,
            "reviewedAt":      now,
        })

        db.collection("audit_log").add({
            "action_code": "LOAN_REJECTED",
            "action":      "LOAN_REJECTED",
            "actor_name":  actor_name,
            "actor_uid":   actor_uid,
            "actorUid":    actor_uid,
            "actorName":   actor_name,
            "entity_type": "LOAN_APP",
            "entity_id":   doc_id,
            "targetUid":   applicant_uid or doc_id,
            "targetName":  applicant_name,
            "amount_inr":  amount,
            "details":     f"Loan rejected by {actor_name}. Reason: {reason}",
            "timestamp":   now,
        })

        updated = loan_ref.get()
        return {**updated.to_dict(), "id": updated.id}

    return await loop.run_in_executor(None, _write)


async def fast_track_approve(doc_id: str, actor_uid: str, actor_name: str) -> dict:
    """
    Legacy alias — fast-tracks a loan to Approved status.
    Delegates to the new approve_loan handler.
    """
    return await approve_loan(doc_id, actor_uid, actor_name)
