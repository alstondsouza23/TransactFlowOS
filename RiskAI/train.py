"""
train.py — TransactFlow RiskAI
================================
Generates synthetic training data that mirrors real chit-fund member behaviour,
then trains two scikit-learn models:

  1. RiskScoreRegressor  → RandomForestRegressor  → predicts a 0-100 risk score
  2. RiskLevelClassifier → RandomForestClassifier → predicts Low / Medium / High

Saved models:
  models/risk_score_model.pkl
  models/risk_level_model.pkl

Run:
  python train.py
"""

import os, json
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, classification_report
from sklearn.preprocessing import LabelEncoder

# ─────────────────────────────────────────────────────────────────
# Feature schema (must match predict.py)
# ─────────────────────────────────────────────────────────────────
# Features per member:
#   0  missed_payments       int   0-10
#   1  has_active_loan       int   0 or 1
#   2  loan_amount_inr       float normalised (/ 200000)
#   3  kyc_approved          int   0 or 1
#   4  months_in_group       int   1-24
#   5  payment_streak        int   consecutive on-time payments
#   6  loan_to_contribution  float loan_amount / monthly_contribution (0-40)

# ─────────────────────────────────────────────────────────────────
# Synthetic data generator
# ─────────────────────────────────────────────────────────────────
SEED = 42
rng  = np.random.default_rng(SEED)

def _make_sample(missed, loan, loan_amt, kyc, months, streak):
    loan_norm  = loan_amt / 200_000
    ltc        = loan_amt / 5000        # loan-to-monthly-contribution
    return [missed, loan, loan_norm, kyc, months, streak, ltc]

def _score_from_features(missed, loan, loan_amt, kyc, months, streak):
    """Deterministic formula used to label synthetic data."""
    s  = 0
    s += missed * 18          # each missed payment +18 risk
    s += loan   * 10          # having a loan +10
    s += (loan_amt / 200_000) * 30   # big loan = more risk
    s -= kyc    * 5           # verified = slightly safer
    s -= min(months, 18) * 0.5       # longer tenure = lower risk
    s -= streak * 2           # payment streak = lower risk
    return float(np.clip(s + rng.normal(0, 3), 0, 100))

def _level(score):
    if score >= 60: return "High"
    if score >= 35: return "Medium"
    return "Low"

def generate_data(n=2000):
    X, y_score, y_level = [], [], []
    for _ in range(n):
        missed   = int(rng.integers(0, 6))
        loan     = int(rng.integers(0, 2))
        loan_amt = float(rng.integers(0, 16) * 10_000) if loan else 0.0
        kyc      = int(rng.integers(0, 2))
        months   = int(rng.integers(1, 25))
        streak   = int(rng.integers(0, months + 1))

        score = _score_from_features(missed, loan, loan_amt, kyc, months, streak)
        level = _level(score)

        X.append(_make_sample(missed, loan, loan_amt, kyc, months, streak))
        y_score.append(score)
        y_level.append(level)

    return np.array(X), np.array(y_score), np.array(y_level)

# ─────────────────────────────────────────────────────────────────
# Train
# ─────────────────────────────────────────────────────────────────
def main():
    print("=== TransactFlow RiskAI — Training ===\n")

    X, y_score, y_level = generate_data(2000)
    print(f"Generated {len(X)} synthetic training samples")
    print(f"Risk distribution: {dict(zip(*np.unique(y_level, return_counts=True)))}\n")

    X_tr, X_te, ys_tr, ys_te, yl_tr, yl_te = train_test_split(
        X, y_score, y_level, test_size=0.2, random_state=SEED
    )

    # ── 1. Risk Score Regressor ────────────────────────────────
    score_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        random_state=SEED,
        n_jobs=-1,
    )
    score_model.fit(X_tr, ys_tr)
    preds = score_model.predict(X_te)
    mae   = mean_absolute_error(ys_te, preds)
    print(f"[RiskScoreRegressor]  MAE = {mae:.2f} points")

    # ── 2. Risk Level Classifier ───────────────────────────────
    le = LabelEncoder()
    yl_tr_enc = le.fit_transform(yl_tr)
    yl_te_enc = le.transform(yl_te)

    level_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        random_state=SEED,
        n_jobs=-1,
    )
    level_model.fit(X_tr, yl_tr_enc)
    preds_l = level_model.predict(X_te)
    print(f"\n[RiskLevelClassifier] Classification Report:")
    print(classification_report(yl_te_enc, preds_l,
                                target_names=le.classes_, zero_division=0))

    # ── Save ───────────────────────────────────────────────────
    os.makedirs("models", exist_ok=True)
    joblib.dump(score_model,  "models/risk_score_model.pkl")
    joblib.dump(level_model,  "models/risk_level_model.pkl")
    joblib.dump(le,           "models/label_encoder.pkl")
    print("Models saved to models/\n")

    # Save feature names for reference
    meta = {
        "features": [
            "missed_payments",
            "has_active_loan",
            "loan_amount_inr_norm",
            "kyc_approved",
            "months_in_group",
            "payment_streak",
            "loan_to_contribution",
        ],
        "classes": list(le.classes_),
        "score_mae": round(mae, 2),
    }
    with open("models/model_meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    print("model_meta.json saved.")
    print("\n[OK] Training complete. Run `python predict.py` to generate risk_analysis_output.json")

if __name__ == "__main__":
    main()
