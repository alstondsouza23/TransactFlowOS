"""
Backend/seed_firestore.py — Sample Data Seeder
===============================================
Run once to populate Firestore with realistic sample data so the
Employee Dashboard is immediately live and functional.

Usage:
    python seed_firestore.py

This is safe to re-run — it ADDS new documents each time.
To wipe collections first, uncomment the _clear_collection() calls below.
"""

import os
import sys
from datetime import datetime, timezone, timedelta
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

_cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
if not os.path.exists(_cred_path):
    print(f"❌ Service account key not found at: {_cred_path}")
    print("   Download it from Firebase Console → Project Settings → Service Accounts")
    sys.exit(1)

if not firebase_admin._apps:
    cred = credentials.Certificate(_cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()
now = datetime.now(timezone.utc)


def _ts(days=0, hours=0):
    return now - timedelta(days=days, hours=hours)


def _clear_collection(name: str):
    """Delete all documents in a collection (use with caution)."""
    for doc in db.collection(name).stream():
        doc.reference.delete()
    print(f"  🗑  Cleared {name}")


# ─────────────────────────────────────────────────────────────────
# loan_applications
# ─────────────────────────────────────────────────────────────────
LOANS = [
    {
        "applicant_name": "Rahul Sharma",
        "requested_amount_inr": 50000,
        "status": "Reviewing",
        "risk_score": 842,
        "submitted_at": _ts(hours=2),
        "applicant_uid": "uid_rahul_001",
    },
    {
        "applicant_name": "Priyanka Chopra",
        "requested_amount_inr": 150000,
        "status": "Verified",
        "risk_score": 910,
        "submitted_at": _ts(hours=5),
        "applicant_uid": "uid_priyanka_002",
    },
    {
        "applicant_name": "Amit Kumar",
        "requested_amount_inr": 25000,
        "status": "Pending",
        "risk_score": 720,
        "submitted_at": _ts(days=1),
        "applicant_uid": "uid_amit_003",
    },
    {
        "applicant_name": "Sneha Reddy",
        "requested_amount_inr": 80000,
        "status": "Reviewing",
        "risk_score": 785,
        "submitted_at": _ts(days=1, hours=3),
        "applicant_uid": "uid_sneha_004",
    },
    {
        "applicant_name": "Vikram Singh",
        "requested_amount_inr": 200000,
        "status": "Pending",
        "risk_score": 650,
        "submitted_at": _ts(days=2),
        "applicant_uid": "uid_vikram_005",
    },
    {
        "applicant_name": "Ananya Desai",
        "requested_amount_inr": 120000,
        "status": "Verified",
        "risk_score": 880,
        "submitted_at": _ts(days=2, hours=6),
        "applicant_uid": "uid_ananya_006",
    },
    {
        "applicant_name": "Karthik Nair",
        "requested_amount_inr": 35000,
        "status": "Pending",
        "risk_score": 695,
        "submitted_at": _ts(days=3),
        "applicant_uid": "uid_karthik_007",
    },
    {
        "applicant_name": "Divya Menon",
        "requested_amount_inr": 95000,
        "status": "Reviewing",
        "risk_score": 760,
        "submitted_at": _ts(days=3, hours=2),
        "applicant_uid": "uid_divya_008",
    },
]

# ─────────────────────────────────────────────────────────────────
# audit_log
# ─────────────────────────────────────────────────────────────────
AUDIT_LOG = [
    {
        "action_code": "AUCTION_END",
        "actor_name": "System",
        "amount_inr": 45000,
        "timestamp": _ts(hours=1, days=0),
        "entity_type": "AUCTION",
        "entity_id": "GRP-22",
        "details": "Auction #GRP-22 ended successfully. Bid won.",
    },
    {
        "action_code": "KYC_SUBMIT",
        "actor_name": "Anil K.",
        "amount_inr": 0,
        "timestamp": _ts(hours=2),
        "entity_type": "KYC",
        "entity_id": "KYC-0081",
        "details": "KYC submitted for manual review",
    },
    {
        "action_code": "DEFAULT_WARNING",
        "actor_name": "System",
        "amount_inr": 0,
        "timestamp": _ts(hours=3),
        "entity_type": "MEMBER",
        "entity_id": "MBR-042",
        "details": "Default warning triggered for Member #042",
    },
    {
        "action_code": "LOAN_REQUEST",
        "actor_name": "Sunita M.",
        "amount_inr": 50000,
        "timestamp": _ts(hours=4),
        "entity_type": "LOAN_APP",
        "entity_id": "LOAN-0055",
        "details": "New loan application submitted",
    },
    {
        "action_code": "WAL_CHECKPOINT",
        "actor_name": "System",
        "amount_inr": 0,
        "timestamp": _ts(hours=5),
        "entity_type": "WAL",
        "entity_id": "WAL-CHAIN",
        "details": "WAL checkpoint completed. Integrity OK.",
    },
    {
        "action_code": "KYC_APPROVE",
        "actor_name": "Employee",
        "amount_inr": 0,
        "timestamp": _ts(hours=6),
        "entity_type": "KYC",
        "entity_id": "KYC-0079",
        "details": "KYC approved for Priya Sharma",
    },
    {
        "action_code": "LOAN_FAST_TRACK",
        "actor_name": "Employee",
        "amount_inr": 150000,
        "timestamp": _ts(hours=7),
        "entity_type": "LOAN_APP",
        "entity_id": "LOAN-0053",
        "details": "Loan fast-tracked to Verified",
    },
    {
        "action_code": "RECOVERY_ESCALATE",
        "actor_name": "System",
        "amount_inr": 42000,
        "timestamp": _ts(hours=8),
        "entity_type": "RECOVERY_CASE",
        "entity_id": "REC-014",
        "details": "Recovery case escalated to Critical stage",
    },
]

# ─────────────────────────────────────────────────────────────────
# recovery_cases
# ─────────────────────────────────────────────────────────────────
RECOVERY_CASES = [
    {
        "member_name": "Arjun Vardhan",
        "overdue_amount_inr": 12500,
        "risk_level": "Low",
        "recovery_stage": "Overdue_1_5",
        "days_late": 3,
        "assigned_to": "Employee",
    },
    {
        "member_name": "Suresh G.",
        "overdue_amount_inr": 4200,
        "risk_level": "Low",
        "recovery_stage": "Overdue_1_5",
        "days_late": 5,
        "assigned_to": "Employee",
    },
    {
        "member_name": "Meera Nair",
        "overdue_amount_inr": 8900,
        "risk_level": "Low",
        "recovery_stage": "Overdue_1_5",
        "days_late": 2,
        "assigned_to": "Employee",
    },
    {
        "member_name": "Vikram M.",
        "overdue_amount_inr": 25000,
        "risk_level": "Medium",
        "recovery_stage": "Warning_5_15",
        "days_late": 12,
        "assigned_to": "Employee",
    },
    {
        "member_name": "Ananya I.",
        "overdue_amount_inr": 15400,
        "risk_level": "Medium",
        "recovery_stage": "Warning_5_15",
        "days_late": 8,
        "assigned_to": "Employee",
    },
    {
        "member_name": "Rahul D.",
        "overdue_amount_inr": 42000,
        "risk_level": "High",
        "recovery_stage": "Critical_15_30",
        "days_late": 22,
        "assigned_to": "Employee",
    },
    {
        "member_name": "Sneha K.",
        "overdue_amount_inr": 31000,
        "risk_level": "High",
        "recovery_stage": "Critical_15_30",
        "days_late": 28,
        "assigned_to": "Employee",
    },
    {
        "member_name": "Kavita R.",
        "overdue_amount_inr": 105000,
        "risk_level": "High",
        "recovery_stage": "Legal_NPR",
        "days_late": 45,
        "assigned_to": "Employee",
    },
]

# ─────────────────────────────────────────────────────────────────
# kyc_queue
# ─────────────────────────────────────────────────────────────────
KYC_QUEUE = [
    {
        "member_name": "Arjun Vardhan",
        "phone": "+91 98450 12345",
        "pan_masked": "ABCDE1234F",
        "bank_masked": "XXXX XXXX 8921",
        "status": "Pending",
    },
    {
        "member_name": "Priya Sharma",
        "phone": "+91 88220 55432",
        "pan_masked": "FGHIJ5678K",
        "bank_masked": "XXXX XXXX 4412",
        "status": "Approved",
    },
    {
        "member_name": "Vikram Malhotra",
        "phone": "+91 77600 88901",
        "pan_masked": "LMNOP9012Q",
        "bank_masked": "XXXX XXXX 1109",
        "status": "Pending",
    },
    {
        "member_name": "Ananya Iyer",
        "phone": "+91 99001 22334",
        "pan_masked": "RSTUV3456W",
        "bank_masked": "XXXX XXXX 7765",
        "status": "Rejected",
        "rejection_reason": "Blurred PAN card image",
    },
    {
        "member_name": "Rahul Deshmukh",
        "phone": "+91 95550 67890",
        "pan_masked": "XYZAB7890C",
        "bank_masked": "XXXX XXXX 2234",
        "status": "Pending",
    },
    {
        "member_name": "Sneha Kapur",
        "phone": "+91 81234 56789",
        "pan_masked": "DEFGH1234L",
        "bank_masked": "XXXX XXXX 5567",
        "status": "Pending",
    },
    {
        "member_name": "Amit Saxena",
        "phone": "+91 70001 00021",
        "pan_masked": "IJKLM5678M",
        "bank_masked": "XXXX XXXX 9901",
        "status": "Approved",
    },
    {
        "member_name": "Kavita Reddy",
        "phone": "+91 99887 76655",
        "pan_masked": "NOPQR9012N",
        "bank_masked": "XXXX XXXX 3345",
        "status": "Pending",
    },
]

# ─────────────────────────────────────────────────────────────────
# kernel_state/live (single document)
# ─────────────────────────────────────────────────────────────────
KERNEL_STATE = {
    "ram_used_gb": 1.2,
    "ram_total_gb": 16.0,
    "wal_entry_count": 42901,
    "auction_lock_status": "ACTIVE",
    "auction_lock_id": "0x7F2A",
    "kernel_version": "TRANSACTFLOW_KERNEL_v1.0.4",
    "thread_count": 128,
    "updated_at": now,
}


# ─────────────────────────────────────────────────────────────────
# Seeder
# ─────────────────────────────────────────────────────────────────
def seed():
    print("🌱 Seeding Firestore with sample data…\n")

    # Loan applications
    col = db.collection("loan_applications")
    for item in LOANS:
        col.add(item)
    print(f"  ✅ loan_applications → {len(LOANS)} documents added")

    # Audit log
    col = db.collection("audit_log")
    for item in AUDIT_LOG:
        col.add(item)
    print(f"  ✅ audit_log         → {len(AUDIT_LOG)} documents added")

    # Recovery cases
    col = db.collection("recovery_cases")
    for item in RECOVERY_CASES:
        col.add(item)
    print(f"  ✅ recovery_cases    → {len(RECOVERY_CASES)} documents added")

    # KYC queue
    col = db.collection("kyc_queue")
    for item in KYC_QUEUE:
        col.add(item)
    print(f"  ✅ kyc_queue         → {len(KYC_QUEUE)} documents added")

    # Kernel state (set/merge so there's always exactly one "live" doc)
    db.collection("kernel_state").document("live").set(KERNEL_STATE, merge=True)
    print("  ✅ kernel_state/live → document set")

    print("\n🎉 Seed complete! Start the WS server with: python main.py")


if __name__ == "__main__":
    seed()
