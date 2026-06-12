# TransactFlow — RiskAI

A standalone scikit-learn risk-analysis module that trains on synthetic chit-fund member data,
fetches live records from Firestore, and outputs a `risk_analysis_output.json` that matches the
schema of `Client/data/risk-analysis-data.json` exactly.

## Folder structure
```
RiskAI/
├── train.py                  # Train the ML models (run this first)
├── predict.py                # Run inference → risk_analysis_output.json
├── requirements.txt          # Python dependencies
├── .env.example              # Environment config template
├── .env                      # Your config (gitignored)
└── models/                   # Saved models (created after training)
    ├── risk_score_model.pkl
    ├── risk_level_model.pkl
    ├── label_encoder.pkl
    └── model_meta.json
```

## Quick start

```bash
# 1. Create a virtual environment
cd RiskAI
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and fill in your config
cp .env.example .env
# Edit .env — set FIREBASE_CREDENTIALS path and group config

# 4. Train the model (one-time)
python train.py

# 5. Run prediction — fetches Firestore data and writes output JSON
python predict.py

# 5a. Dry run (no Firestore needed — uses synthetic members)
python predict.py --dry-run

# 5b. Output to a specific path
python predict.py --out ../Client/data/risk-analysis-data.json
```

## Models

| Model | Algorithm | Task | Output |
|---|---|---|---|
| RiskScoreRegressor | RandomForestRegressor | 0-100 risk score | float |
| RiskLevelClassifier | RandomForestClassifier | Low / Medium / High | string |

## Features (per member)

| Feature | Description |
|---|---|
| missed_payments | Total missed contribution payments |
| has_active_loan | Whether member has an active loan (0/1) |
| loan_amount_inr_norm | Loan amount normalised by ₹2,00,000 |
| kyc_approved | KYC verification status (0/1) |
| months_in_group | Months since group start |
| payment_streak | Consecutive on-time payments |
| loan_to_contribution | Loan ÷ monthly contribution ratio |

## Output JSON schema

Strictly matches `Client/data/risk-analysis-data.json`:
- `meta` — group metadata
- `healthScore` — group-level health (0-100) + status + commentary
- `kpis` — collection rate, default rate, pool utilisation, etc.
- `collectionTrend` — last 6 months expected vs collected
- `riskDistribution` — low/medium/high counts
- `poolHealth` — pool allocation breakdown
- `bankruptcyDistance` — runway projections
- `memberScores` — per-member score, level, trend, loan info
