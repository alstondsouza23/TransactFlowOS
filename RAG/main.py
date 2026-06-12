"""
RAG/main.py — TransactFlowOS RAG Chat Service
==============================================
WebSocket server that provides a RAG-powered chatbot backed by
Firestore data synced into Pinecone.

WebSocket Protocol
------------------
1. Client → { "type": "auth",    "token": "<Firebase ID token>",
                                  "role":  "member" | "employee" }
2. Server → { "type": "ready",   "uid": "...", "is_staff": false }
3. Client → { "type": "message", "content": "What's my loan status?" }
4. Server → { "type": "chunk",   "content": "Your loan..." }   (repeated)
5. Server → { "type": "done" }
"""

import asyncio
import json
import logging
import os

import firebase_admin
import websockets
from dotenv import load_dotenv
from firebase_admin import auth as fb_auth, credentials, firestore as fa_firestore

# ── Bootstrap ─────────────────────────────────────────────────────
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("rag.main")

# ── Config imports (after load_dotenv) ────────────────────────────
from config import (
    WS_HOST, WS_PORT, AUTH_TIMEOUT_SECONDS,
    FIREBASE_CREDENTIALS_JSON, GOOGLE_APPLICATION_CREDENTIALS,
    STAFF_UIDS, COLLECTIONS_TO_SYNC,
)
from sync.realtime_sync import setup_sync_listeners
from chat.rag_pipeline import stream_rag_response


# ── Firebase Admin init ───────────────────────────────────────────
def _init_firebase():
    if firebase_admin._apps:
        return

    json_str = FIREBASE_CREDENTIALS_JSON
    if json_str:
        import json as _json
        cred = credentials.Certificate(_json.loads(json_str))
        log.info("Firebase ▶ env-var credentials")
    else:
        path = GOOGLE_APPLICATION_CREDENTIALS
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"No Firebase credentials found at {path}\n"
                "Set FIREBASE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS."
            )
        cred = credentials.Certificate(path)
        log.info(f"Firebase ▶ file: {path}")

    firebase_admin.initialize_app(cred)


_init_firebase()
db = fa_firestore.client()


# ── Initial bulk sync ─────────────────────────────────────────────
async def _bulk_sync():
    """
    On startup, read every document in every collection and upsert
    to Pinecone. Idempotent — safe to run on every restart.
    """
    from sync.doc_processor import process_document
    from sync.embedder import embed_text
    from sync.pinecone_store import upsert_vector

    log.info("━━━ Initial Firestore → Pinecone sync ━━━")
    loop  = asyncio.get_event_loop()
    total = 0

    for col in COLLECTIONS_TO_SYNC:
        try:
            docs = await loop.run_in_executor(
                None, lambda c=col: list(db.collection(c).stream())
            )
            synced = 0
            for doc in docs:
                data  = doc.to_dict() or {}
                chunk = process_document(col, doc.id, data)
                if chunk:
                    emb = await embed_text(chunk["text"])
                    upsert_vector(chunk["id"], emb, chunk["metadata"], chunk["text"])
                    synced += 1
                    total  += 1
                await asyncio.sleep(0)   # yield to event loop
            log.info(f"  ✅ {col}: {synced}/{len(docs)} docs synced")
        except Exception as e:
            log.error(f"  ✖ {col}: {e}")

    log.info(f"━━━ Sync complete — {total} vectors in Pinecone ━━━")


# ── WebSocket connection handler ──────────────────────────────────
async def _handler(ws) -> None:
    addr = getattr(ws, "remote_address", "?")
    log.info(f"🔌 Connection from {addr}")

    # ── Step 1: Auth ──────────────────────────────────────────────
    try:
        raw = await asyncio.wait_for(ws.recv(), timeout=AUTH_TIMEOUT_SECONDS)
        msg = json.loads(raw)
    except asyncio.TimeoutError:
        await ws.close(1008, "Auth timeout")
        return
    except json.JSONDecodeError:
        await ws.close(1008, "Invalid JSON")
        return

    if msg.get("type") != "auth":
        await ws.close(1008, "Expected auth message")
        return

    token    = msg.get("token", "")
    role     = msg.get("role", "member")

    try:
        decoded  = fb_auth.verify_id_token(token)
        uid      = decoded["uid"]
        is_staff = uid in STAFF_UIDS or role == "employee"
        log.info(f"  ✅ Auth uid={uid} staff={is_staff}")
    except Exception as e:
        log.warning(f"  ✖ Auth failed: {e}")
        await ws.send(json.dumps({"type": "auth_failed", "error": str(e)}))
        await ws.close(1008, "Auth failed")
        return

    # Resolve user's groupId
    group_id = None
    try:
        loop  = asyncio.get_event_loop()
        u_doc = await loop.run_in_executor(
            None, lambda: db.collection("users").document(uid).get()
        )
        if u_doc.exists:
            group_id = u_doc.to_dict().get("groupId")
    except Exception:
        pass

    await ws.send(json.dumps({"type": "ready", "uid": uid, "is_staff": is_staff}))

    # ── Step 2: Chat loop ─────────────────────────────────────────
    history: list[dict] = []

    try:
        async for raw_msg in ws:
            try:
                msg = json.loads(raw_msg)
            except json.JSONDecodeError:
                continue

            mtype = msg.get("type")

            if mtype == "ping":
                await ws.send(json.dumps({"type": "pong"}))
                continue

            if mtype != "message":
                continue

            content = msg.get("content", "").strip()
            if not content:
                continue

            log.info(f"  💬 {uid}: {content[:80]!r}")
            full_resp = ""

            try:
                async for chunk in stream_rag_response(
                    user_message=content,
                    uid=uid,
                    group_id=group_id,
                    is_staff=is_staff,
                    chat_history=history,
                ):
                    await ws.send(json.dumps({"type": "chunk", "content": chunk}))
                    full_resp += chunk
            except Exception as e:
                log.error(f"  ✖ Stream error: {e}")
                await ws.send(json.dumps({"type": "error", "content": str(e)}))

            await ws.send(json.dumps({"type": "done"}))

            # Maintain rolling history (last 10 turns)
            history.extend([
                {"role": "user",  "content": content},
                {"role": "model", "content": full_resp},
            ])
            if len(history) > 20:
                history = history[-20:]

    except websockets.exceptions.ConnectionClosed as e:
        log.info(f"📴 Disconnected uid={uid} code={e.code}")


# ── Entry point ───────────────────────────────────────────────────
async def main() -> None:
    loop = asyncio.get_event_loop()

    # 1. Sync all existing Firestore data
    await _bulk_sync()

    # 2. Start real-time Firestore listeners
    unsubs = setup_sync_listeners(db, loop)
    log.info(f"✅ Real-time sync active — {len(unsubs)} collections")

    # 3. Start WebSocket server
    log.info(f"🚀 RAG Chat server  →  ws://{WS_HOST}:{WS_PORT}")

    async with websockets.serve(_handler, WS_HOST, WS_PORT):
        try:
            await asyncio.Future()   # run forever
        except (KeyboardInterrupt, asyncio.CancelledError):
            pass
        finally:
            log.info("🛑 Shutting down — unsubscribing Firestore listeners…")
            for unsub in unsubs:
                try:
                    unsub()
                except Exception:
                    pass


if __name__ == "__main__":
    asyncio.run(main())
