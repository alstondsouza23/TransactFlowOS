# TransactFlow Risk AI — Implementation Plan

## Folder
`RiskAI/` (inside TransactFlowOS workspace)

## What the model does
1. **Fetches data** from Firestore (users, loan_applications, chit group)
2. **Trains** a scikit-learn RandomForestClassifier + RandomForestRegressor
3. **Outputs** `risk_analysis_output.json` in the exact schema of `risk-analysis-data.json`

## Features used for training (per member)
| Feature | Source |
|---|---|
| missed_payments | users / loan_applications |
| has_active_loan | loan_applications |
| loan_amount_inr | loan_applications |
| kyc_status (encoded) | users |
| payment_history_score | derived |
| months_in_group | derived |

## Model architecture
- `RiskScoreRegressor` → RandomForestRegressor → predicts 0-100 risk score  
- `RiskLevelClassifier` → RandomForestClassifier → predicts Low/Medium/High  
- `TrendClassifier` → rule-based (score delta over time)

## Files
- `train.py` — generate synthetic training data, fit + save models
- `predict.py` — load models, fetch Firestore data, produce output JSON
- `requirements.txt` — scikit-learn, firebase-admin, python-dotenv
- `.env` — Firebase service account path + group config
