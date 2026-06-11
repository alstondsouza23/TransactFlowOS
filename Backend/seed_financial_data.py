"""
Backend/seed_financial_data.py
────────────────────────────────────────────────────────────────────────────
Writes randomised financial data fields (matching the schema in
Client/data/user-data-fields.json) into every document in the
Firestore `users` collection, keyed by Firebase Auth UID.

Uses the Firebase Admin SDK + serviceAccountKey.json — no login needed.

Usage (from the Backend folder):
    python seed_financial_data.py
────────────────────────────────────────────────────────────────────────────
"""

import os, sys, random, datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

# ── Init ───────────────────────────────────────────────────────────────────
load_dotenv()
_cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
if not os.path.exists(_cred_path):
    print(f"[ERROR] Service account key not found at: {_cred_path}")
    sys.exit(1)

if not firebase_admin._apps:
    cred = credentials.Certificate(_cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ── Constants ──────────────────────────────────────────────────────────────
MONTHLY_AMOUNT = 5000       # ₹5,000 fixed per cycle
TOTAL_CYCLES   = 40         # group total duration in months

MONTH_NAMES  = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"]
SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"]
LOAN_PURPOSES = ["Medical","Home Repair","Business Expansion","Education","Personal","Emergency"]

# ── Helpers ────────────────────────────────────────────────────────────────

def fmt_inr(amount: int) -> str:
    """Format integer as Indian rupee string e.g. 55000 → '₹55,000'."""
    s = f"{amount:,}"
    # re-format for Indian number system (last 3 then groups of 2)
    parts = s.split(",")
    if len(parts) > 1:
        # Python's default comma is every 3 digits; rebuild Indian style
        n = str(amount)
        if len(n) <= 3:
            return f"₹{n}"
        last3 = n[-3:]
        rest  = n[:-3]
        groups = []
        while len(rest) > 2:
            groups.append(rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.append(rest)
        groups.reverse()
        return "₹" + ",".join(groups) + "," + last3
    return f"₹{s}"

def short_date(day: int, month0: int, year: int) -> str:
    return f"{SHORT_MONTHS[month0]} {day:02d}, {year}"

def month_label(year: int, month0: int) -> str:
    return f"{MONTH_NAMES[month0]} {year}"

# ── Random financial data generator ───────────────────────────────────────

def generate_user_data() -> dict:
    cycles_paid    = random.randint(6, 30)
    total_contrib  = cycles_paid * MONTHLY_AMOUNT
    remaining      = (TOTAL_CYCLES - cycles_paid) * MONTHLY_AMOUNT
    remaining_mos  = TOTAL_CYCLES - cycles_paid
    streak         = random.randint(2, cycles_paid)
    missed         = random.randint(0, 2)
    has_active_loan = random.random() < 0.35   # 35% chance

    active_loan_principal = 0
    active_loan_balance   = 0
    if has_active_loan:
        active_loan_principal = random.randint(2, 20) * 10000
        active_loan_balance   = random.randint(1, max(1, active_loan_principal // 10000 - 1)) * 10000

    # Next payment: 10th of next month
    now = datetime.datetime.now()
    if now.month == 12:
        next_pay = datetime.date(now.year + 1, 1, 10)
    else:
        next_pay = datetime.date(now.year, now.month + 1, 10)
    next_payment_date = next_pay.strftime("%d %B %Y")

    # ── Contribution history (up to 12 recent cycles) ─────────────────────
    history = []
    base_year  = 2024
    base_month = 9   # October 2024 (0-indexed)

    # Pick which cycle(s) are overdue
    overdue_indices = set(random.sample(range(1, 8), min(missed, 7))) if missed > 0 else set()

    for i in range(min(cycles_paid + missed, 12)):
        total_offset = base_month - i
        year  = base_year + total_offset // 12
        m0    = total_offset % 12
        if total_offset < 0:
            year  = base_year - ((-total_offset - 1) // 12 + 1)
            m0    = (12 - (-total_offset % 12)) % 12

        due_day  = 10
        is_overdue = i in overdue_indices
        paid_day   = random.randint(7, 12)
        paid_date  = "--" if is_overdue else short_date(paid_day, m0, year)
        ref        = "-" if is_overdue else f"TXN-{random.randint(800000, 900000)}"

        history.append({
            "month":        month_label(year, m0),
            "date_due":     short_date(due_day, m0, year),
            "date_paid":    paid_date,
            "amount":       fmt_inr(MONTHLY_AMOUNT),
            "status":       "Overdue" if is_overdue else "Paid",
            "reference_id": ref,
            "type":         "Monthly",
        })

    # ── Upcoming payments ──────────────────────────────────────────────────
    upcoming = []
    for i in range(3):
        # Nov, Dec, Jan from 2024
        m0   = (10 + i) % 12
        year = 2024 + (10 + i) // 12
        upcoming.append({
            "cycle_id": cycles_paid + i + 1,
            "date":     short_date(10, m0, year),
            "amount":   fmt_inr(MONTHLY_AMOUNT),
            "type":     "STANDARD DUE",
        })

    # ── Loan history ───────────────────────────────────────────────────────
    num_past_loans = random.randint(1, 2)
    full_loan_history = []
    for idx in range(num_past_loans):
        principal = random.randint(2, 15) * 10000
        emi       = round(principal / 12 * 1.1 / 100) * 100
        full_loan_history.append({
            "loan_id":     f"LN-{random.randint(1000, 9999)}",
            "principal":   fmt_inr(principal),
            "purpose":     random.choice(LOAN_PURPOSES),
            "applied_date": short_date(random.randint(1, 28), random.randint(0, 11), 2022 + idx),
            "status":      "Repaid",
            "monthly_emi": fmt_inr(emi),
        })
    if has_active_loan:
        principal = active_loan_principal
        emi       = round(principal / 12 * 1.1 / 100) * 100
        full_loan_history.append({
            "loan_id":     f"LN-{random.randint(1000, 9999)}",
            "principal":   fmt_inr(principal),
            "purpose":     random.choice(LOAN_PURPOSES),
            "applied_date": short_date(random.randint(1, 28), random.randint(0, 11), 2024),
            "status":      "Disbursed",
            "monthly_emi": fmt_inr(emi),
        })

    recent_loan_history = [
        {"disbursed_amount": l["principal"], "disbursed_date": l["applied_date"]}
        for l in full_loan_history[-2:]
    ]

    # ── Assemble ───────────────────────────────────────────────────────────
    savings_raw    = round(total_contrib * random.uniform(1.02, 1.08) / 1000) * 1000
    savings_display = fmt_inr(savings_raw)

    return {
        "profile": {
            "savings_impact":        savings_display,
            "current_streak_months": streak,
            "missed_payments_count": missed,
            "active_loan_status":    "Active" if has_active_loan else "None",
        },
        "financial_snapshot": {
            "total_contributed":       fmt_inr(total_contrib),
            "remaining_contribution":  fmt_inr(remaining),
            "remaining_months":        remaining_mos,
            "active_loan_balance":     fmt_inr(active_loan_balance) if has_active_loan else "₹0.00",
            "next_payment_due_date":   next_payment_date,
            "next_payment_due_amount": fmt_inr(MONTHLY_AMOUNT),
        },
        "loans_and_credit": {
            "new_loan_estimated_emi":    fmt_inr(random.randint(6, 12) * 1000),
            "new_loan_interest_rate":    f"{random.randint(100, 140) / 10:.1f}%",
            "active_loan_balance_alert": fmt_inr(active_loan_balance) if has_active_loan else "₹0.00",
            "recent_loan_history":       recent_loan_history,
            "full_loan_history":         full_loan_history,
        },
        "contributions": {
            "summary": {
                "total_contributed":     fmt_inr(total_contrib),
                "total_cycles":          cycles_paid,
                "missed_payments":       missed,
                "payment_streak_months": streak,
            },
            "upcoming_payments": upcoming,
            "recent_timeline":   history,
        },
    }

# ── Main ───────────────────────────────────────────────────────────────────

def main():
    print("[*] Firebase Admin SDK connected to project: transactflowos")
    print("[*] Fetching all documents from `users` collection...\n")

    users_ref = db.collection("users")
    docs      = list(users_ref.stream())

    if not docs:
        print("[-] No documents found in `users` collection. Exiting.")
        sys.exit(0)

    print(f"   Found {len(docs)} user document(s). Seeding financial data...\n")

    success = 0
    failed  = 0

    for doc in docs:
        uid   = doc.id
        data  = doc.to_dict() or {}
        name  = data.get("name",  uid)
        email = data.get("email", "(no email)")

        financial_data = generate_user_data()

        try:
            users_ref.document(uid).set(financial_data, merge=True)
            print(f"  [ok]  {name:<30}  ({uid[:8]}...)  -> seeded")
            success += 1
        except Exception as e:
            print(f"  [ERR] {name:<30}  -> FAILED: {e}")
            failed += 1

    print(f"\n{'-'*60}")
    print(f"  Done!  {success} seeded,  {failed} failed.")
    print(f"{'-'*60}\n")


if __name__ == "__main__":
    main()
