"""
Backend/main.py — TransactFlowOS WebSocket Server
==================================================
Run with:  python main.py

Flow
----
1. Client connects over ws://localhost:8080
2. Client sends first message: { "type": "auth", "token": "<Firebase ID token>" }
3. Server verifies the token via Firebase Admin SDK
4. Server sends initial snapshots of all Firestore collections
5. Server registers Firestore onSnapshot listeners → pushes live updates
6. Server listens for action messages (approve KYC, fast-track loan, move recovery)
7. On disconnect, all listeners are cleaned up
"""

import asyncio
import json
import logging
import os
import threading
from datetime import datetime, timezone
from typing import Optional

import websockets
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials, firestore as fa_firestore

from handlers.kyc_handler import approve_kyc, reject_kyc
from handlers.loan_handler import fast_track_approve
from handlers.recovery_handler import move_stage

# ─────────────────────────────────────────────────────────────────
# Bootstrap
# ─────────────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("transactflow-ws")

# ─────────────────────────────────────────────────────────────────
# Firebase Admin init
#
# Two credential strategies (tried in order):
#   1. FIREBASE_CREDENTIALS_JSON env var — full JSON string.
#      Set this in Render / any cloud host (paste the service-account
#      JSON as a single-line string in the env var).
#   2. Local file pointed to by GOOGLE_APPLICATION_CREDENTIALS
#      (defaults to serviceAccountKey.json for local dev).
# ─────────────────────────────────────────────────────────────────
if not firebase_admin._apps:
    _cred_json_str = os.getenv("FIREBASE_CREDENTIALS_JSON", "")
    if _cred_json_str:
        # Cloud deployment: credentials stored as env-var JSON string
        import json as _json
        _cred_dict = _json.loads(_cred_json_str)
        cred = credentials.Certificate(_cred_dict)
        log.info("✅ Firebase Admin SDK initialised (env-var credentials)")
    else:
        # Local dev: read from serviceAccountKey.json file
        _cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
        if not os.path.exists(_cred_path):
            log.error(
                f"❌ Service account key not found: '{_cred_path}'\n"
                "   → For local dev: place serviceAccountKey.json in Backend/\n"
                "   → For Render:    set FIREBASE_CREDENTIALS_JSON env var"
            )
            raise FileNotFoundError(f"No Firebase credentials: {_cred_path}")
        cred = credentials.Certificate(_cred_path)
        log.info(f"✅ Firebase Admin SDK initialised (file: {_cred_path})")
    firebase_admin.initialize_app(cred)

db = fa_firestore.client()

# Render assigns PORT automatically; fall back to 8080 for local dev.
# Host must be 0.0.0.0 on Render so the container accepts external traffic.
WS_HOST = os.getenv("WS_HOST", "0.0.0.0")
WS_PORT = int(os.getenv("PORT", os.getenv("WS_PORT", "8080")))
AUTH_TIMEOUT_SECONDS = 15

# ─────────────────────────────────────────────────────────────────
# Connection registry — uid → set of websocket objects
# ─────────────────────────────────────────────────────────────────
_connections: dict[str, set] = {}  # uid → {ws, ...}
_connections_lock = threading.Lock()

def _register(uid: str, ws) -> None:
    with _connections_lock:
        _connections.setdefault(uid, set()).add(ws)

def _unregister(uid: str, ws) -> None:
    with _connections_lock:
        if uid in _connections:
            _connections[uid].discard(ws)
            if not _connections[uid]:
                del _connections[uid]

def _all_websockets():
    with _connections_lock:
        return [ws for sockets in _connections.values() for ws in sockets]

# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────
def _ts(dt) -> Optional[str]:
    """Convert Firestore Timestamp / datetime to ISO string, handling None."""
    if dt is None:
        return None
    if hasattr(dt, "isoformat"):
        return dt.isoformat()
    # google.protobuf.timestamp.Timestamp
    try:
        return dt.ToDatetime(tzinfo=timezone.utc).isoformat()
    except Exception:
        return str(dt)


def _serialise_doc(doc) -> dict:
    """
    Convert a Firestore DocumentSnapshot to a JSON-safe dict.
    Timestamps are converted to ISO strings.
    """
    data = doc.to_dict() or {}
    safe = {"id": doc.id}
    for k, v in data.items():
        if hasattr(v, "isoformat") or hasattr(v, "ToDatetime"):
            safe[k] = _ts(v)
        else:
            safe[k] = v
    return safe


async def _send(ws, channel: str, event: str, payload) -> None:
    """Send a typed JSON message to one websocket. Silently ignores closed sockets."""
    try:
        await ws.send(json.dumps({
            "channel": channel,
            "event": event,
            "payload": payload,
        }))
    except websockets.exceptions.ConnectionClosed:
        pass


async def _broadcast(channel: str, event: str, payload) -> None:
    """Broadcast a message to every authenticated connection."""
    loop = asyncio.get_event_loop()
    sockets = _all_websockets()
    tasks = [_send(ws, channel, event, payload) for ws in sockets]
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

