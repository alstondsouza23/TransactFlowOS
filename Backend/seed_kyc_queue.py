"""
Backend/seed_kyc_queue.py
=========================
Seeds the `kyc_queue` Firestore collection from existing `users` docs
that have kycStatus = 'Pending' and have PAN/phone details.

This ensures the Employee KYC Approvals page has data to show immediately
without waiting for client-side submissions.

Usage (run from Backend/ directory):
    python seed_kyc_queue.py
"""

import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

SA_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
if not os.path.exists(SA_PATH):
    print("[ERROR] serviceAccountKey.json not found in Backend/")
    sys.exit(1)

if not firebase_admin._apps:
    cred = credentials.Certificate(SA_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()
SEP = "-" * 54


def seed():
    print("")
    print(SEP)
    print("  TransactFlowOS -- Seed kyc_queue")
    print(SEP)
    print("")

    # Get all users with kycStatus Pending
    users = list(db.collection("users").where("kycStatus", "==", "Pending").stream())
    print("  Found {} users with kycStatus=Pending\n".format(len(users)))

    # Check existing kyc_queue entries to avoid duplicates
    existing_uids = set()
    for kq in db.collection("kyc_queue").stream():
        d = kq.to_dict() or {}
        uid = d.get("userId") or d.get("user_uid")
        if uid:
            existing_uids.add(uid)

    print("  {} entries already in kyc_queue (will skip those)\n".format(len(existing_uids)))

    created = 0
    skipped = 0

    for u in users:
        uid  = u.id
        data = u.to_dict() or {}
        name = data.get("name", "Unknown")

        if uid in existing_uids:
            print("  [skip] {:<28} already in queue".format(name))
            skipped += 1
            continue

        # Build kyc_queue document
        kyc_doc = {
            "userId":      uid,
            "user_uid":    uid,
            "name":        name,
            "email":       data.get("email", ""),
            "phone":       data.get("phone", "+91-XXXXXXXXXX"),
            "panMasked":   data.get("panMasked", "XXXXX****X"),
            "bankMasked":  data.get("bankMasked", "XXXX...0000"),
            "groupId":     data.get("groupId", "GRP-001"),
            "status":      "Pending",
            "submittedAt": firestore.SERVER_TIMESTAMP,
        }

        try:
            db.collection("kyc_queue").add(kyc_doc)
            print("  [add] {:<28} -> kyc_queue entry created".format(name))
            created += 1
        except Exception as ex:
            print("  [error] {:<28} {}".format(name, ex))

    print("")
    print(SEP)
    print("  Done -- {} created, {} skipped".format(created, skipped))
    print(SEP)
    print("")
    print("  Open http://localhost:5174/ and go to KYC Approvals.")
    print("  You should see {} entries in the queue.".format(created + len(existing_uids)))
    print("")


if __name__ == "__main__":
    seed()
