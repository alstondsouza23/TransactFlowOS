"""
Backend/patch_existing_users.py
================================
Patches all existing users in Firestore that are MISSING kycStatus.
Adds: kycStatus='Pending', userType='kyc_pending', groupId='GRP-001'
so they appear in the Employee Desktop KYC Approvals queue.

Only patches users that don't already have kycStatus set.

Usage (run from Backend/ directory):
    python patch_existing_users.py
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

SEP = "-" * 52

def patch_users():
    print("")
    print(SEP)
    print("  TransactFlowOS -- Patch Existing Users")
    print(SEP)
    print("")

    docs    = list(db.collection("users").stream())
    patched = 0
    skipped = 0
    errors  = 0

    print("  Found {} total user documents\n".format(len(docs)))

    for d in docs:
        data = d.to_dict() or {}
        uid  = d.id
        name = data.get("name", "Unknown")

        if data.get("kycStatus"):
            print("  [skip] {:<25} kycStatus={}".format(name, data.get("kycStatus")))
            skipped += 1
            continue

        try:
            db.collection("users").document(uid).set(
                {
                    "kycStatus": "Pending",
                    "userType":  "kyc_pending",
                    "groupId":   "GRP-001",
                },
                merge=True,
            )
            print("  [patch] {:<25} -> kycStatus: Pending added".format(name))
            patched += 1
        except Exception as ex:
            print("  [error] {:<25} {}".format(name, ex))
            errors += 1

    print("")
    print(SEP)
    print("  Done -- {} patched, {} skipped, {} errors".format(patched, skipped, errors))
    print(SEP)
    print("")
    print("  These users will now appear in the KYC Approvals queue")
    print("  once Firestore rules allow the employee to read them.")
    print("")


if __name__ == "__main__":
    patch_users()