# ─────────────────────────────────────────────────────────────────
# Firestore → asyncio bridge
# ─────────────────────────────────────────────────────────────────
def _throttle_broadcast(loop, channel: str, event: str, payload: dict) -> None:
    """
    Called from Firestore's background thread.
    Schedules a coroutine on the asyncio event loop (thread-safe).
    """
    asyncio.run_coroutine_threadsafe(_broadcast(channel, event, payload), loop)

# ─────────────────────────────────────────────────────────────────
# Initial snapshot sender
# ─────────────────────────────────────────────────────────────────
async def send_snapshots(ws) -> None:
    """
    Read every collection once and send the full list to the newly
    authenticated client as a "snapshot" event.
    """
    loop = asyncio.get_event_loop()

    async def _fetch_and_send(collection: str, channel: str):
        docs = await loop.run_in_executor(
            None,
            lambda: [_serialise_doc(d) for d in db.collection(collection).stream()],
        )
        await _send(ws, channel, "snapshot", docs)

    async def _fetch_kernel():
        doc = await loop.run_in_executor(
            None,
            lambda: db.collection("kernel_state").document("live").get(),
        )
        payload = _serialise_doc(doc) if doc.exists else {}
        await _send(ws, "kernel_state", "snapshot", payload)

    await asyncio.gather(
        _fetch_and_send("loan_applications", "loan_inbox"),
        _fetch_and_send("audit_log",         "audit_stream"),
        _fetch_and_send("recovery_cases",    "recovery_board"),
        _fetch_and_send("kyc_queue",         "kyc_queue"),
        _fetch_kernel(),
    )
    log.info("  ↳ snapshots sent")

# ─────────────────────────────────────────────────────────────────
# Firestore listeners
# ─────────────────────────────────────────────────────────────────
def setup_listeners(loop: asyncio.AbstractEventLoop) -> list:
    """
    Register Firestore onSnapshot listeners for all collections.
    Returns a list of unsubscribe callables.
    """
    unsubscribers = []

    def _collection_listener(channel: str):
        """
        Factory: returns a Firestore on_snapshot callback that broadcasts
        individual document changes (add / modify / remove).
        """
        def _on_snapshot(col_snapshot, changes, read_time):
            for change in changes:
                doc = change.document
                payload = _serialise_doc(doc)
                if change.type.name == "ADDED":
                    _throttle_broadcast(loop, channel, "update", payload)
                elif change.type.name == "MODIFIED":
                    _throttle_broadcast(loop, channel, "update", payload)
                elif change.type.name == "REMOVED":
                    _throttle_broadcast(loop, channel, "delete", {"id": doc.id})
        return _on_snapshot

    # loan_applications
    unsubscribers.append(
        db.collection("loan_applications").on_snapshot(
            _collection_listener("loan_inbox")
        )
    )
    # audit_log (latest 50 only to avoid huge payloads)
    unsubscribers.append(
        db.collection("audit_log")
          .order_by("timestamp", direction=fa_firestore.Query.DESCENDING)
          .limit(50)
          .on_snapshot(_collection_listener("audit_stream"))
    )
    # recovery_cases
    unsubscribers.append(
        db.collection("recovery_cases").on_snapshot(
            _collection_listener("recovery_board")
        )
    )
    # kyc_queue
    unsubscribers.append(
        db.collection("kyc_queue").on_snapshot(
            _collection_listener("kyc_queue")
        )
    )
    # kernel_state/live — single document listener
    def _on_kernel_snapshot(doc_snapshot, changes, read_time):
        for doc in doc_snapshot:
            if doc.id == "live":
                _throttle_broadcast(loop, "kernel_state", "update", _serialise_doc(doc))

    unsubscribers.append(
        db.collection("kernel_state").on_snapshot(_on_kernel_snapshot)
    )

    log.info("✅ Firestore onSnapshot listeners registered")
    return unsubscribers

# ─────────────────────────────────────────────────────────────────
# Action router
# ─────────────────────────────────────────────────────────────────
async def handle_action(ws, uid: str, display_name: str, msg: dict) -> None:
    """
    Route an incoming action message to the correct handler, then
    broadcast the ACK to all connected clients.
    """
    channel = msg.get("channel")
    action  = msg.get("action")
    payload = msg.get("payload", {})

    log.info(f"  ⚡ action [{channel}:{action}] uid={uid} payload={payload}")

    try:
        if channel == "kyc_queue":
            doc_id = payload.get("id")
            if action == "approve":
                updated = await approve_kyc(doc_id, uid, display_name)
                await _broadcast("kyc_queue", "action_ack", {
                    "id": doc_id, "new_status": "Approved", "doc": updated
                })
            elif action == "reject":
                reason  = payload.get("reason", "No reason provided")
                updated = await reject_kyc(doc_id, reason, uid, display_name)
                await _broadcast("kyc_queue", "action_ack", {
                    "id": doc_id, "new_status": "Rejected",
                    "rejection_reason": reason, "doc": updated
                })

        elif channel == "loan_inbox":
            doc_id = payload.get("id")
            if action == "fast_track":
                updated = await fast_track_approve(doc_id, uid, display_name)
                await _broadcast("loan_inbox", "action_ack", {
                    "id": doc_id, "new_status": "Verified", "doc": updated
                })

        elif channel == "recovery_board":
            doc_id    = payload.get("id")
            new_stage = payload.get("new_stage")
            if action == "move_stage":
                updated = await move_stage(doc_id, new_stage, uid, display_name)
                await _broadcast("recovery_board", "action_ack", {
                    "id": doc_id, "new_stage": new_stage, "doc": updated
                })

        else:
            log.warning(f"  ⚠ Unknown channel in action: {channel}")

    except Exception as exc:
        log.error(f"  ✖ Error handling action [{channel}:{action}]: {exc}")
        await _send(ws, "error", "action_failed", {
            "channel": channel, "action": action, "error": str(exc)
        })

