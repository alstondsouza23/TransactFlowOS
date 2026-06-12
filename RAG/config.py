"""
RAG/config.py — Central configuration loader.
"""
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ── Pinecone ──────────────────────────────────────────────────────
PINECONE_API_KEY    = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "transactflow-rag")

# ── Google Gemini ─────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Models
# gemini-embedding-001 = 768 dims, available on free tier with AQ. keys
EMBEDDING_MODEL  = "models/gemini-embedding-001"
EMBEDDING_DIM    = 768
GENERATION_MODEL = "gemini-2.0-flash"

# ── Firebase Admin ────────────────────────────────────────────────
FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON", "")
# Local fallback: serviceAccountKey.json sits in ../Backend/
GOOGLE_APPLICATION_CREDENTIALS = os.getenv(
    "GOOGLE_APPLICATION_CREDENTIALS",
    os.path.join(os.path.dirname(__file__), "..", "Backend", "serviceAccountKey.json"),
)

# UIDs with full staff access (same as main backend firestore.rules)
STAFF_UIDS = {
    "t5NfFm9NfOhgWpDHQg7C5LlYe4q1",   # admin@ac.in
    "LSGBwob5COY39I7wuQZSJUHlWaY2",   # employee@ac.in
}

# ── WebSocket server ──────────────────────────────────────────────
WS_HOST              = os.getenv("WS_HOST", "0.0.0.0")
WS_PORT              = int(os.getenv("PORT", os.getenv("WS_PORT", "8081")))
AUTH_TIMEOUT_SECONDS = 15

# ── Firestore collections to sync ─────────────────────────────────
COLLECTIONS_TO_SYNC = [
    "users",
    "loan_applications",
    "kyc_queue",
    "recovery_cases",
    "audit_log",
    "auctions",
    "bids",
]
