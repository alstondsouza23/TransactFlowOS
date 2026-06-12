"""
predict.py — TransactFlow RiskAI
==================================
Loads trained models, fetches live data from Firestore, runs inference,
and writes risk_analysis_output.json in the exact same schema as
Client/data/risk-analysis-data.json

Run:
  python predict.py
  python predict.py --group GRP-002   # override group
  python predict.py --dry-run         # use synthetic members (no Firestore)
"""

import os, sys, json, argparse
from datetime import datetime, timezone, date
from collections import defaultdict

import numpy as np
import joblib
from dotenv import load_dotenv

# ─────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────
load_dotenv()

CRED_PATH   = os.getenv("FIREBASE_CREDENTIALS", "../Backend/serviceAccountKey.json")
GROUP_ID    = os.getenv("GROUP_ID",    "GRP-001")
GROUP_NAME  = os.getenv("GROUP_NAME",  "Sunrise Chit Fund")
MONTHLY_CNT = int(os.getenv("MONTHLY_CONTRIBUTION", "5000"))
CHIT_VALUE  = int(os.getenv("CHIT_VALUE",  "100000"))
START_DATE  = os.getenv("GROUP_START_DATE", "2024-01-01")
TOTAL_CYCS  = int(os.getenv("TOTAL_CYCLES", "20"))

# ─────────────────────────────────────────────────────────────────
# Load models
# ─────────────────────────────────────────────────────────────────
def load_models():
    required = [
        "models/risk_score_model.pkl",
        "models/risk_level_model.pkl",
        "models/label_encoder.pkl",
    ]
    for p in required:
        if not os.path.exists(p):
            sys.exit(f"❌  Model not found: {p}\n   Run `python train.py` first.")

    score_model  = joblib.load("models/risk_score_model.pkl")
    level_model  = joblib.load("models/risk_level_model.pkl")
    le           = joblib.load("models/label_encoder.pkl")
    return score_model, level_model, le

# ─────────────────────────────────────────────────────────────────
# Feature builder (must match train.py)
# ─────────────────────────────────────────────────────────────────
def build_features(member: dict) -> list:
    missed   = int(member.get("missed_payments", 0))
    loan     = 1 if member.get("has_active_loan") else 0
    loan_amt = float(member.get("loan_amount_inr", 0))
    kyc      = 1 if member.get("kyc_status") in ("Approved", "approved") else 0
    months   = int(member.get("months_in_group", 1))
    streak   = int(member.get("payment_streak", 0))
    ltc      = loan_amt / MONTHLY_CNT if MONTHLY_CNT else 0
    return [missed, loan, loan_amt / 200_000, kyc, months, streak, ltc]