# ─────────────────────────────────────────────────────────────────
# Authentication
# ─────────────────────────────────────────────────────────────────
async def authenticate(ws) -> Optional[tuple[str, str, str]]:
    """
    Wait for the client's auth message, verify the Firebase ID token.

    Returns (uid, email, display_name) on success, or None on failure / timeout.
    """
    try:
        raw = await asyncio.wait_for(ws.recv(), timeout=AUTH_TIMEOUT_SECONDS)
        msg = json.loads(raw)
    except asyncio.TimeoutError:
        log.warning("  ✖ Auth timeout — closing connection")
        await ws.close(1008, "Auth timeout")
        return None
    except json.JSONDecodeError:
        log.warning("  ✖ Invalid JSON in auth message")
        await ws.close(1003, "Invalid JSON")
        return None

    if msg.get("type") != "auth":
        log.warning(f"  ✖ Expected auth message, got: {msg.get('type')}")
        await ws.close(1008, "Expected auth message")
        return None

    token = msg.get("token")
    if not token:
        await ws.close(1008, "Missing token")
        return None

    try:
        decoded = firebase_auth.verify_id_token(token)
        uid   = decoded["uid"]
        email = decoded.get("email", "")
        name  = decoded.get("name", email.split("@")[0])
        log.info(f"  ✅ Authenticated: uid={uid}  email={email}")
        await _send(ws, "system", "authenticated", {"uid": uid, "email": email})
        return uid, email, name
    except firebase_auth.InvalidIdTokenError as exc:
        log.warning(f"  ✖ Invalid ID token: {exc}")
        await _send(ws, "system", "auth_failed", {"error": "Invalid token"})
        await ws.close(1008, "Invalid token")
        return None
    except Exception as exc:
        log.error(f"  ✖ Token verification error: {exc}")
        await ws.close(1011, "Server error during auth")
        return None

# ─────────────────────────────────────────────────────────────────
# Per-connection handler
# ─────────────────────────────────────────────────────────────────
async def handler(ws) -> None:
    """
    Lifecycle of a single WebSocket connection:
      connect → auth → snapshot → listen for actions → disconnect
    """
    remote = ws.remote_address
    log.info(f"🔌 New connection from {remote}")

    # 1. Authenticate
    result = await authenticate(ws)
    if result is None:
        return
    uid, email, display_name = result

    # 2. Register
    _register(uid, ws)
    log.info(f"  👤 Registered uid={uid} ({len(_all_websockets())} total connections)")

    # 3. Send initial snapshots
    await send_snapshots(ws)

    # 4. Receive action messages until disconnect
    try:
        async for raw_msg in ws:
            try:
                msg = json.loads(raw_msg)
            except json.JSONDecodeError:
                log.warning(f"  ⚠ Malformed JSON from {uid}")
                continue

            msg_type = msg.get("type")
            if msg_type == "ping":
                await _send(ws, "system", "pong", {"ts": datetime.now(timezone.utc).isoformat()})
            elif "action" in msg:
                await handle_action(ws, uid, display_name, msg)
            else:
                log.warning(f"  ⚠ Unhandled message type from {uid}: {msg}")

    except websockets.exceptions.ConnectionClosed as exc:
        log.info(f"📴 Connection closed: uid={uid} code={exc.code}")
    finally:
        _unregister(uid, ws)
        log.info(f"  🗑  Unregistered uid={uid} ({len(_all_websockets())} total connections)")

# ─────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────
async def main() -> None:
    loop = asyncio.get_event_loop()

    # Register Firestore listeners once — they broadcast to ALL clients
    unsubscribers = setup_listeners(loop)

    log.info(f"🚀 TransactFlowOS WS Server listening on ws://{WS_HOST}:{WS_PORT}")
    log.info("   Waiting for connections… (Ctrl+C to stop)")

    async with websockets.serve(handler, WS_HOST, WS_PORT):
        try:
            await asyncio.Future()   # run forever
        except (KeyboardInterrupt, asyncio.CancelledError):
            pass
        finally:
            log.info("🛑 Shutting down — unsubscribing Firestore listeners…")
            for unsub in unsubscribers:
                try:
                    unsub()
                except Exception:
                    pass


if __name__ == "__main__":
    asyncio.run(main())
