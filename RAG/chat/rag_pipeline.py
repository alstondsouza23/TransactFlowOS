"""
RAG/chat/rag_pipeline.py
Full RAG pipeline using direct Gemini REST API (no SDK):
  1. Embed user query via embedder.py (embedContent REST)
  2. Search Pinecone with access-control metadata filter
  3. Build context prompt from retrieved chunks
  4. Stream Gemini 1.5 Flash response via streamGenerateContent SSE
"""

import asyncio
import json
import logging
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import GEMINI_API_KEY, GENERATION_MODEL

import httpx
from sync.embedder import embed_query
from sync.pinecone_store import query_vectors

log = logging.getLogger("rag.chat")

_GEN_MODEL_ID = GENERATION_MODEL.replace("models/", "") if GENERATION_MODEL.startswith("models/") else GENERATION_MODEL
_GEN_URL      = f"https://generativelanguage.googleapis.com/v1beta/models/{_GEN_MODEL_ID}:streamGenerateContent?alt=sse"
_HEADERS      = {"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"}

# ── System prompts ────────────────────────────────────────────────

_MEMBER_SYSTEM = (
    "You are a helpful financial assistant for TransactFlowOS — a community savings and "
    "loan platform (chit fund). Help members understand their account, KYC status, loans, "
    "auctions, and bids.\n"
    "Rules:\n"
    "- Answer ONLY based on the context provided. Do not invent data.\n"
    "- If context lacks info, say: \"I don't have that information right now.\"\n"
    "- Be concise, friendly, and professional.\n"
    "- Format Indian currency as ₹X,XX,XXX.\n"
    "- Never reveal other members' private data."
)

_STAFF_SYSTEM = (
    "You are an AI assistant for TransactFlowOS employees and administrators.\n"
    "Help staff with KYC reviews, loan decisions, recovery cases, auction results, and audit logs.\n"
    "Rules:\n"
    "- Answer ONLY based on the provided context. Do not invent data.\n"
    "- Be precise, data-driven, and professional.\n"
    "- Format Indian currency as ₹X,XX,XXX.\n"
    "- You have full visibility over all member data."
)


# ── Access-control Pinecone filter ────────────────────────────────

def _build_filter(uid: str, group_id: str | None, is_staff: bool) -> dict | None:
    if is_staff:
        return None  # staff sees everything

    if group_id:
        return {
            "$or": [
                {"uid": {"$eq": uid}},
                {
                    "$and": [
                        {"access":   {"$in": ["group"]}},
                        {"group_id": {"$eq": group_id}},
                    ]
                },
            ]
        }
    return {"uid": {"$eq": uid}}


# ── Generation via streaming REST API ────────────────────────────


async def _stream_generate(prompt: str, system: str):
    """
    Yields text tokens from Gemini via SSE (v1beta).
    Retries up to 3× on 429 with exponential backoff.
    """
    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.25, "maxOutputTokens": 1024},
    }

    for attempt, wait in enumerate([0, 5, 15, 30]):
        if wait:
            log.warning(f"[rag] 429 on generation — waiting {wait}s (attempt {attempt})")
            await asyncio.sleep(wait)
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                async with client.stream("POST", _GEN_URL, json=payload, headers=_HEADERS) as resp:
                    if resp.status_code == 429:
                        retry_after = int(resp.headers.get("retry-after", wait or 5))
                        await resp.aread()
                        await asyncio.sleep(retry_after)
                        continue
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        raw = line[5:].strip()
                        if not raw or raw == "[DONE]":
                            continue
                        try:
                            for cand in json.loads(raw).get("candidates", []):
                                for part in cand.get("content", {}).get("parts", []):
                                    txt = part.get("text", "")
                                    if txt:
                                        yield txt
                        except json.JSONDecodeError:
                            continue
            return  # success
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and attempt < 3:
                continue
            log.error(f"[rag] HTTP error: {e}")
            yield "\n\n⚠️ Generation failed. Please wait a moment and try again."
            return
        except Exception as e:
            log.error(f"[rag] Stream error: {e}")
            yield f"\n\n⚠️ Error: {e}"
            return


# ── Main RAG pipeline ─────────────────────────────────────────────

async def stream_rag_response(
    user_message: str,
    uid: str,
    group_id: str | None,
    is_staff: bool,
    chat_history: list[dict],
):
    """
    Async generator — yields text chunks as Gemini streams them.
    chat_history: [{ "role": "user"|"model", "content": "..." }]
    """
    log.info(f"[rag] uid={uid} staff={is_staff} q={user_message[:60]!r}")

    # 1. Embed query
    try:
        q_emb = await embed_query(user_message)
    except Exception as e:
        log.error(f"[rag] Embed failed: {e}")
        yield "⚠️ Could not process your message. Please try again."
        return

    # 2. Search Pinecone
    try:
        chunks = query_vectors(
            embedding=q_emb,
            top_k=6,
            filter_dict=_build_filter(uid, group_id, is_staff),
        )
    except Exception as e:
        log.error(f"[rag] Pinecone query failed: {e}")
        yield "⚠️ Could not retrieve data. Please try again."
        return

    # 3. Build context (only include sufficiently similar chunks)
    ctx_parts = [
        f"[{i+1}] {c['text']}"
        for i, c in enumerate(chunks)
        if c.get("score", 0) > 0.35 and c.get("text")
    ]
    context = "\n\n".join(ctx_parts) if ctx_parts else "No relevant records found."

    # 4. Assemble prompt with rolling history
    history_text = ""
    for msg in chat_history[-8:]:
        role = "User" if msg["role"] == "user" else "Assistant"
        history_text += f"\n{role}: {msg['content']}"

    full_prompt = (
        (f"Conversation history:{history_text}\n\n" if history_text else "")
        + f"Context from TransactFlowOS database:\n{context}\n\n"
        + f"User question: {user_message}"
    )

    # 5. Stream response
    system = _STAFF_SYSTEM if is_staff else _MEMBER_SYSTEM
    async for token in _stream_generate(full_prompt, system):
        yield token
