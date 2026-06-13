"""Patch main.py to add create_loan handler."""
import re

with open(r"c:\Web_dev\TransactFlowOS\Backend\main.py", "rb") as f:
    content = f.read().decode("utf-8")

# Normalize line endings for matching
content_norm = content.replace("\r\n", "\n")

OLD = '''        elif channel == "loan_inbox":
            doc_id = payload.get("id")
            if action == "fast_track":'''

NEW = '''        elif channel == "loan_inbox":
            doc_id = payload.get("id")
            if action == "create_loan":
                # Member submits a new loan application from client
                loop     = asyncio.get_event_loop()
                amount   = float(payload.get("amount", 0))
                purpose  = payload.get("purpose", "Personal")
                tenure   = int(payload.get("tenureMonths", 12))
                group_id = payload.get("groupId", "GRP-001")
                app_name = payload.get("applicantName", display_name)
                if amount <= 0 or amount > 500_000:
                    await _send(ws, "loan_inbox", "create_loan_error", {
                        "error": "Amount must be between 1 and 500000."
                    })
                else:
                    def _create():
                        now  = datetime.now(timezone.utc)
                        risk = min(99, max(10, int(50 - (amount / 10_000) + (tenure / 2))))
                        ref, _ = db.collection("loan_applications").add({
                            "applicantUid":       uid,
                            "applicantName":      app_name,
                            "requestedAmountINR": amount,
                            "purpose":            purpose,
                            "tenureMonths":       tenure,
                            "groupId":            group_id,
                            "status":             "Pending",
                            "riskScore":          risk,
                            "submittedAt":        now,
                            "reviewedBy":         None,
                            "reviewedAt":         None,
                            "installments":       [],
                        })
                        db.collection("audit_log").add({
                            "action":      "LOAN_APPLIED",
                            "action_code": "LOAN_APPLIED",
                            "actorUid":    uid,
                            "actorName":   app_name,
                            "actor_uid":   uid,
                            "actor_name":  app_name,
                            "entity_type": "LOAN_APP",
                            "entity_id":   ref.id,
                            "targetUid":   uid,
                            "targetName":  app_name,
                            "amount_inr":  amount,
                            "details":     f"Loan of Rs {amount:,.0f} applied by {app_name} for {purpose}",
                            "timestamp":   now,
                        })
                        return ref.id, now.isoformat()
                    app_id, submitted_at = await loop.run_in_executor(None, _create)
                    await _send(ws, "loan_inbox", "create_loan_ack", {
                        "id":           app_id,
                        "status":       "Pending",
                        "amount":       amount,
                        "purpose":      purpose,
                        "tenureMonths": tenure,
                        "submittedAt":  submitted_at,
                    })
                    log.info(f"  Loan created: {app_id}  uid={uid}  amount={amount}")

            elif action == "fast_track":'''

if OLD in content_norm:
    content_norm = content_norm.replace(OLD, NEW, 1)
    # Write back (keep LF only)
    with open(r"c:\Web_dev\TransactFlowOS\Backend\main.py", "w", newline="\n", encoding="utf-8") as f:
        f.write(content_norm)
    print("SUCCESS: create_loan handler injected")
else:
    print("ERROR: Pattern not found. Searching for nearby text...")
    idx = content_norm.find('elif channel == "loan_inbox"')
    print(f"  loan_inbox block found at index: {idx}")
    print(repr(content_norm[idx:idx+200]))
