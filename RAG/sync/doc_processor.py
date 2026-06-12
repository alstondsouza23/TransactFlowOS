"""
RAG/sync/doc_processor.py
Converts Firestore documents into human-readable text chunks for embedding.
Each document → one Pinecone vector with metadata for access-control filtering.

Access levels:
  "self"           → member sees only their own data
  "self_and_staff" → member sees their own; staff sees all
  "group"          → all members of the same group can see
  "staff"          → only employees / admin can see
"""


def _fmt_ts(ts) -> str:
    if ts is None:
        return "N/A"
    try:
        if hasattr(ts, "strftime"):
            return ts.strftime("%d %b %Y %H:%M")
        return str(ts)
    except Exception:
        return str(ts)


def _inr(n) -> str:
    try:
        return f"Rs.{int(n):,}"
    except Exception:
        return str(n)


def process_document(collection: str, doc_id: str, data: dict) -> dict | None:
    """
    Convert a Firestore document to a RAG-ready chunk.
    Returns: { id, text, metadata } or None if the doc should be skipped.
    """
    _processors = {
        "users":             _process_user,
        "loan_applications": _process_loan,
        "kyc_queue":         _process_kyc,
        "recovery_cases":    _process_recovery,
        "audit_log":         _process_audit,
        "auctions":          _process_auction,
        "bids":              _process_bid,
    }
    fn = _processors.get(collection)
    if fn is None:
        return None
    try:
        result = fn(doc_id, data)
        if result is None:
            return None
        text, metadata = result
        metadata["collection"] = collection
        metadata["doc_id"]     = doc_id
        return {
            "id":       f"{collection}_{doc_id}",
            "text":     text.strip(),
            "metadata": metadata,
        }
    except Exception as e:
        print(f"[doc_processor] Error {collection}/{doc_id}: {e}")
        return None


# ── Per-collection processors ─────────────────────────────────────

def _process_user(doc_id: str, d: dict):
    name     = d.get("displayName") or d.get("email", "Unknown")
    kyc      = d.get("kycStatus", "unknown")
    utype    = d.get("userType", "unknown")
    group_id = d.get("groupId", "")
    prized   = d.get("prizedInCycle", False)
    email    = d.get("email", "")

    text = (
        f"User Profile: {name}\n"
        f"Email: {email}\n"
        f"KYC Status: {kyc}\n"
        f"Account Type: {utype}\n"
        f"Group: {group_id or 'Not assigned'}\n"
        f"Won a previous cycle: {'Yes' if prized else 'No'}"
    )
    return text, {
        "uid":      doc_id,
        "group_id": group_id,
        "access":   "self",
    }


def _process_loan(doc_id: str, d: dict):
    uid    = d.get("applicantUid") or d.get("applicant_uid", "")
    name   = d.get("applicantName") or d.get("applicant_name", "Unknown")
    amount = d.get("requestedAmountINR") or d.get("requested_amount_inr", 0)
    tenure = d.get("tenureMonths", 0)
    status = d.get("status", "Unknown")
    reason = d.get("rejectionReason", "")
    reviewed_at = _fmt_ts(d.get("reviewedAt"))

    installments = d.get("installments", [])
    due_info     = ""
    if installments:
        pending = [i for i in installments if i.get("status") == "Pending"]
        if pending:
            p = pending[0]
            due_info = f"\nNext EMI: {p.get('dueDate','?')} — {_inr(p.get('emi',0))}"

    text = (
        f"Loan Application — {name}\n"
        f"Amount: {_inr(amount)}, Tenure: {tenure} months\n"
        f"Status: {status}, Reviewed: {reviewed_at}"
        + (f"\nRejection reason: {reason}" if reason else "")
        + due_info
    )
    return text, {
        "uid":    uid,
        "status": status,
        "access": "self",
    }


