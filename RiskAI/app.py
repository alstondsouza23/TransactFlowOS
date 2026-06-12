"""
app.py — TransactFlow RiskAI  Web Service
==========================================
FastAPI app that exposes the risk analysis engine as HTTP endpoints.
Designed for deployment on Render (or any PaaS).

Endpoints:
  GET  /              Health check
  GET  /analyse/dry-run              Synthetic demo (no Firestore needed)
  POST /analyse                      Full Firestore analysis
  GET  /analyse/{group_id}/dry-run   Synthetic demo for a specific group

On startup the model is trained automatically (no pre-built .pkl needed).

Environment variables (set in Render dashboard):
  FIREBASE_CREDENTIALS_JSON   Full JSON content of serviceAccountKey.json
  GROUP_ID                    e.g. GRP-001
  GROUP_NAME                  e.g. Sunrise Chit Fund
  MONTHLY_CONTRIBUTION        e.g. 5000
  CHIT_VALUE                  e.g. 100000
  GROUP_START_DATE            e.g. 2024-01-01
  TOTAL_CYCLES                e.g. 20
"""

import os, sys, json, tempfile, logging
from contextlib import asynccontextmanager

# Force UTF-8 output
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("riskai")

# ─────────────────────────────────────────────────────────────────
# Config from environment
# ─────────────────────────────────────────────────────────────────
GROUP_ID    = os.getenv("GROUP_ID",    "GRP-001")
GROUP_NAME  = os.getenv("GROUP_NAME",  "Sunrise Chit Fund")
MONTHLY_CNT = int(os.getenv("MONTHLY_CONTRIBUTION", "5000"))
CHIT_VALUE  = int(os.getenv("CHIT_VALUE",  "100000"))
START_DATE  = os.getenv("GROUP_START_DATE", "2024-01-01")
TOTAL_CYCS  = int(os.getenv("TOTAL_CYCLES", "20"))

# Firebase credentials: either a JSON string or a file path
FIREBASE_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON", "")  # JSON string
FIREBASE_FILE = os.getenv("FIREBASE_CREDENTIALS", "../Backend/serviceAccountKey.json")

# ─────────────────────────────────────────────────────────────────
# Global model state (loaded once at startup)
# ─────────────────────────────────────────────────────────────────
_models: dict = {}

def _train_and_load():
    """Train models in memory and store in _models dict."""
    import train   # imports train.py from same directory
    import numpy as np
    from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder

    log.info("Training risk models...")
    X, y_score, y_level = train.generate_data(2000)

    X_tr, _, ys_tr, _, yl_tr, _ = train_test_split(
        X, y_score, y_level, test_size=0.2, random_state=42
    )

    score_model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
    score_model.fit(X_tr, ys_tr)

    le = LabelEncoder()
    yl_tr_enc = le.fit_transform(yl_tr)
    level_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
    level_model.fit(X_tr, yl_tr_enc)

    _models["score"] = score_model
    _models["level"] = level_model
    _models["le"]    = le
    log.info("Models ready.")

# ─────────────────────────────────────────────────────────────────
# Firebase credentials helper
# ─────────────────────────────────────────────────────────────────
_cred_tmp_path: str | None = None

def _get_firebase_cred_path() -> str | None:
    """
    Returns a file path to a service account JSON.
    If FIREBASE_CREDENTIALS_JSON env var is set (Render style),
    writes it to a temp file and returns that path.
    """
    global _cred_tmp_path

    if FIREBASE_JSON:
        if _cred_tmp_path and os.path.exists(_cred_tmp_path):
            return _cred_tmp_path
        try:
            parsed = json.loads(FIREBASE_JSON)
            tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json",
                                              delete=False, encoding="utf-8")
            json.dump(parsed, tmp)
            tmp.close()
            _cred_tmp_path = tmp.name
            log.info("Firebase credentials loaded from env var.")
            return _cred_tmp_path
        except Exception as e:
            log.error(f"FIREBASE_CREDENTIALS_JSON parse error: {e}")
            return None

    if os.path.exists(FIREBASE_FILE):
        log.info(f"Firebase credentials loaded from file: {FIREBASE_FILE}")
        return FIREBASE_FILE

    return None

# ─────────────────────────────────────────────────────────────────
# Lifespan (runs training on startup)
# ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    _train_and_load()
    yield
    # Cleanup temp cred file on shutdown
    if _cred_tmp_path and os.path.exists(_cred_tmp_path):
        os.unlink(_cred_tmp_path)

# ─────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="TransactFlow RiskAI",
    description="Scikit-learn risk analysis for chit-fund groups.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────
# Request / Response models
# ─────────────────────────────────────────────────────────────────
class AnalyseRequest(BaseModel):
    group_id:   str = GROUP_ID
    group_name: str = GROUP_NAME

# ─────────────────────────────────────────────────────────────────
# Helpers — thin wrappers around predict.py logic
# ─────────────────────────────────────────────────────────────────
def _run(members: list, group_id: str, group_name: str) -> dict:
    """Run inference and build the output JSON."""
    import predict as p

    # Patch globals for this request
    p.GROUP_ID    = group_id
    p.GROUP_NAME  = group_name
    p.MONTHLY_CNT = MONTHLY_CNT
    p.CHIT_VALUE  = CHIT_VALUE
    p.START_DATE  = START_DATE
    p.TOTAL_CYCS  = TOTAL_CYCS

    results = p.run_inference(members, _models["score"], _models["level"], _models["le"])
    return p.build_output_json(results)

# ─────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": "TransactFlow RiskAI",
        "models_loaded": bool(_models),
    }

@app.get("/analyse/dry-run", tags=["Analysis"])
def analyse_dry_run(
    group_id:   str = Query(default=GROUP_ID),
    group_name: str = Query(default=GROUP_NAME),
):
    """
    Run risk analysis with 20 synthetic demo members.
    No Firestore connection required.
    Output exactly matches Client/data/risk-analysis-data.json schema.
    """
    if not _models:
        raise HTTPException(503, "Models not loaded yet — retry in a few seconds.")

    import predict as p
    members = p._synthetic_members()
    output  = _run(members, group_id, group_name)
    return output

@app.post("/analyse", tags=["Analysis"])
def analyse(req: AnalyseRequest):
    """
    Fetch live members from Firestore and run risk analysis.
    Requires FIREBASE_CREDENTIALS_JSON env var to be set.
    """
    if not _models:
        raise HTTPException(503, "Models not loaded yet — retry in a few seconds.")

    cred_path = _get_firebase_cred_path()
    if not cred_path:
        raise HTTPException(400,
            "No Firebase credentials found. "
            "Set FIREBASE_CREDENTIALS_JSON env var in Render dashboard.")

    import predict as p
    p.CRED_PATH  = cred_path
    members = p.fetch_firestore_members(req.group_id)

    if not members:
        raise HTTPException(404, f"No members found for group: {req.group_id}")

    output = _run(members, req.group_id, req.group_name)
    return output

@app.get("/analyse/{group_id}/dry-run", tags=["Analysis"])
def analyse_group_dry_run(group_id: str):
    """Dry-run for a specific group ID."""
    return analyse_dry_run(group_id=group_id, group_name=GROUP_NAME)