# ─────────────────────────────────────────────────────────────────
# Firestore fetch
# ─────────────────────────────────────────────────────────────────
def fetch_firestore_members(group_id: str) -> list[dict]:
    """Returns list of member dicts with all fields needed for features."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            cred = credentials.Certificate(CRED_PATH)
            firebase_admin.initialize_app(cred)

        db = firestore.client()

        # ── Users in this group ───────────────────────────────
        users_snap = db.collection("users") \
                       .where("group_id", "==", group_id) \
                       .stream()
        users = {doc.id: doc.to_dict() for doc in users_snap}

        if not users:
            # Try groupId (camelCase)
            users_snap = db.collection("users") \
                           .where("groupId", "==", group_id) \
                           .stream()
            users = {doc.id: doc.to_dict() for doc in users_snap}

        # ── Loan applications for these users ──────────────────
        loans_snap = db.collection("loan_applications").stream()
        active_loans: dict[str, dict] = {}
        for doc in loans_snap:
            d   = doc.to_dict()
            uid = d.get("applicantUid") or d.get("applicant_uid", "")
            if uid in users and d.get("status") == "Approved":
                active_loans[uid] = d

        # ── Collection history (contribution_payments if exists) ─
        history_snap = db.collection("contribution_payments").stream()
        history_by_uid: dict[str, list] = defaultdict(list)
        for doc in history_snap:
            d   = doc.to_dict()
            uid = d.get("userId") or d.get("user_uid", "")
            if uid in users:
                history_by_uid[uid].append(d)

        # ── Build member records ───────────────────────────────
        start = date.fromisoformat(START_DATE)
        today = date.today()
        months_elapsed = max(1, (today.year - start.year) * 12 + today.month - start.month)

        members = []
        for i, (uid, u) in enumerate(users.items(), start=1):
            loan_doc  = active_loans.get(uid, {})
            hist      = history_by_uid.get(uid, [])

            # Count missed payments from history, fallback to user field
            missed = sum(1 for h in hist if h.get("status") == "missed")
            missed = missed or int(u.get("missedPayments", 0))

            # Payment streak: consecutive on-time
            sorted_h = sorted(hist, key=lambda x: x.get("date", ""), reverse=True)
            streak = 0
            for h in sorted_h:
                if h.get("status") == "paid":
                    streak += 1
                else:
                    break

            loan_amt  = float(loan_doc.get("requestedAmountINR", 0) or
                              loan_doc.get("requested_amount_inr", 0))

            members.append({
                "uid":             uid,
                "name":            u.get("displayName") or u.get("name", f"Member {i}"),
                "kyc_status":      u.get("kycStatus") or u.get("kyc_status", "Pending"),
                "has_active_loan": bool(loan_doc),
                "loan_amount_inr": loan_amt,
                "missed_payments": missed,
                "months_in_group": months_elapsed,
                "payment_streak":  streak,
            })

        print(f"  ✓ Fetched {len(members)} members from Firestore (group: {group_id})")
        return members

    except Exception as e:
        print(f"  ⚠  Firestore fetch failed: {e}")
        print("  → Falling back to synthetic demo members")
        return _synthetic_members()

# ─────────────────────────────────────────────────────────────────
# Synthetic fallback (used for --dry-run or when Firestore is down)
# ─────────────────────────────────────────────────────────────────
DEMO_NAMES = [
    "Ravi Kumar", "Suresh Nair", "Kavitha Reddy", "Arun Sharma", "Priya Menon",
    "Deepak Pillai", "Meena Iyer", "Sanjay Patel", "Lakshmi Devi", "Venkat Rao",
    "Geetha Krishnan", "Harish Babu", "Usha Kumari", "Ramesh Babu", "Nalini Rao",
    "Kiran Das", "Sunita Joshi", "Manoj Tiwari", "Rekha Singh", "Anand Verma",
]

def _synthetic_members() -> list[dict]:
    rng = np.random.default_rng(7)
    members = []
    for i, name in enumerate(DEMO_NAMES):
        missed = int(rng.integers(0, 5))
        loan   = bool(rng.integers(0, 2))
        members.append({
            "uid":             f"m{i+1:02d}",
            "name":            name,
            "kyc_status":      "Approved",
            "has_active_loan": loan,
            "loan_amount_inr": float(rng.integers(1, 16) * 10_000) if loan else 0.0,
            "missed_payments": missed,
            "months_in_group": int(rng.integers(4, 20)),
            "payment_streak":  int(rng.integers(0, 8)),
        })
    return members

# ─────────────────────────────────────────────────────────────────
# Inference
# ─────────────────────────────────────────────────────────────────
def run_inference(members, score_model, level_model, le):
    X = np.array([build_features(m) for m in members])

    raw_scores  = score_model.predict(X)            # float 0-100
    level_codes = level_model.predict(X)            # encoded int
    level_labels = le.inverse_transform(level_codes) # Low/Medium/High

    results = []
    for m, score, level in zip(members, raw_scores, level_labels):
        score_int = int(np.clip(round(score), 0, 100))
        # Trend: heuristic — compare to naive baseline
        base = m["missed_payments"] * 20
        if score_int < base - 5:
            trend = "improving"
        elif score_int > base + 5:
            trend = "worsening"
        else:
            trend = "stable"

        results.append({
            **m,
            "predicted_score": score_int,
            "predicted_level": level,
            "trend":           trend,
        })

    # Sort: highest risk first (descending score)
    results.sort(key=lambda r: r["predicted_score"], reverse=True)
    return results

# ─────────────────────────────────────────────────────────────────
# JSON builder — mirrors Client/data/risk-analysis-data.json schema
# ─────────────────────────────────────────────────────────────────
def build_output_json(results: list[dict]) -> dict:
    now_iso = datetime.now(timezone.utc).isoformat(timespec="seconds")

    # ── Member scores ──────────────────────────────────────────
    member_scores = []
    for r in results:
        member_scores.append({
            "uid":             r["uid"],
            "name":            r["name"],
            "score":           r["predicted_score"],
            "riskLevel":       r["predicted_level"],
            "trend":           r["trend"],
            "missedPayments":  r["missed_payments"],
            "activeLoan":      r["has_active_loan"],
            "loanAmountINR":   int(r["loan_amount_inr"]),
        })

    # ── KPIs ──────────────────────────────────────────────────
    n          = len(results)
    n_high     = sum(1 for r in results if r["predicted_level"] == "High")
    n_medium   = sum(1 for r in results if r["predicted_level"] == "Medium")
    n_low      = sum(1 for r in results if r["predicted_level"] == "Low")
    avg_score  = round(np.mean([r["predicted_score"] for r in results]), 1) if results else 0
    total_loan = sum(r["loan_amount_inr"] for r in results)
    active_loans_count = sum(1 for r in results if r["has_active_loan"])
    missed_total = sum(r["missed_payments"] for r in results)

    total_expected  = n * MONTHLY_CNT
    missed_payments_amount = missed_total * MONTHLY_CNT
    total_collected = max(0, total_expected - missed_payments_amount)
    collection_rate = round((total_collected / total_expected * 100), 1) if total_expected else 0
    default_rate    = round(100 - collection_rate, 1)

    pool_total     = CHIT_VALUE
    pool_allocated = int(min(total_loan + total_collected * 0.3, pool_total * 0.85))
    safe_reserve   = int(pool_total * 0.15)
    disbursed      = int(pool_total * 0.4)
    held_in_loans  = int(total_loan)
    pool_buffer    = max(0, pool_total - pool_allocated - safe_reserve)
    pool_balance   = max(0, pool_total - disbursed - held_in_loans)
    net_inflow     = int(total_collected / max(1, TOTAL_CYCS))
    obligations    = int(total_expected / max(1, TOTAL_CYCS))
    net_burn       = max(0, obligations - net_inflow)
    min_viable     = int(pool_total * 0.1)
    critical_thr   = int(pool_total * 0.05)
    months_to_min  = int((pool_balance - min_viable) / net_burn) if net_burn > 0 else 99
    months_to_crit = int((pool_balance - critical_thr) / net_burn) if net_burn > 0 else 99
    safety_margin  = round((pool_balance / pool_total) * 100) if pool_total else 0

    # ── Health score (0-100, lower avg risk = higher health) ──
    health_score = int(np.clip(100 - avg_score, 0, 100))
    if health_score >= 75:
        health_status = "Healthy"
        commentary = (f"{GROUP_NAME} is performing strongly. "
                      f"Collection rate at {collection_rate}% with only {n_high} high-risk member(s).")
    elif health_score >= 50:
        health_status = "Moderate"
        commentary = (f"{GROUP_NAME} is stable but {n_high} high-risk member(s) need monitoring. "
                      f"Collection rate: {collection_rate}%.")
    else:
        health_status = "At Risk"
        commentary = (f"{GROUP_NAME} requires immediate attention. "
                      f"{n_high} high-risk member(s), collection rate {collection_rate}%.")

    # ── Collection trend (last 6 months, estimated) ──────────
    months_abbr = ["Jan","Feb","Mar","Apr","May","Jun",
                   "Jul","Aug","Sep","Oct","Nov","Dec"]
    today = datetime.now()
    trend_months = []
    for i in range(5, -1, -1):
        m_idx = (today.month - 1 - i) % 12
        noise = int(np.random.default_rng(i).integers(-8000, 8001))
        trend_months.append({
            "month":     months_abbr[m_idx],
            "expected":  total_expected,
            "collected": int(np.clip(total_collected + noise, 0, total_expected)),
        })

    # ── Bankruptcy runway (12-month projection) ───────────────
    runway = [{"month": months_abbr[(today.month - 1) % 12],
               "balance": pool_balance, "projection": None}]
    bal = pool_balance
    for i in range(1, 12):
        bal = max(0, bal - net_burn)
        runway.append({
            "month":      months_abbr[(today.month - 1 + i) % 12],
            "balance":    None,
            "projection": bal,
        })

    # ── Cycle month (months since group start) ────────────────
    start_d = date.fromisoformat(START_DATE)
    today_d = date.today()
    cycle_month = max(1, (today_d.year - start_d.year) * 12 + today_d.month - start_d.month)

    return {
        "meta": {
            "groupId":             GROUP_ID,
            "groupName":           GROUP_NAME,
            "analysedAt":          now_iso,
            "totalMembers":        n,
            "monthlyContribution": MONTHLY_CNT,
            "chitValue":           CHIT_VALUE,
            "groupStartDate":      START_DATE,
            "cycleMonth":          cycle_month,
            "totalCycles":         TOTAL_CYCS,
        },
        "healthScore": {
            "score":       health_score,
            "status":      health_status,
            "commentary":  commentary,
        },
        "kpis": {
            "collectionRatePct":     collection_rate,
            "collectionRateTrend":   round(collection_rate - 85, 1),   # delta vs baseline
            "defaultRatePct":        default_rate,
            "defaultRateTrend":      round(85 - collection_rate, 1),
            "poolUtilisationPct":    round(pool_allocated / pool_total * 100, 1),
            "poolUtilisationTrend":  1.0,
            "avgMemberRiskScore":    avg_score,
            "avgMemberRiskTrend":    round(-avg_score * 0.05, 1),
            "totalCollectedINR":     int(total_collected),
            "totalExpectedINR":      int(total_expected),
            "activeLoans":           active_loans_count,
            "totalLoanAmountINR":    int(total_loan),
        },
        "collectionTrend": trend_months,
        "riskDistribution": {
            "low":    n_low,
            "medium": n_medium,
            "high":   n_high,
        },
        "poolHealth": {
            "total":              pool_total,
            "allocated":          pool_allocated,
            "safeReserve":        safe_reserve,
            "buffer":             pool_buffer,
            "safeState":          pool_balance > min_viable,
            "disbursedToWinners": disbursed,
            "heldInLoans":        held_in_loans,
        },
        "bankruptcyDistance": {
            "currentPoolBalanceINR":      pool_balance,
            "minimumViableReserveINR":    min_viable,
            "criticalThresholdINR":       critical_thr,
            "monthlyNetInflowINR":        net_inflow,
            "monthlyObligationsINR":      obligations,
            "netMonthlyBurnINR":          net_burn,
            "projectedMonthsToMinViable": max(0, months_to_min),
            "projectedMonthsToCritical":  max(0, months_to_crit),
            "safetyMarginPct":            safety_margin,
            "runway":                     runway,
        },
        "memberScores": member_scores,
    }

# ─────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="TransactFlow RiskAI — predict")
    parser.add_argument("--group",    default=None,  help="Override GROUP_ID")
    parser.add_argument("--dry-run",  action="store_true", help="Use synthetic data (no Firestore)")
    parser.add_argument("--out",      default="risk_analysis_output.json", help="Output file path")
    args = parser.parse_args()

    if args.group:
        global GROUP_ID
        GROUP_ID = args.group

    print("=== TransactFlow RiskAI — Prediction ===\n")

    # 1. Load models
    score_model, level_model, le = load_models()
    print("✓ Models loaded\n")

    # 2. Fetch members
    if args.dry_run:
        print("DRY RUN — using synthetic members")
        members = _synthetic_members()
    else:
        print(f"Fetching members from Firestore (group: {GROUP_ID})…")
        members = fetch_firestore_members(GROUP_ID)

    if not members:
        sys.exit("❌  No members found. Exiting.")

    print(f"\nRunning inference on {len(members)} member(s)…")

    # 3. Run inference
    results = run_inference(members, score_model, level_model, le)

    # 4. Build output JSON
    output = build_output_json(results)

    # 5. Write file
    out_path = args.out
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✅  Output written to: {out_path}")
    print(f"   Health score : {output['healthScore']['score']} ({output['healthScore']['status']})")
    print(f"   Members      : {len(output['memberScores'])} analysed")
    hl = output["riskDistribution"]
    print(f"   Risk dist    : Low={hl['low']}  Medium={hl['medium']}  High={hl['high']}")
    print(f"\n   Top 3 high-risk members:")
    for m in output["memberScores"][:3]:
        print(f"     • {m['name']:20s}  score={m['score']:3d}  level={m['riskLevel']}")

if __name__ == "__main__":
    main()