def _process_kyc(doc_id: str, d: dict):
    uid    = d.get("user_uid", "")
    name   = d.get("full_name") or d.get("name", "Unknown")
    status = d.get("status", "Pending")
    rev_by = d.get("reviewed_by", "Not yet reviewed")
    rev_at = _fmt_ts(d.get("reviewed_at"))
    reason = d.get("rejection_reason") or d.get("rejectionReason", "")

    text = (
        f"KYC Submission — {name}\n"
        f"Status: {status}\n"
        f"Reviewed by: {rev_by} on {rev_at}"
        + (f"\nRejection: {reason}" if reason else "")
    )
    return text, {
        "uid":    uid,
        "status": status,
        "access": "self_and_staff",
    }


def _process_recovery(doc_id: str, d: dict):
    uid     = d.get("member_uid", "")
    name    = d.get("member_name", "Unknown")
    stage   = d.get("recovery_stage", "Unknown")
    moved   = d.get("last_moved_by", "System")
    moved_at = _fmt_ts(d.get("last_moved_at"))
    overdue = d.get("overdue_amount_inr") or d.get("amount_overdue_inr", 0)

    text = (
        f"Recovery Case — {name}\n"
        f"Stage: {stage}, Overdue: {_inr(overdue)}\n"
        f"Last updated by {moved} on {moved_at}"
    )
    return text, {
        "uid":    uid,
        "stage":  stage,
        "access": "staff",
    }


def _process_audit(doc_id: str, d: dict):
    action    = d.get("action") or d.get("action_code", "Unknown")
    actor     = d.get("actorName") or d.get("actor_name", "System")
    details   = d.get("details", "")
    ts        = _fmt_ts(d.get("timestamp"))
    entity    = d.get("entity_type", "")
    target_uid = d.get("targetUid") or d.get("actor_uid", "")
    amount    = d.get("amount_inr", 0)

    text = (
        f"Audit Log — {action}\n"
        f"By: {actor} at {ts}\n"
        f"Entity: {entity}"
        + (f", Amount: {_inr(amount)}" if amount else "")
        + (f"\nDetails: {details}" if details else "")
    )
    return text, {
        "uid":    target_uid,
        "action": action,
        "access": "staff",
    }


def _process_auction(doc_id: str, d: dict):
    group_id  = d.get("groupId", "")
    cycle     = d.get("cycleNumber", "?")
    month     = d.get("monthLabel", "")
    status    = d.get("status", "unknown")
    pot       = d.get("potAmountINR", 0)
    winner    = d.get("winnerName", "")
    win_bid   = d.get("winningBidINR", 0)
    opened_at = _fmt_ts(d.get("openedAt"))
    closed_at = _fmt_ts(d.get("closedAt"))

    text = (
        f"Auction — Cycle #{cycle} ({month})\n"
        f"Group: {group_id}, Pot: {_inr(pot)}, Status: {status}"
        + (f"\nOpened: {opened_at}" if d.get("openedAt") else "")
        + (f"\nClosed: {closed_at}" if status == "closed" else "")
        + (f"\nWinner: {winner} — bid {_inr(win_bid)}" if winner else "\nNo winner yet")
    )
    return text, {
        "group_id": group_id,
        "status":   status,
        "access":   "group",
        "uid":      "",
    }


def _process_bid(doc_id: str, d: dict):
    uid       = d.get("bidderUid", "")
    name      = d.get("bidderName", "Unknown")
    group_id  = d.get("groupId", "")
    amount    = d.get("bidAmountINR", 0)
    auction_id = d.get("auctionId", "")
    winning   = d.get("isWinning", False)
    placed_at = _fmt_ts(d.get("placedAt"))

    text = (
        f"Bid by {name} — {_inr(amount)}\n"
        f"Auction: {auction_id}, Placed: {placed_at}\n"
        f"Status: {'WINNING BID' if winning else 'Not leading'}"
    )
    return text, {
        "uid":       uid,
        "group_id":  group_id,
        "auction_id": auction_id,
        "access":    "self_and_staff",
    }
