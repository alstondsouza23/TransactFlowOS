"""
Backend/handlers/auction.py
============================
Auction action handlers for TransactFlowOS WebSocket server.

All public handler functions receive the broadcast callables from main.py
so they can push events directly to connected clients.

Dispatch entry point (called from main.py handle_action):
    handle_auction_action(ws, action, payload, uid, display_name,
                          send_fn, broadcast_to_group_fn, connections)
"""

import asyncio
import json
import logging
from datetime import datetime, timezone

from firebase_admin import firestore as fa_firestore

db  = fa_firestore.client()
log = logging.getLogger("transactflow-ws.auction")

# ── Member-number cache: (uid, group_id) → 1-based int ───────────────────────
_member_number_cache: dict[tuple, int] = {}


# ─────────────────────────────────────────────────────────────────
# Internal utilities
# ─────────────────────────────────────────────────────────────────

def _exe(fn):
    """Run a synchronous Firestore call in the default thread executor."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(None, fn)


def _serialise(doc) -> dict:
    """Convert a Firestore DocumentSnapshot to a JSON-safe dict."""
    data = doc.to_dict() or {}
    safe = {"id": doc.id}
    for k, v in data.items():
        if v is None:
            safe[k] = None
        elif hasattr(v, "isoformat"):
            safe[k] = v.isoformat()
        elif hasattr(v, "ToDatetime"):
            try:
                safe[k] = v.ToDatetime(tzinfo=timezone.utc).isoformat()
            except Exception:
                safe[k] = str(v)
        else:
            safe[k] = v
    return safe


async def get_member_number(uid: str, group_id: str) -> int:
    """
    Return the 1-based index of uid within the group ordered by createdAt.
    All members of the group are cached on first call.
    """
    if (uid, group_id) in _member_number_cache:
        return _member_number_cache[(uid, group_id)]

    members = await _exe(
        lambda: list(
            db.collection("users")
              .where("groupId", "==", group_id)
              .order_by("createdAt")
              .stream()
        )
    )
    for i, m in enumerate(members, 1):
        _member_number_cache[(m.id, group_id)] = i

    return _member_number_cache.get((uid, group_id), 0)


def _alias(member_number: int, uid: str) -> str:
    return f"Member {member_number}" if member_number else f"Member {uid[:4].upper()}"


# ─────────────────────────────────────────────────────────────────
# Main dispatch
# ─────────────────────────────────────────────────────────────────

async def handle_auction_action(
    ws, action: str, payload: dict,
    uid: str, display_name: str,
    send_fn, broadcast_to_group_fn, connections: dict
):
    """Route an auction_room action to the correct handler."""
    if   action == "create_auction": await handle_create_auction(ws, payload, uid, display_name, send_fn, broadcast_to_group_fn)
    elif action == "open_auction":   await handle_open_auction(ws, payload, uid, display_name, send_fn, broadcast_to_group_fn, connections)
    elif action == "place_bid":      await handle_place_bid(ws, payload, uid, display_name, send_fn, broadcast_to_group_fn)
    elif action == "force_close":    await handle_force_close(ws, payload, uid, display_name, send_fn, broadcast_to_group_fn, connections)
    elif action == "cancel_auction": await handle_cancel_auction(ws, payload, uid, display_name, send_fn, broadcast_to_group_fn)
    else:
        log.warning(f"[auction] Unknown action: {action}")
        await send_fn(ws, "auction_room", "error", {"message": f"Unknown auction action: {action}"})


# ─────────────────────────────────────────────────────────────────
# 1. Create Auction  (employee → scheduled)
# ─────────────────────────────────────────────────────────────────

async def handle_create_auction(ws, payload: dict, uid: str, display_name: str,
                                 send_fn, broadcast_to_group_fn):
    group_id      = payload.get("groupId", "GRP-001")
    cycle_number  = int(payload.get("cycleNumber", 1))
    month_label   = payload.get("monthLabel", "")
    pot_amount    = int(payload.get("potAmountINR", 0))
    scheduled_iso = payload.get("scheduledFor")
    duration_min  = int(payload.get("durationMinutes", 60))

    if pot_amount <= 0:
        await send_fn(ws, "auction_room", "create_error", {"message": "Pot amount must be positive"})
        return

    try:
        sched_dt = datetime.fromisoformat(str(scheduled_iso).replace("Z", "+00:00"))
    except Exception:
        sched_dt = datetime.now(timezone.utc)

    # Create Firestore document
    doc_ref = db.collection("auctions").document()
    auction_doc = {
        "groupId":         group_id,
        "cycleNumber":     cycle_number,
        "monthLabel":      month_label,
        "status":          "scheduled",
        "potAmountINR":    pot_amount,
        "openedAt":        None,
        "closedAt":        None,
        "createdBy":       uid,
        "winnerId":        None,
        "winnerName":      None,
        "winningBidINR":   None,
        "discountINR":     None,
        "discountPct":     None,
        "scheduledFor":    sched_dt,
        "durationMinutes": duration_min,
    }
    await _exe(lambda: doc_ref.set(auction_doc))
    log.info(f"[auction] Created {doc_ref.id} for group={group_id} pot=₹{pot_amount}")

    # Fetch freshly to get server-serialised timestamps
    created = await _exe(lambda: doc_ref.get())
    safe    = _serialise(created)

    # Send directly back to the employee who created it (so they see it
    # regardless of whether their user doc has groupId set).
    await send_fn(ws, "auction_room", "auction_scheduled", safe)

    # Broadcast to all group members so Client apps update immediately.
    await broadcast_to_group_fn(group_id, "auction_room", "auction_scheduled", safe)
    log.info(f"[auction] Broadcasted auction_scheduled for {doc_ref.id} to group={group_id}")


# ─────────────────────────────────────────────────────────────────
# 2. Open Auction  (employee → open + countdown task)
# ─────────────────────────────────────────────────────────────────

async def handle_open_auction(ws, payload: dict, uid: str, display_name: str,
                               send_fn, broadcast_to_group_fn, connections: dict):
    auction_id = payload.get("auctionId")
    if not auction_id:
        await send_fn(ws, "auction_room", "open_error", {"message": "auctionId required"})
        return

    auction_doc = await _exe(lambda: db.collection("auctions").document(auction_id).get())
    if not auction_doc.exists:
        await send_fn(ws, "auction_room", "open_error", {"message": "Auction not found"})
        return

    data         = auction_doc.to_dict()
    group_id     = data.get("groupId", "GRP-001")
    duration_min = int(data.get("durationMinutes", 60))
    opened_at    = datetime.now(timezone.utc)

    await _exe(lambda: db.collection("auctions").document(auction_id).update({
        "status":   "open",
        "openedAt": fa_firestore.SERVER_TIMESTAMP,
    }))
    log.info(f"[auction] Opened {auction_id} ({duration_min} min)")

    updated = await _exe(lambda: db.collection("auctions").document(auction_id).get())
    safe    = _serialise(updated)
    safe.setdefault("openedAt", opened_at.isoformat())
    await broadcast_to_group_fn(group_id, "auction_room", "auction_opened", safe)

    # Auto-close countdown
    asyncio.create_task(
        _auction_countdown(auction_id, group_id, duration_min,
                           broadcast_to_group_fn, connections)
    )


async def _auction_countdown(auction_id: str, group_id: str, duration_min: int,
                              broadcast_to_group_fn, connections: dict):
    """Sleep then auto-close if still open."""
    await asyncio.sleep(duration_min * 60)
    try:
        a = await _exe(lambda: db.collection("auctions").document(auction_id).get())
        if a.exists and a.to_dict().get("status") == "open":
            log.info(f"[auction] Countdown done — auto-closing {auction_id}")
            await handle_close_auction_internal(auction_id, group_id,
                                                broadcast_to_group_fn, connections)
    except Exception as exc:
        log.error(f"[auction] Countdown error for {auction_id}: {exc}")


# ─────────────────────────────────────────────────────────────────
# 3. Place Bid  (member → bid upsert + leader broadcast)
# ─────────────────────────────────────────────────────────────────

async def handle_place_bid(ws, payload: dict, uid: str, display_name: str,
                            send_fn, broadcast_to_group_fn):
    auction_id     = payload.get("auctionId")
    group_id       = payload.get("groupId", "GRP-001")
    bidder_uid     = payload.get("bidderUid", uid)
    bidder_name    = payload.get("bidderName", display_name)
    bid_amount     = int(payload.get("bidAmountINR", 0))

    # ── Validate: auction open ─────────────────────────────────────
    a_doc = await _exe(lambda: db.collection("auctions").document(auction_id).get())
    if not a_doc.exists or a_doc.to_dict().get("status") != "open":
        await send_fn(ws, "auction_room", "bid_error", {"message": "Auction is not open for bidding"})
        return

    if bid_amount <= 0:
        await send_fn(ws, "auction_room", "bid_error",
                      {"message": "Bid amount must be greater than ₹0"})
        return

    # ── Validate: not already prized ──────────────────────────────
    u_doc = await _exe(lambda: db.collection("users").document(bidder_uid).get())
    if u_doc.exists and u_doc.to_dict().get("prizedInCycle") is True:
        await send_fn(ws, "auction_room", "bid_error",
                      {"message": "You have already won a cycle and cannot bid again"})
        return

    # ── Upsert bid ────────────────────────────────────────────────
    existing = await _exe(lambda: list(
        db.collection("bids")
          .where("auctionId",  "==", auction_id)
          .where("bidderUid",  "==", bidder_uid)
          .stream()
    ))

    now = datetime.now(timezone.utc)
    if existing:
        bid_id  = existing[0].id
        await _exe(lambda: db.collection("bids").document(bid_id).update({
            "bidAmountINR":    bid_amount,
            "placedAt":        fa_firestore.SERVER_TIMESTAMP,
        }))
        log.info(f"[auction] Bid updated: uid={bidder_uid} amount=₹{bid_amount}")
    else:
        await _exe(lambda: db.collection("bids").add({
            "auctionId":       auction_id,
            "groupId":         group_id,
            "bidderUid":       bidder_uid,
            "bidderName":      bidder_name,
            "bidAmountINR":    bid_amount,
            "placedAt":        fa_firestore.SERVER_TIMESTAMP,
            "isWinning":       False,
        }))
        log.info(f"[auction] Bid placed: uid={bidder_uid} amount=₹{bid_amount}")

    # ── Broadcast anonymised bid_update to group ──────────────────
    member_num = await get_member_number(bidder_uid, group_id)
    alias      = _alias(member_num, bidder_uid)

    await broadcast_to_group_fn(group_id, "auction_room", "bid_update", {
        "auctionId":       auction_id,
        "bidderUid":       bidder_uid,
        "alias":           alias,
        "bidAmountINR":    bid_amount,
        "placedAt":        now.isoformat(),
    })

    # ── Recompute leader = HIGHEST bid ────────────────────────────
    top = await _exe(lambda: list(
        db.collection("bids")
          .where("auctionId", "==", auction_id)
          .order_by("bidAmountINR", direction=fa_firestore.Query.DESCENDING)
          .limit(1)
          .stream()
    ))
    if top:
        ld          = top[0].to_dict()
        leader_uid  = ld.get("bidderUid", "")
        leader_num  = await get_member_number(leader_uid, group_id)
        await broadcast_to_group_fn(group_id, "auction_room", "leader_update", {
            "auctionId":   auction_id,
            "leaderAlias": _alias(leader_num, leader_uid),
            "leadingBid":  int(ld.get("bidAmountINR", 0)),
        })


# ─────────────────────────────────────────────────────────────────
# 4. Force Close  (employee action)
# ─────────────────────────────────────────────────────────────────

async def handle_force_close(ws, payload: dict, uid: str, display_name: str,
                              send_fn, broadcast_to_group_fn, connections: dict):
    auction_id = payload.get("auctionId")
    group_id   = payload.get("groupId", "GRP-001")
    if not auction_id:
        await send_fn(ws, "auction_room", "force_close_error", {"message": "auctionId required"})
        return
    log.info(f"[auction] Force-close by {uid} for auction={auction_id}")
    await handle_close_auction_internal(auction_id, group_id, broadcast_to_group_fn, connections)


# ─────────────────────────────────────────────────────────────────
# 5. Cancel Auction  (employee action)
# ─────────────────────────────────────────────────────────────────

async def handle_cancel_auction(ws, payload: dict, uid: str, display_name: str,
                                 send_fn, broadcast_to_group_fn):
    auction_id = payload.get("auctionId")
    group_id   = payload.get("groupId", "GRP-001")
    reason     = payload.get("reason", "Cancelled by admin")
    if not auction_id:
        await send_fn(ws, "auction_room", "cancel_error", {"message": "auctionId required"})
        return

    await _exe(lambda: db.collection("auctions").document(auction_id).update({
        "status":       "cancelled",
        "closedAt":     fa_firestore.SERVER_TIMESTAMP,
        "cancelReason": reason,
    }))
    log.info(f"[auction] Cancelled {auction_id} by {uid}: {reason}")

    await broadcast_to_group_fn(group_id, "auction_room", "auction_cancelled", {
        "auctionId": auction_id,
        "reason":    reason,
    })


# ─────────────────────────────────────────────────────────────────
# Internal: Close + compute winner
# ─────────────────────────────────────────────────────────────────

async def handle_close_auction_internal(auction_id: str, group_id: str,
                                         broadcast_to_group_fn, connections: dict):
    """
    Query bids → pick winner (highest bid wins) →
    update all relevant documents → broadcast results.
    """
    a_doc = await _exe(lambda: db.collection("auctions").document(auction_id).get())
    if not a_doc.exists:
        log.warning(f"[auction] close_internal: {auction_id} not found")
        return
    if a_doc.to_dict().get("status") != "open":
        log.info(f"[auction] close_internal: {auction_id} already {a_doc.to_dict().get('status')}")
        return

    # All bids ordered DESC — highest bid = winner
    all_bids = await _exe(lambda: list(
        db.collection("bids")
          .where("auctionId", "==", auction_id)
          .order_by("bidAmountINR", direction=fa_firestore.Query.DESCENDING)
          .limit(1)
          .stream()
    ))

    if not all_bids:
        log.info(f"[auction] No bids for {auction_id} — staying open")
        await broadcast_to_group_fn(group_id, "auction_room", "auction_no_bids",
                                    {"auctionId": auction_id})
        return

    # Winner = first result (HIGHEST bid wins)
    winner_bid_doc   = all_bids[0]
    w                = winner_bid_doc.to_dict()
    winner_uid       = w.get("bidderUid", "")
    winner_name      = w.get("bidderName", "Unknown")
    winning_bid_inr  = int(w.get("bidAmountINR", 0))

    # ── Update auction ─────────────────────────────────────────────
    await _exe(lambda: db.collection("auctions").document(auction_id).update({
        "status":        "closed",
        "closedAt":      fa_firestore.SERVER_TIMESTAMP,
        "winnerId":      winner_uid,
        "winnerName":    winner_name,
        "winningBidINR": winning_bid_inr,
        "discountINR":   discount_inr,
        "discountPct":   discount_pct,
    }))

    # ── Mark winning bid ──────────────────────────────────────────
    await _exe(lambda: db.collection("bids").document(winner_bid_doc.id).update({
        "isWinning": True
    }))

    # ── Mark user as prized ───────────────────────────────────────
    await _exe(lambda: db.collection("users").document(winner_uid).update({
        "prizedInCycle": True,
        "prizedAt":      fa_firestore.SERVER_TIMESTAMP,
    }))

    # ── Update group ───────────────────────────────────────────────
    await _exe(lambda: db.collection("groups").document(group_id).set({
        "prizedMembers": fa_firestore.ArrayUnion([winner_uid]),
        "currentCycle":  fa_firestore.Increment(1),
    }, merge=True))

    # ── Audit log ─────────────────────────────────────────────────
    await _exe(lambda: db.collection("audit_log").add({
        "action":        "AUCTION_CLOSED",
        "action_code":   "AUCTION_CLOSED",
        "entity_type":   "AUCTION",
        "entity_id":     auction_id,
        "auctionId":     auction_id,
        "groupId":       group_id,
        "winnerId":      winner_uid,
        "winnerName":    winner_name,
        "winningBidINR": winning_bid_inr,
        "discountPct":   discount_pct,
        "amount_inr":    winning_bid_inr,
        "details":       f"Auction {auction_id} closed. Winner: {winner_name} (₹{winning_bid_inr:,}, {discount_pct}% discount)",
        "timestamp":     fa_firestore.SERVER_TIMESTAMP,
    }))

    log.info(f"[auction] Closed {auction_id}. Winner={winner_name} ({winner_uid}) ₹{winning_bid_inr}")

    # ── Broadcast auction_closed to all group members ─────────────
    result_payload = {
        "auctionId":     auction_id,
        "winnerId":      winner_uid,
        "winnerName":    winner_name,
        "winningBidINR": winning_bid_inr,
        "discountINR":   discount_inr,
        "discountPct":   discount_pct,
    }
    await broadcast_to_group_fn(group_id, "auction_room", "auction_closed", result_payload)

    # ── Private auction_won to winner (if connected) ──────────────
    winner_sockets = connections.get(winner_uid, set())
    won_msg = json.dumps({
        "channel": "auction_room",
        "event":   "auction_won",
        "payload": {
            **result_payload,
            "message": f"🎉 You won the auction! Your payout of ₹{winning_bid_inr:,} has been scheduled.",
        }
    })
    for winner_ws in list(winner_sockets):
        try:
            await winner_ws.send(won_msg)
        except Exception as exc:
            log.warning(f"[auction] Could not deliver auction_won to {winner_uid}: {exc}")
